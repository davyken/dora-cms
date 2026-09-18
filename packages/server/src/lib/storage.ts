import { randomUUID } from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../env.js";

export interface StorageAdapter {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
}

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

/**
 * S3-compatible storage — works with AWS S3, Cloudflare R2, Backblaze B2 or
 * any other S3-compatible provider by setting S3_ENDPOINT. Uploaded images
 * live outside MongoDB: storing binary blobs in Mongo doesn't scale past a
 * few MB per document and defeats CDN caching for images.
 */
class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : "";
    const key = `uploads/${randomUUID()}${safeExt}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const base = env.S3_PUBLIC_URL_BASE
      ? env.S3_PUBLIC_URL_BASE.replace(/\/$/, "")
      : `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
    return `${base}/${key}`;
  }
}

let adapter: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) adapter = new S3StorageAdapter();
  return adapter;
}
