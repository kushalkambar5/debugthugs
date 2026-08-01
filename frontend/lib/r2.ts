import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a file buffer or ArrayBuffer to Cloudflare R2 storage.
 */
export async function uploadToR2(
  fileBuffer: Buffer | ArrayBuffer,
  originalName: string = "image.png",
  mimeType: string = "image/png",
  folder: string = "profile-images"
): Promise<string> {
  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : "png";
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const key = `${folder}/${timestamp}-${randomStr}.${ext}`;

  const bucket = process.env.R2_BUCKET || "onbillo";

  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(uploadParams));

  const baseUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  return `${baseUrl}/${key}`;
}
