// app.js
import express from 'express';
import 'dotenv/config';
import { fetchAccountingDataJson, fetchReferences, getLatestPdfForCbe, pickLatestReference } from './helpers/cbso.js';
import { writePdfBuffer, pdfToPngs } from './helpers/pdfImages.js';
import { uploadImage } from './helpers/cloudy.js';
import fs from 'fs/promises';
import path from 'path';
import { analysePhysicalAssets } from './helpers/openaiHelpers.js';
import BilanFiling from './model/BilanFiling.js';
import { extractQuantitativeFromJson, safeDate } from './helpers/bilanExtract.js';
import connectDB from './db/connect.js';


const app  = express();
const PORT = process.env.PORT || 3000;

/** Validate CBE (10 digits incl. leading zero). */
function validCbe(cbe) {
  return /^\d{10}$/.test(cbe);
}


function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}


/* ---------- DB connection ----------------------------------------- */
await connectDB("mongodb+srv://elmahdibellaziz:hZBzOFRRt3mG7EMW@cluster0.i7ho2iz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log('⇢ MongoDB connected'))
  .catch((e) => { console.error('Mongo connect failed:', e.message); process.exit(1); });


/**
 * GET /bilan/:cbe
 * Runs the 2-step flow internally and streams the latest PDF.
 */
app.get('/bilan/:cbe', async (req, res) => {
  const { cbe } = req.params;

  if (!validCbe(cbe)) {
    return res.status(400).json({ error: 'CBE must be 10 digits (leading zero included).' });
  }

  try {
    const { latest, pdf } = await getLatestPdfForCbe(cbe);

    res
      .status(200)
      .set({
        'Content-Type': pdf.contentType,
        'Content-Length': pdf.contentLength,
        'Content-Disposition': `inline; filename="${cbe}-${latest?.ExerciseDates?.EndDate || 'latest'}-${latest.ReferenceNumber}.pdf"`,
      })
      .send(pdf.buffer);

  } catch (err) {
    console.error('CBSO error:', err);
    const status = err.status || 500;
    const details = err.body
      ? (typeof err.body === 'string' ? err.body : JSON.stringify(err.body))
      : err.message;
    res.status(status).json({
      error: status >= 500 ? 'Server error' : 'CBSO API error',
      status,
      details,
    });
  }
});


// app.get('/bilan/:cbe/json', async (req, res) => {
//   const { cbe } = req.params;

//   if (!validCbe(cbe)) {
//     return res.status(400).json({ error: 'CBE must be 10 digits.' });
//   }

//   try {
//     // 1. Récupération des références
//     const refs = await fetchReferences(cbe);
//     if (!refs?.length) {
//       return res.status(404).json({ error: 'No published annual accounts for this CBE.' });
//     }

//     // 2. Sélection du dernier dépôt
//     const latest = pickLatestReference(refs);
//     if (!latest) {
//       return res.status(404).json({ error: 'Could not determine latest reference.' });
//     }

//     // 3. Tentative de récupération JSON structuré
//     let jsonData = null;
//     let structured = false;
//     try {
//       jsonData = await fetchAccountingDataJson(latest.ReferenceNumber);
//       structured = true;
//     } catch (jsonErr) {
//       if (!(jsonErr.status === 406 || jsonErr.status === 404)) {
//         throw jsonErr; // autre erreur => remonter
//       }
//     }

//     // 4. Analyse IA (uniquement si on a des données structurées)
//     let aiAnalysis = null;
//     if (structured && jsonData) {
//       try {
//         aiAnalysis = await analysePhysicalAssets({
//           meta: {
//             exercise: latest.ExerciseDates,
//             cbe,
//             referenceNumber: latest.ReferenceNumber
//           },
//           accountingData: jsonData
//         });
//       } catch (aiErr) {
//         console.error('AI analysis error:', aiErr);
//         aiAnalysis = null; // ne bloque pas la réponse
//       }
//     }

//     // 5. Réponse JSON
//     if (structured) {
//       return res.json({
//         cbe,
//         aiAnalysis, // <- Texte formaté (ex: "Voici mon analyse détaillée ...")
//         referenceNumber: latest.ReferenceNumber,
//         depositDate: latest.DepositDate,
//         exercise: latest.ExerciseDates,
//         modelType: latest.ModelType,
//         language: latest.Language,
//         currency: latest.Currency,
//         dataVersion: latest.DataVersion,
//         structured: true,
//         accountingData: jsonData,
        
//       });
//     } else {
//       return res.status(200).json({
//         cbe,
//         referenceNumber: latest.ReferenceNumber,
//         structured: false,
//         message: 'Structured JSON not available (filing not XBRL or before cutoff).',
//         hint: 'Request the PDF version instead: /bilan/:cbe (Accept application/pdf).',
//         aiAnalysis: null
//       });
//     }
//   } catch (err) {
//     console.error('CBSO JSON error:', err);
//     const status = err.status || 500;
//     const details = err.body
//       ? (typeof err.body === 'string' ? err.body : JSON.stringify(err.body))
//       : err.message;
//     return res.status(status).json({
//       error: status >= 500 ? 'Server error' : 'CBSO API error',
//       status,
//       details
//     });
//   }
// });
app.get('/bilan/:cbe/json', async (req, res) => {
  const { cbe } = req.params;

  if (!validCbe(cbe)) {
    return res.status(400).json({ error: 'CBE must be 10 digits.' });
  }

  let persistenceError = null;
  let savedDoc = null;

  try {
    // 1. Références disponibles
    const refs = await fetchReferences(cbe);
    if (!refs?.length) {
      return res.status(404).json({ error: 'No published annual accounts for this CBE.' });
    }

    // 2. Choix du dernier dépôt
    const latest = pickLatestReference(refs);
    if (!latest) {
      return res.status(404).json({ error: 'Could not determine latest reference.' });
    }

    // 3. Récup JSON structuré
    let structured = false;
    let jsonData = null;
    try {
      jsonData = await fetchAccountingDataJson(latest.ReferenceNumber);
      structured = true;
    } catch (jsonErr) {
      // 406 / 404 ⇒ pas structuré mais pas une erreur fatale
      if (!(jsonErr.status === 406 || jsonErr.status === 404)) {
        throw jsonErr;
      }
    }

    // 4. Analyse IA (uniquement si structuré)
    let aiAnalysis = null;
    if (structured && jsonData) {
      try {
        aiAnalysis = await analysePhysicalAssets({
          meta: {
            exercise: latest.ExerciseDates,
            cbe,
            referenceNumber: latest.ReferenceNumber
          },
          accountingData: jsonData
        });
      } catch (aiErr) {
        console.error('AI analysis error:', aiErr);
        aiAnalysis = null;
      }
    }

    // 5. Sauvegarde (upsert) – même si non structuré on peut conserver la trace
    try {
      const docPayload = {
        cbe,
        referenceNumber: latest.ReferenceNumber,
        depositDate: safeDate(latest.DepositDate),
        exerciseStart: safeDate(latest?.ExerciseDates?.StartDate || latest?.ExerciseDates?.start),
        exerciseEnd: safeDate(latest?.ExerciseDates?.EndDate || latest?.ExerciseDates?.end),
        currency: latest.Currency,
        modelType: latest.ModelType,
        language: latest.Language,
        dataVersion: latest.DataVersion,
        structured,
        accountingData: structured ? jsonData : undefined,
        aiAnalysis: aiAnalysis || undefined
      };

      // Upsert par (cbe, referenceNumber)
      savedDoc = await BilanFiling.findOneAndUpdate(
        { cbe, referenceNumber: latest.ReferenceNumber },
        { $set: docPayload },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      ).lean();
    } catch (dbErr) {
      persistenceError = dbErr.message;
      console.error('Mongo persistence error:', dbErr);
    }

    // 6. Réponse HTTP
    if (structured) {
      return res.json({
        cbe,
        referenceNumber: latest.ReferenceNumber,
        depositDate: latest.DepositDate,
        exercise: latest.ExerciseDates,
        modelType: latest.ModelType,
        language: latest.Language,
        currency: latest.Currency,
        dataVersion: latest.DataVersion,
        structured: true,
        accountingData: jsonData,
        aiAnalysis,
        saved: !!savedDoc,
        persistenceError
      });
    } else {
      return res.status(200).json({
        cbe,
        referenceNumber: latest.ReferenceNumber,
        structured: false,
        message: 'Structured JSON not available (filing not XBRL or before cutoff).',
        hint: 'Request the PDF version instead: /bilan/:cbe (Accept application/pdf).',
        aiAnalysis: null,
        saved: !!savedDoc,
        persistenceError
      });
    }

  } catch (err) {
    console.error('CBSO JSON error:', err);
    const status = err.status || 500;
    const details = err.body
      ? (typeof err.body === 'string' ? err.body : JSON.stringify(err.body))
      : err.message;

    return res.status(status).json({
      error: status >= 500 ? 'Server error' : 'CBSO API error',
      status,
      details
    });
  }
});


/**
 * GET /bilan/:cbe/images
 * Returns an array of Cloudinary URLs (one per PDF page).
 * Debug logs are printed to console.
 */
app.get('/bilan/:cbe/images', async (req, res) => {
  const { cbe } = req.params;
  if (!/^\d{10}$/.test(cbe)) {
    return res.status(400).json({ error: 'CBE must be 10 digits.' });
  }

  try {
    // 1) reuse wrapper to fetch latest PDF buffer
    const { latest, pdf } = await getLatestPdfForCbe(cbe);
    console.log(`[IMAGES] Got PDF for ${cbe} ref ${latest.ReferenceNumber}, size=${pdf.contentLength}`);

    // 2) write buffer to temp file
    const { pdfPath, tmpDir } = await writePdfBuffer(pdf.buffer);
    console.log(`[IMAGES] PDF written to ${pdfPath}`);

    // 3) convert each page to PNG
    const pagePaths = await pdfToPngs(pdfPath);
    console.log(`[IMAGES] Pages converted:`, pagePaths);

    // 4) upload each PNG to Cloudinary
    const urls = [];
    for (const p of pagePaths) {
      const url = await uploadImage(p);
      console.log(`[IMAGES] Uploaded  → ${url}`);
      urls.push(url);
    }

    // 5) clean up temp dir (best-effort)
    await fs.rm(tmpDir, { recursive: true, force: true });

    // 6) respond
    res.json({ cbe, reference: latest.ReferenceNumber, pages: urls.length, urls });

  } catch (err) {
    console.error('[IMAGES] error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to process PDF' });
  }
});

/**
 * GET /bilan/:cbe/analyse
 * Full pipeline: PDF → PNGs → Cloudinary → OCR → GPT analysis.
 * Returns { urls: [ ... ], ocrText, analysis }
 * Query ?debug=1 to see raw OCR text.
 */
app.get('/bilan/:cbe/analyse', async (req, res) => {
  const { cbe } = req.params;
  if (!/^\d{10}$/.test(cbe)) {
    return res.status(400).json({ error: 'CBE must be 10 digits.' });
  }

  try {
    // 1) Fetch latest PDF (wrapper already built)
    const { latest, pdf } = await getLatestPdfForCbe(cbe);
    console.log(`[ANALYSE] PDF ${latest.ReferenceNumber} size=${pdf.contentLength}`);

    // 2) Write buffer to temp & convert to PNG
    const { pdfPath, tmpDir } = await writePdfBuffer(pdf.buffer);
    const pagePaths = await pdfToPngs(pdfPath);
    console.log(`[ANALYSE] Converted ${pagePaths.length} pages`);

    // 3) Upload pages to Cloudinary
    const urls = [];
    for (const p of pagePaths) {
      const url = await uploadImage(p);
      console.log(`[ANALYSE] Uploaded ${path.basename(p)} → ${url}`);
      urls.push(url);
    }

    // 4) OCR each URL with GPT-4o vision
    let fullText = '';
    for (const url of urls) {
      const text = await ocrImage(url);
      fullText += '\n\n' + text;
    }

    // 5) Run French bilan analysis prompt
    const analysis = await analyseBilanText(fullText);
    console.log('[ANALYSE] GPT analysis done');

    // 6) Clean temp dir
    await fs.rm(tmpDir, { recursive: true, force: true });

    res.json({
      cbe,
      reference: latest.ReferenceNumber,
      pages: urls.length,
      urls,
      ...(req.query.debug === '1' ? { ocrText: fullText } : {}),
      analysis,
    });

  } catch (err) {
    console.error('[ANALYSE] error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Analysis failed' });
  }
});


app.post('/bilan/:cbe/analysis', async (req, res) => {
  const { cbe } = req.params;
  if (!validCbe(cbe)) {
    return res.status(400).json({ ok: false, error: 'CBE must be 10 digits.' });
  }

  const {
    referenceNumber,
    depositDate,
    exercise,
    modelType,
    language,
    currency,
    dataVersion,
    structured,
    accountingData,
    analysis
  } = req.body || {};

  if (!referenceNumber) {
    return res.status(400).json({ ok: false, error: 'referenceNumber is required' });
  }
  if (!analysis || typeof analysis !== 'object') {
    return res.status(400).json({ ok: false, error: 'analysis object is required' });
  }
  if (!analysis.rawText) {
    return res.status(400).json({ ok: false, error: 'analysis.rawText is required' });
  }

  try {
    // Normalisation / sanitation basique
    const update = {
      cbe,
      referenceNumber,
      depositDate: toDateOrNull(depositDate),
      exercise: {
        start: toDateOrNull(exercise?.start),
        end: toDateOrNull(exercise?.end)
      },
      modelType: modelType ?? null,
      language: language ?? null,
      currency: currency ?? null,
      dataVersion: dataVersion ?? null,
      structured: !!structured,
      accountingData: structured ? (accountingData || null) : null,
      analysis: {
        promptVersion: analysis.promptVersion ?? 'v1.0',
        modelUsed: analysis.modelUsed ?? 'gpt-4o',
        generatedAt: toDateOrNull(analysis.generatedAt) || new Date(),
        rawText: String(analysis.rawText),

        score: analysis.score ?? null,
        hasPhysicalAssets: analysis.hasPhysicalAssets ?? null,
        hasStocks: analysis.hasStocks ?? null,
        assetsFullyDepreciated: analysis.assetsFullyDepreciated ?? null,
        balanceSheetDate: toDateOrNull(analysis.balanceSheetDate),
        isRecent: analysis.isRecent ?? null,

        netBookValueCurrent: analysis.netBookValueCurrent ?? null,
        netBookValuePrevious: analysis.netBookValuePrevious ?? null,
        netBookValueChangePct: analysis.netBookValueChangePct ?? null,
        stockAmount: analysis.stockAmount ?? null,

        positives: Array.isArray(analysis.positives) ? analysis.positives.slice(0, 12) : [],
        negatives: Array.isArray(analysis.negatives) ? analysis.negatives.slice(0, 12) : [],
        commentSummary: analysis.commentSummary ?? null,
        categories: Array.isArray(analysis.categories) ? analysis.categories.map(c => ({
          code: c.code ?? null,
            label: c.label ?? null,
            netAmountCurrent: c.netAmountCurrent ?? null,
            netAmountPrevious: c.netAmountPrevious ?? null,
            sharePercent: c.sharePercent ?? null
        })) : []
      }
    };

    // Upsert idempotent
    const doc = await BilanFiling.findOneAndUpdate(
      { cbe, referenceNumber },
      { $set: update },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    return res.status(200).json({ ok: true, filing: doc });
  } catch (err) {
    console.error('Save analysis error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server error',
      details: err.message
    });
  }
});

/** Health */
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'CBSO bilan API running' });
});

app.listen(PORT, () => {
  console.log(`⇢ CBSO bilan API listening on http://localhost:${PORT}`);
});
