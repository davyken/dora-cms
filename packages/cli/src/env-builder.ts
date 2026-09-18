import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

/** Kept separate from any file/prompt I/O so it can be unit tested directly. */
export function generateJwtSecret(): string {
  return randomBytes(32).toString("hex");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export interface EnvValues {
  mongodbUri: string;
  jwtSecret: string;
  adminPasswordHash: string;
  allowedOrigins: string;
  s3Bucket: string;
  s3Region: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Endpoint?: string;
  s3PublicUrlBase?: string;
  port?: string;
}

/** Produces the exact contents of @dora-cms/server's .env — order matches .env.example. */
export function buildEnvFile(values: EnvValues): string {
  const lines = [
    `MONGODB_URI=${values.mongodbUri}`,
    `JWT_SECRET=${values.jwtSecret}`,
    `DORA_ADMIN_PASSWORD_HASH=${values.adminPasswordHash}`,
    `ALLOWED_ORIGINS=${values.allowedOrigins}`,
    `PORT=${values.port ?? "4000"}`,
    `S3_BUCKET=${values.s3Bucket}`,
    `S3_REGION=${values.s3Region}`,
    `S3_ACCESS_KEY_ID=${values.s3AccessKeyId}`,
    `S3_SECRET_ACCESS_KEY=${values.s3SecretAccessKey}`,
  ];
  if (values.s3Endpoint) lines.push(`S3_ENDPOINT=${values.s3Endpoint}`);
  if (values.s3PublicUrlBase) lines.push(`S3_PUBLIC_URL_BASE=${values.s3PublicUrlBase}`);
  return `${lines.join("\n")}\n`;
}
