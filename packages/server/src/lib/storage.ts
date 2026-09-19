import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { put as putVercelBlob } from "@vercel/blob";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../env.js";

export interface StorageAdapter {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
}

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

// Shared with app.ts, which serves this directory statically when
// STORAGE_DRIVER=local.
export const LOCAL_UPLOAD_DEFAULT_DIR = "uploads";

function safeKey(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : "";
  return `${randomUUID()}${safeExt}`;
}

/**
 * S3-compatible storage — works with AWS S3, Cloudflare R2, Backblaze B2 or
 * any other S3-compatible provider by setting S3_ENDPOINT. Uploaded images
 * live outside MongoDB: storing binary blobs in Mongo doesn't scale past a
 * few MB per document and defeats CDN caching for images. The default
 * driver — every existing deployment keeps working unchanged.
 */
class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const key = `uploads/${safeKey(originalName)}`;

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

/**
 * Cloudinary — trades "bring your own bucket" for a managed image CDN with
 * on-the-fly transformations (resizing, format conversion) available later
 * just by editing the returned URL. A reasonable choice for a developer who
 * doesn't want to think about buckets/regions at all.
 */
class CloudinaryStorageAdapter implements StorageAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  upload(buffer: Buffer, originalName: string, _mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "dora-cms/uploads", public_id: safeKey(originalName).replace(/\.[^.]+$/, ""), resource_type: "image" },
        (err, result) => {
          if (err || !result) {
            reject(err instanceof Error ? err : new Error("Cloudinary upload failed"));
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  }
}

/**
 * Vercel Blob — zero extra signup for a developer already deploying the
 * backend on Vercel; one less account to create during setup.
 */
class VercelBlobStorageAdapter implements StorageAdapter {
  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const key = `uploads/${safeKey(originalName)}`;
    const blob = await putVercelBlob(key, buffer, {
      access: "public",
      contentType: mimeType,
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });
    return blob.url;
  }
}

/**
 * Local disk — for running the whole stack with zero cloud accounts before
 * a developer is ready to deploy. Requires a persistent, writable
 * filesystem: works on Render, does NOT work on Vercel (serverless
 * functions have no persistent disk, and even /tmp doesn't survive between
 * invocations or get shared across instances). Single-instance only, the
 * same caveat as the in-memory rate-limit store — see rateLimitStore.ts.
 */
class LocalDiskStorageAdapter implements StorageAdapter {
  private dir: string;
  private publicBase: string;

  constructor() {
    this.dir = env.LOCAL_UPLOAD_DIR ?? LOCAL_UPLOAD_DEFAULT_DIR;
    this.publicBase = (env.LOCAL_UPLOAD_PUBLIC_URL_BASE ?? "/uploads").replace(/\/$/, "");
  }

  async upload(buffer: Buffer, originalName: string, _mimeType: string): Promise<string> {
    const key = safeKey(originalName);
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(path.join(this.dir, key), buffer);
    return `${this.publicBase}/${key}`;
  }
}

let adapter: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    switch (env.STORAGE_DRIVER) {
      case "cloudinary":
        adapter = new CloudinaryStorageAdapter();
        break;
      case "vercel-blob":
        adapter = new VercelBlobStorageAdapter();
        break;
      case "local":
        adapter = new LocalDiskStorageAdapter();
        break;
      default:
        adapter = new S3StorageAdapter();
    }
  }
  return adapter;
}
