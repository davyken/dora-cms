// Vercel's convention: any file under /api becomes a serverless function.
// This re-exports the shared handler so `packages/server` can be deployed
// on its own as a Vercel project (Project Settings → Root Directory =
// packages/server), independent of wherever the frontend site is hosted.
export { default } from "../src/vercel";
