import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app.js";

// The Express app is built once per warm serverless instance and reused
// across invocations, same as the cached DB connection in db.ts.
const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  app(req, res);
}
