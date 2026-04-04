# Development

## CI parity

The same checks run locally and in GitHub Actions:

```bash
make ci
# or
npm run ci
```

This runs `lint:ci`, `typecheck`, `test` (contracts + API unit tests), and `build` (contracts, API, demo UI).

## Coverage

Jest is configured for `@ai-chat/contracts` and `@ai-chat/api`. Add `--coverage` to workspace test scripts when you want HTML/lcov output; keep thresholds realistic for new projects.

## Playwright (demo UI)

Smoke tests live in `apps/demo-ui/e2e/`. They expect the API to answer `GET /health/live` at `NEXT_PUBLIC_API_URL`.

- **Local:** start Postgres + API + demo (`make dev-api` / `make dev-demo`), then `npm run test:e2e -w @ai-chat/demo-ui`.
- **CI:** the workflow starts Postgres, migrates, runs the API in the background, builds the demo with `NEXT_PUBLIC_API_URL`, then runs Playwright with `next start` for the UI.

## Environment files

- `make env` / `npm run env` copies `apps/api/.env.example` → `apps/api/.env` and `apps/demo-ui/.env.local.example` → `apps/demo-ui/.env.local` when missing.
- Use `LLM_MOCK=1` for local work without provider keys.

## Node version

`.nvmrc` pins Node **22** (CI uses `actions/setup-node` with `node-version-file: .nvmrc`).
