# dora-cms (CLI)

Interactive setup for the [`@dora-cms/server`](https://www.npmjs.com/package/@dora-cms/server)
backend. Generates a JWT secret, hashes the site's admin password, and writes a ready-to-use
`.env` — the three steps that were previously manual (see `docs/ARCHITECTURE.md` §7).

## Usage

Run from inside `packages/server` (or pass a target directory):

```bash
npx dora-cms init
npx dora-cms init path/to/server
```

You'll be prompted for:

- MongoDB connection string
- The password the site's client will log in with (only the bcrypt hash is ever written to disk)
- Allowed CORS origins
- S3-compatible storage credentials for image uploads

It writes `.env` (mode `600`, since it holds secrets) and prints the next deployment step for
both Render and Vercel. It does not deploy anything itself — see
[docs/ARCHITECTURE.md §5](../../docs/ARCHITECTURE.md#5-deployment) for that.

## License

MIT
