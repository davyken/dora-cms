import { createApp } from "./app.js";
import { env } from "./env.js";

const app = createApp();
const port = Number(env.PORT) || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`dora-cms server listening on port ${port}`);
});
