# Development

## CI parity

The same checks run locally and in GitHub Actions:

```bash
make ci
# or
npm run ci
```

This runs `lint:ci`, `typecheck`, `test:cov` (contracts + API unit tests with coverage reports), and `build` (contracts, API, demo UI).

## Troubleshooting (Windows / Prisma)

If `prisma generate` (during `npm run build -w @ai-chat/api` or `make ci`) fails with:

`EPERM: operation not permitted, rename '...\query_engine-windows.dll.node.tmp...' -> '...\query_engine-windows.dll.node'`

then another process almost always has that DLL loaded. **Stop the Nest dev server** (`make dev-api` / `Ctrl+C`), close any other `node` process using this repo’s API, and run the build again. With npm workspaces the engine lives under the **repo root** `node_modules/.prisma/client/`, so a running API locks the same file `prisma generate` tries to replace.

If nothing obvious is running, retry after a few seconds (antivirus can briefly lock the file) or add a Defender exclusion for the project folder.

## Coverage

`test:cov` collects Jest coverage for:

- **`@ai-chat/contracts`:** `src/**/*.ts` except `index.ts` (barrel re-exports only) and `*.test.ts`.
- **`@ai-chat/api`:** all `src/**/*.ts` except `main.ts` and `*.module.ts` (Nest bootstrap / wiring; behaviour is covered by e2e and integration tests where relevant).

Run locally:

```bash
npm run test:cov
# or per workspace (API needs compiled contracts types — build first if you skip the root script)
npm run build -w @ai-chat/contracts
npm run test:cov -w @ai-chat/contracts
npm run test:cov -w @ai-chat/api
```

Reports are written to `packages/contracts/coverage/` and `apps/api/coverage/`. The GitHub Actions **unit** job runs `test:cov` and uploads those folders as a **coverage** artifact.

## Playwright (demo UI)

Smoke tests live in `apps/demo-ui/e2e/`. They expect the API to answer `GET /health/live` at `NEXT_PUBLIC_API_URL`.

- **Local:** start Postgres + API + demo (`make dev-api` / `make dev-demo`), then `npm run test:e2e -w @ai-chat/demo-ui`.
- **CI:** the workflow starts Postgres, migrates, runs the API in the background, builds the demo with `NEXT_PUBLIC_API_URL`, then runs Playwright with `next start` for the UI.

## Docker Compose (API + Postgres + `/docs`)

The [Dockerfile](../Dockerfile) runs the Nest API on port **3000**. Swagger UI is on **`/docs`** (same origin as the API). JSON routes are under **`/v1/...`** (e.g. `POST /v1/chat`). There is **no** required `/api` path segment unless you set `API_GLOBAL_PREFIX` (see `apps/api/.env.example`).

**Order (first run and after new migrations):**

1. Start Postgres and apply migrations **from the host** (Prisma CLI is not shipped in the pruned image):
   - `make docker-compose-migrate-deploy`  
     or: `docker compose up -d postgres`, wait for health, then  
     `DATABASE_URL=postgresql://rtchat:rtchat@127.0.0.1:5432/rtchat?schema=public npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`
2. Build and start the API container: `docker compose up -d --build api`

**One-shot (migrate + API + Postgres):** `make docker-up`

Then open **http://localhost:3000/docs** and use **http://localhost:3000/v1/chat** (or `http://localhost:3000/health/live`).

If you set **`API_GLOBAL_PREFIX=api`**, use **`/api/docs`** and **`/api/v1/chat`** instead, and update any clients (e.g. demo UI `NEXT_PUBLIC_API_URL` + fetch paths) accordingly.

## Environment files

- `make env` / `npm run env` copies `apps/api/.env.example` → `apps/api/.env` and `apps/demo-ui/.env.local.example` → `apps/demo-ui/.env.local` when missing.
- Use `LLM_MOCK=1` for local work without provider keys.

## Chat API contract (engineering challenge)

The public JSON matches the Part 1 example in the challenge document: `POST /v1/chat` with `userId` and `prompt`; the response includes `response` (LLM text), `model`, and `timestamp` (ISO 8601). The database still stores the assistant text in a column named `reply`; the API maps it to `response` and exposes `timestamp` from `createdAt`.

| Challenge example | This API |
|-------------------|----------|
| `userId`, `prompt` (request) | Same |
| `response` (LLM output) | Same |
| `timestamp` | From record creation time (`createdAt`) |
| `model` | Same (nullable if unknown) |
| — | `provider`: `openrouter` \| `gemini` \| `mock` (extra field for observability) |

OpenAPI examples that mirror the PDF are on Swagger UI at `/docs` under the **chat** tag.

## Node version

`.nvmrc` pins Node **22** (CI uses `actions/setup-node` with `node-version-file: .nvmrc`).

## npm audit and Nest versions

The API uses **Nest 10** with aligned `@nestjs/*` in [`apps/api/package.json`](../apps/api/package.json).

**Do not run `npm audit fix --force`** — it upgrades Nest packages out of sync and breaks peers.

**Avoid `npm audit fix` (without `--force`) as well** if it leaves an inconsistent tree: npm may **downgrade** a package (for example `@nestjs/config` to an ancient `1.x` for a transitive lodash advisory) while other `@nestjs/*` stay on 10 or 11, which triggers `ERESOLVE` or hybrid peer conflicts. If that happens, restore `apps/api/package.json` from git and run a clean `npm install` from the repo root (delete `package-lock.json` and all `node_modules` if needed).

For the usual “many findings, only fix via `--force`” situation: stay on one Nest major, use **`npm run ci`** as the quality bar, and remember production images run **`npm prune --omit=dev`** so CLI-only transitives do not ship. A future **Nest 11** migration is the path to a cleaner `npm audit` without fighting peers.

