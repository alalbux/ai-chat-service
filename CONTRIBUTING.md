# Contributing

## Setup

1. Install **Node.js 22** (see `.nvmrc`) and **GNU Make** (Git Bash / WSL / macOS / Linux). On Windows, Git for Windows includes Git Bash where `make` works if installed (`choco install make` is another option).
2. Clone under a short path (for example `~/work/...`) to avoid Windows path limits.
3. Run:

```bash
make env
make install
make db-up
make migrate
make dev-api    # terminal 1 — http://localhost:3000
make dev-demo   # terminal 2 — http://localhost:3001
```

Without Make, use `npm run env` and the equivalent `npm run` scripts from the root `package.json`.

## Tests

- `make contracts` — Zod contract tests.
- `make test` — Contracts + API unit tests.
- `make test-e2e` — API e2e (requires `DATABASE_URL` and applied migrations).
- `npm run test:e2e -w @ai-chat/demo-ui` — Playwright smoke (API must be reachable at `NEXT_PUBLIC_API_URL`).

## Pull requests

- Run `make ci` (or `npm run ci`) before opening a PR.
- Keep changes focused; prefer extending shared contracts in `packages/contracts` when altering API payloads.
- Document operational impact in the PR body if you change env vars, migrations, or deployment manifests.
