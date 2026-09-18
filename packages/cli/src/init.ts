import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import prompts from "prompts";
import { buildEnvFile, generateJwtSecret, hashPassword } from "./env-builder.js";

const required = (message: string) => (value: string) => (value.trim() ? true : message);

export async function runInit(targetDir: string): Promise<void> {
  const envPath = path.join(targetDir, ".env");

  if (existsSync(envPath)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `${envPath} already exists. Overwrite it?`,
      initial: false,
    });
    if (!overwrite) {
      console.log("Left the existing .env untouched.");
      return;
    }
  }

  console.log("\nSetting up @dora-cms/server configuration.\n");

  const answers = await prompts(
    [
      {
        type: "text",
        name: "mongodbUri",
        message: "MongoDB connection string (MONGODB_URI)",
        validate: required("Required"),
      },
      {
        type: "password",
        name: "adminPassword",
        message: "Password the site owner will log in with",
        validate: (v: string) => (v.length >= 8 ? true : "Use at least 8 characters"),
      },
      {
        type: "text",
        name: "allowedOrigins",
        message: "Allowed origins (comma-separated), e.g. https://yoursite.com,http://localhost:3000",
        initial: "http://localhost:3000",
      },
      {
        type: "text",
        name: "s3Bucket",
        message: "S3-compatible bucket name for uploaded images (S3_BUCKET)",
        validate: required("Required — see docs/ARCHITECTURE.md for why images need object storage"),
      },
      {
        type: "text",
        name: "s3Region",
        message: "S3 region (S3_REGION — e.g. \"auto\" for Cloudflare R2)",
        initial: "auto",
      },
      {
        type: "text",
        name: "s3AccessKeyId",
        message: "S3 access key ID",
        validate: required("Required"),
      },
      {
        type: "password",
        name: "s3SecretAccessKey",
        message: "S3 secret access key",
        validate: required("Required"),
      },
      {
        type: "text",
        name: "s3Endpoint",
        message: "S3 endpoint (leave blank for AWS S3; required for R2/B2/etc.)",
      },
      {
        type: "text",
        name: "s3PublicUrlBase",
        message: "Public base URL uploads are served from (leave blank to use the default S3 URL)",
      },
    ],
    {
      onCancel: () => {
        console.log("\nAborted — no .env was written.");
        process.exitCode = 1;
      },
    }
  );

  if (!answers.mongodbUri) {
    // onCancel already reported this; nothing left to write.
    return;
  }

  const jwtSecret = generateJwtSecret();
  const adminPasswordHash = await hashPassword(answers.adminPassword);

  const envContent = buildEnvFile({
    mongodbUri: answers.mongodbUri,
    jwtSecret,
    adminPasswordHash,
    allowedOrigins: answers.allowedOrigins,
    s3Bucket: answers.s3Bucket,
    s3Region: answers.s3Region,
    s3AccessKeyId: answers.s3AccessKeyId,
    s3SecretAccessKey: answers.s3SecretAccessKey,
    s3Endpoint: answers.s3Endpoint || undefined,
    s3PublicUrlBase: answers.s3PublicUrlBase || undefined,
  });

  // Secrets live in this file — restrict it to owner read/write.
  writeFileSync(envPath, envContent, { mode: 0o600 });

  console.log(`\nWrote ${envPath}\n`);
  console.log("Next steps:");
  console.log("  Render:  npm run build && npm start   (deploy packages/server as a Node web service)");
  console.log("  Vercel:  new project, Root Directory = packages/server, same env vars in its dashboard");
  console.log("\nSee docs/ARCHITECTURE.md #5-deployment for details.\n");
}
