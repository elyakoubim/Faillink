// helpers/cloudy.js
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME || 'ddtk9h9bc',
  api_key:    process.env.CLOUD_API_KEY  || '311952192168776',
  api_secret: process.env.CLOUD_API_SECRET || 'qgVCQPuBQuYk0DvrvmKdrlAQiGc',
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: 'image',
  format: 'png',
  quality: 'auto:best',
};

/** upload a local PNG image, return its secure URL */
export async function uploadImage(filePath) {
  const buf = await fs.readFile(filePath);
  const b64 = `data:image/png;base64,${buf.toString('base64')}`;
  const result = await cloudinary.v2.uploader.upload(b64, opts);
  return result.secure_url;
}

export async function uploadBuffer(buf) {
  const b64 = `data:image/png;base64,${buf.toString('base64')}`;
  const res = await cloudinary.v2.uploader.upload(b64, opts);
  return res.secure_url;
}
