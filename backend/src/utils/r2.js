import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Uploads a file buffer to Cloudflare R2 storage.
 * @param {Buffer} fileBuffer - File binary data
 * @param {string} originalName - File name
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Folder name in R2 bucket
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export async function uploadToR2(fileBuffer, originalName = 'image.png', mimeType = 'image/png', folder = 'profile-images') {
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : 'png';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const key = `${folder}/${timestamp}-${randomStr}.${ext}`;

  const bucket = process.env.R2_BUCKET || 'onbillo';

  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(uploadParams));

  const baseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  return `${baseUrl}/${key}`;
}
