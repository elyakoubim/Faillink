/* eslint-disable import/extensions */
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import pLimit from 'p-limit';
import sharp from 'sharp';
import { createCanvas } from 'canvas';
import { createWorker } from 'tesseract.js';

/* -------- pdf.js (Node legacy build) -------- */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

/* -------- small helper to mimic the old NodeCanvasFactory -------- */
class NodeCanvasFactory {
  create(width, height) {
    const canvas  = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset({ canvas }, width, height) {
    canvas.width  = width;
    canvas.height = height;
  }
  destroy(obj) {
    obj.canvas  = null;
    obj.context = null;
  }
}

/* -------- rasterise one PDF page -> PNG Buffer -------- */
async function rasterisePage(page, scale = 2) {
  const viewport      = page.getViewport({ scale });
  const canvasFactory = new NodeCanvasFactory();
  const { canvas, context } = canvasFactory.create(
    viewport.width,
    viewport.height
  );

  await page
    .render({ canvasContext: context, viewport, canvasFactory })
    .promise;

  return sharp(canvas.toBuffer()).png().toBuffer();
}

/* -------- single global Tesseract worker (v5) -------- */
const ocrWorker = await createWorker({
  langPath: 'https://tessdata.projectnaptha.com/fast', // lighter models
  cachePath: path.join(tmpdir(), 'tess-cache'),
  // No logger here – passing a fn causes DataCloneError
});

/* -------- main helper: PDF Buffer -> OCR result -------- */
export async function pdfBufferToOcr(buffer, { concurrency = 4 } = {}) {
  const doc        = await pdfjs.getDocument({ data: buffer }).promise;
  const pageCount  = doc.numPages;
  const limit      = pLimit(concurrency);

  const tasks = [...Array(pageCount).keys()].map(idx =>
    limit(async () => {
      const page  = await doc.getPage(idx + 1);
      const png   = await rasterisePage(page, 2);

      // supply logger *here* – it's passed by reference, not via postMessage
      const { data: { text } } = await ocrWorker.recognize(png, 'fra', {
        logger: m => {
          if (process.env.OCR_DEBUG) console.log(`[OCR] p${idx + 1}`, m);
        }
      });

      return { png, text };
    })
  );

  const results = await Promise.all(tasks);

  return {
    pagesPNG : results.map(r => r.png),
    texts    : results.map(r => r.text),
    fullText : results.map(r => r.text).join('\n')
  };
}

/* -------- optional helper: write buffer to temp file -------- */
export async function writePdfBuffer(buffer) {
  const dir     = await fs.mkdtemp(path.join(tmpdir(), 'cbso-'));
  const pdfPath = path.join(dir, 'file.pdf');
  await fs.writeFile(pdfPath, buffer);
  return { pdfPath, tmpDir: dir };
}
