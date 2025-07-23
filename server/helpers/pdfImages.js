// helpers/pdfImages.js
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { pdf } from 'pdf-to-img';
import { tmpdir } from 'os';

// convert ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/** write a Buffer to a temp PDF file and return its absolute path */
export async function writePdfBuffer(buffer) {
  const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'cbso-'));
  const pdfPath = path.join(tmpDir, 'file.pdf');
  await fs.writeFile(pdfPath, buffer);
  return { pdfPath, tmpDir };
}

/** convert a PDF file (path) to PNG images, returns absolute paths */
export async function pdfToPngs(pdfPath) {
  const document = await pdf(pdfPath, { scale: 2 }); // each page as PNG Buffer
  const dir = path.dirname(pdfPath);
  let idx = 1;
  const outPaths = [];
  for await (const imageBuffer of document) {
    const outFile = path.join(dir, `page-${idx}.png`);
    await fs.writeFile(outFile, imageBuffer);
    outPaths.push(outFile);
    idx += 1;
  }
  if (!outPaths.length) throw new Error('No images generated from PDF');
  return outPaths;
}
