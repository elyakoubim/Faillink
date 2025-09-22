/* ------------------------------------------------------------------ */
/*  server.js – API + Mongo save (no cron)                            */
/* ------------------------------------------------------------------ */
/*  .env required                                                     */
/*      MONGO_URI=mongodb://user:pass@host:27017/mb_scraper           */
/*      DEBUG_SCRAPER=1     # optional, enables console traces        */
/* ------------------------------------------------------------------ */

import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import "dotenv/config";

import {
  fetchAccountingDataJson,
  fetchReferences,
  getLatestPdfForCbe,
  pickLatestReference,
} from "./helpers/cbso.js";
import { writePdfBuffer, pdfToPngs } from "./helpers/pdfImages.js";
import { uploadImage } from "./helpers/cloudy.js";
import { analysePhysicalAssets } from "./helpers/openaiHelpers.js";
import {
  extractQuantitativeFromJson,
  safeDate,
} from "./helpers/bilanExtract.js";
import BilanFiling from "./model/BilanFiling.js";

import connectDB from "./db/connect.js"; // your helper
import Batch from "./model/BankruptcyBatch.js"; // schema below
import { initDailyScraper } from "./dailyScraper.js";
import enterpriseRoutes from "./routes/enterprise.js";
import EnterpriseDetail from "./model/EnterpriseDetail.js";

dayjs.extend(utc);
dayjs.extend(tz);

/* ---------- constants --------------------------------------------- */
const TZ = "Europe/Brussels";
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UA = "BankruptcySpider/4.1 (+https://example.com)";
const DIGIT_RE = /\d{3,4}\.\d{3}\.\d{3}/g; // 0123.456.789 or 123.456.789

/** Validate CBE (10 digits incl. leading zero). */
function validCbe(cbe) {
  return /^\d{10}$/.test(cbe);
}

function toDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
/* ---------- helpers ----------------------------------------------- */
const toDate = (d) => dayjs.tz(d, "YYYY-MM-DD", TZ);
const isGood = (d) => d.isValid() && d.year() > 1900 && d.year() < 2100;
const clean = (n) => ((n = n.replace(/\./g, "")).length === 9 ? "0" + n : n);
const log = (...a) =>
  process.env.DEBUG_SCRAPER === "1" && console.log("[debug]", ...a);

const listURL = (from, to, page = 1) =>
  `https://www.ejustice.just.fgov.be/cgi_tsv/list.pl?` +
  new URLSearchParams({
    language: "fr",
    akte: "c02",
    pdd: from,
    pdf: to,
    page,
  });

async function scrapePage({ from, to, page }) {
  console.log("I am in scrape range");
  const { data: html } = await axios.get(listURL(from, to, page), {
    headers: { "User-Agent": UA },
    timeout: 15_000,
  });
  console.log(listURL(from, to, page), {
    headers: { "User-Agent": UA },
    timeout: 15_000,
  });
  const matches = html.match(DIGIT_RE) || [];
  const list = matches.map(clean);
  log(`p${page} ${from}->${to}  raw:${matches.length}`);

  const $ = cheerio.load(html);
  const hasNext = $("a.pagination-next").length > 0;
  return { list, hasNext };
}

async function scrapeRange(fromStr, toStr) {
  const pages = [];
  const seen = new Set();
  let pageNum = 1;

  while (true) {
    const { list, hasNext } = await scrapePage({
      from: fromStr,
      to: toStr,
      page: pageNum,
    });
    pages.push({ page: pageNum, count: list.length, list });
    list.forEach((id) => seen.add(id));

    if (!hasNext) break;
    pageNum += 1;
  }

  return {
    pages,
    countDistinct: seen.size,
    countRaw: pages.reduce((s, p) => s + p.count, 0),
  };
}

/* ---------- DB connection ----------------------------------------- */
await connectDB(
  "mongodb+srv://elmahdibellaziz:LDpJS6X4iYQeYrhW@cluster1.v1n5xx9.mongodb.net/faillink_db?retryWrites=true&w=majority&appName=Cluster1"
)
  .then(() => console.log("⇢ MongoDB connected"))
  .catch((e) => {
    console.error("Mongo connect failed:", e.message);
    process.exit(1);
  });

/* ---------- kick-off nightly job  (ADD THIS) --------------------- */
// initDailyScraper(scrapeRange); // ⬅️ one-liner

/* ---------- Routes ---------------------------------------------- */
app.use("/enterprise", enterpriseRoutes);

/* ---------- HTTP API ---------------------------------------------- */
app.get("/scrape", async (req, res) => {
  if (req.query.debug) process.env.DEBUG_SCRAPER = "1";

  let from = req.query.from || req.query.date;
  let to = req.query.to || req.query.date;
  if (!from || !to)
    return res.status(400).json({
      error: "Use ?date=YYYY-MM-DD  OR  ?from=YYYY-MM-DD&to=YYYY-MM-DD",
    });

  from = toDate(from);
  to = toDate(to);

  if (!isGood(from) || !isGood(to) || from.isAfter(to))
    return res.status(400).json({ error: "Invalid or reversed dates" });

  try {
    const [fromStr, toStr] = [from, to].map((d) => d.format("YYYY-MM-DD"));
    log(`API scrape ${fromStr} → ${toStr}`);

    const data = await scrapeRange(fromStr, toStr);

    const doc = await Batch.create({
      ...data,
      from: fromStr,
      to: toStr,
      source: "api",
    });

    log(`saved batch _id=${doc._id}`);
    res.json({ from: fromStr, to: toStr, ...data }); // respond to client quickly
    // return;
    // Process enterprise details in the background
    const allEnterpriseNumbers = data.pages.flatMap((page) => page.list);

    Promise.allSettled(
      allEnterpriseNumbers.map(async (number) => {
        try {
          // Check if enterprise details already exist in DB
          const exists = await EnterpriseDetail.findOne({
            enterpriseNumber: number,
          });
          if (exists) {
            // Already in DB, skip API call
            return;
          }
          // Call the correct endpoint for enterprise details
          const { data: details } = await axios.get(
            `http://localhost:${PORT}/enterprise/read?enterprise_number=${number}`
          );
          await EnterpriseDetail.create({
            batchId: doc._id,
            enterpriseNumber: number,
            from: fromStr,
            to: toStr,
            details,
          });
        } catch (err) {
          if (err.response && err.response.status === 404) {
            // Optionally handle not found
            // console.log(`[info] Enterprise not found for ${number}`);
          } else {
            console.error(
              `[error] Enterprise fetch for ${number}:`,
              err.message
            );
          }
        }
      })
    );
  } catch (err) {
    console.error("[error] API:", err.message);
    res.status(500).json({ error: "Scrape failed", details: err.message });
  }
});

app.get("/bilan/:cbe", async (req, res) => {
  const { cbe } = req.params;

  if (!validCbe(cbe)) {
    return res
      .status(400)
      .json({ error: "CBE must be 10 digits (leading zero included)." });
  }

  try {
    const { latest, pdf } = await getLatestPdfForCbe(cbe);

    res
      .status(200)
      .set({
        "Content-Type": pdf.contentType,
        "Content-Length": pdf.contentLength,
        "Content-Disposition": `inline; filename="${cbe}-${
          latest?.ExerciseDates?.EndDate || "latest"
        }-${latest.ReferenceNumber}.pdf"`,
      })
      .send(pdf.buffer);
  } catch (err) {
    console.error("CBSO error:", err);
    const status = err.status || 500;
    const details = err.body
      ? typeof err.body === "string"
        ? err.body
        : JSON.stringify(err.body)
      : err.message;
    res.status(status).json({
      error: status >= 500 ? "Server error" : "CBSO API error",
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
app.get("/bilan/:cbe/json", async (req, res) => {
  const { cbe } = req.params;

  if (!validCbe(cbe)) {
    return res.status(400).json({ error: "CBE must be 10 digits." });
  }

  let persistenceError = null;
  let savedDoc = null;

  try {
    // 1. Références disponibles
    const refs = await fetchReferences(cbe);
    if (!refs?.length) {
      return res
        .status(404)
        .json({ error: "No published annual accounts for this CBE." });
    }

    // 2. Choix du dernier dépôt
    const latest = pickLatestReference(refs);
    if (!latest) {
      return res
        .status(404)
        .json({ error: "Could not determine latest reference." });
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
            referenceNumber: latest.ReferenceNumber,
          },
          accountingData: jsonData,
        });
      } catch (aiErr) {
        console.error("AI analysis error:", aiErr);
        aiAnalysis = null;
      }
    }

    // 5. Sauvegarde (upsert) – même si non structuré on peut conserver la trace
    try {
      const docPayload = {
        cbe,
        referenceNumber: latest.ReferenceNumber,
        depositDate: safeDate(latest.DepositDate),
        exerciseStart: safeDate(
          latest?.ExerciseDates?.StartDate || latest?.ExerciseDates?.start
        ),
        exerciseEnd: safeDate(
          latest?.ExerciseDates?.EndDate || latest?.ExerciseDates?.end
        ),
        currency: latest.Currency,
        modelType: latest.ModelType,
        language: latest.Language,
        dataVersion: latest.DataVersion,
        structured,
        accountingData: structured ? jsonData : undefined,
        aiAnalysis: aiAnalysis || undefined,
      };

      // Upsert par (cbe, referenceNumber)
      savedDoc = await BilanFiling.findOneAndUpdate(
        { cbe, referenceNumber: latest.ReferenceNumber },
        { $set: docPayload },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      ).lean();
    } catch (dbErr) {
      persistenceError = dbErr.message;
      console.error("Mongo persistence error:", dbErr);
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
        persistenceError,
      });
    } else {
      return res.status(200).json({
        cbe,
        referenceNumber: latest.ReferenceNumber,
        structured: false,
        message:
          "Structured JSON not available (filing not XBRL or before cutoff).",
        hint: "Request the PDF version instead: /bilan/:cbe (Accept application/pdf).",
        aiAnalysis: null,
        saved: !!savedDoc,
        persistenceError,
      });
    }
  } catch (err) {
    console.error("CBSO JSON error:", err);
    const status = err.status || 500;
    const details = err.body
      ? typeof err.body === "string"
        ? err.body
        : JSON.stringify(err.body)
      : err.message;

    return res.status(status).json({
      error: status >= 500 ? "Server error" : "CBSO API error",
      status,
      details,
    });
  }
});

/**
 * GET /bilan/:cbe/images
 * Returns an array of Cloudinary URLs (one per PDF page).
 * Debug logs are printed to console.
 */
app.get("/bilan/:cbe/images", async (req, res) => {
  const { cbe } = req.params;
  if (!/^\d{10}$/.test(cbe)) {
    return res.status(400).json({ error: "CBE must be 10 digits." });
  }

  try {
    // 1) reuse wrapper to fetch latest PDF buffer
    const { latest, pdf } = await getLatestPdfForCbe(cbe);
    console.log(
      `[IMAGES] Got PDF for ${cbe} ref ${latest.ReferenceNumber}, size=${pdf.contentLength}`
    );

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
    res.json({
      cbe,
      reference: latest.ReferenceNumber,
      pages: urls.length,
      urls,
    });
  } catch (err) {
    console.error("[IMAGES] error:", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Failed to process PDF" });
  }
});

/**
 * GET /bilan/:cbe/analyse
 * Full pipeline: PDF → PNGs → Cloudinary → OCR → GPT analysis.
 * Returns { urls: [ ... ], ocrText, analysis }
 * Query ?debug=1 to see raw OCR text.
 */
app.get("/bilan/:cbe/analyse", async (req, res) => {
  const { cbe } = req.params;
  if (!/^\d{10}$/.test(cbe)) {
    return res.status(400).json({ error: "CBE must be 10 digits." });
  }

  try {
    // 1) Fetch latest PDF (wrapper already built)
    const { latest, pdf } = await getLatestPdfForCbe(cbe);
    console.log(
      `[ANALYSE] PDF ${latest.ReferenceNumber} size=${pdf.contentLength}`
    );

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
    let fullText = "";
    for (const url of urls) {
      const text = await ocrImage(url);
      fullText += "\n\n" + text;
    }

    // 5) Run French bilan analysis prompt
    const analysis = await analyseBilanText(fullText);
    console.log("[ANALYSE] GPT analysis done");

    // 6) Clean temp dir
    await fs.rm(tmpDir, { recursive: true, force: true });

    res.json({
      cbe,
      reference: latest.ReferenceNumber,
      pages: urls.length,
      urls,
      ...(req.query.debug === "1" ? { ocrText: fullText } : {}),
      analysis,
    });
  } catch (err) {
    console.error("[ANALYSE] error:", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Analysis failed" });
  }
});

app.post("/bilan/:cbe/analysis", async (req, res) => {
  const { cbe } = req.params;
  if (!validCbe(cbe)) {
    return res.status(400).json({ ok: false, error: "CBE must be 10 digits." });
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
    analysis,
  } = req.body || {};

  if (!referenceNumber) {
    return res
      .status(400)
      .json({ ok: false, error: "referenceNumber is required" });
  }
  if (!analysis || typeof analysis !== "object") {
    return res
      .status(400)
      .json({ ok: false, error: "analysis object is required" });
  }
  if (!analysis.rawText) {
    return res
      .status(400)
      .json({ ok: false, error: "analysis.rawText is required" });
  }

  try {
    // Normalisation / sanitation basique
    const update = {
      cbe,
      referenceNumber,
      depositDate: toDateOrNull(depositDate),
      exercise: {
        start: toDateOrNull(exercise?.start),
        end: toDateOrNull(exercise?.end),
      },
      modelType: modelType ?? null,
      language: language ?? null,
      currency: currency ?? null,
      dataVersion: dataVersion ?? null,
      structured: !!structured,
      accountingData: structured ? accountingData || null : null,
      analysis: {
        promptVersion: analysis.promptVersion ?? "v1.0",
        modelUsed: analysis.modelUsed ?? "gpt-4o",
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

        positives: Array.isArray(analysis.positives)
          ? analysis.positives.slice(0, 12)
          : [],
        negatives: Array.isArray(analysis.negatives)
          ? analysis.negatives.slice(0, 12)
          : [],
        commentSummary: analysis.commentSummary ?? null,
        categories: Array.isArray(analysis.categories)
          ? analysis.categories.map((c) => ({
              code: c.code ?? null,
              label: c.label ?? null,
              netAmountCurrent: c.netAmountCurrent ?? null,
              netAmountPrevious: c.netAmountPrevious ?? null,
              sharePercent: c.sharePercent ?? null,
            }))
          : [],
      },
    };

    // Upsert idempotent
    const doc = await BilanFiling.findOneAndUpdate(
      { cbe, referenceNumber },
      { $set: update },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(200).json({ ok: true, filing: doc });
  } catch (err) {
    console.error("Save analysis error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
      details: err.message,
    });
  }
});

/* ---------- launch server ----------------------------------------- */
app.listen(PORT, () =>
  console.log(`⇢ Bankruptcy scraper API on http://localhost:${PORT}`)
);
