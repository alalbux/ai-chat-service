# AI Chat Microservice

Monorepo: **NestJS** API (OpenRouter + Gemini failover, Postgres via **Prisma**), **Next.js** demo UI, shared **Zod** contracts, **Swagger** at `/docs`, **Prometheus** at `/metrics`.

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/api` | NestJS service (`POST /v1/chat`, `GET /v1/chats/:id`, `/health/*`, `/metrics`, `/docs` Swagger) |
| `packages/contracts` | Shared Zod schemas and TypeScript types |
| `docs/` | Architecture, runbook, Datadog, Swagger notes, CI/CD |
| `infra/datadog` | Example Helm values for the Datadog Agent on Kubernetes |
| `infra/terraform/github-oidc-ecr-eks` | Terraform: GitHub OIDC IAM role + ECR (starter) |
| `k8s/base`, `k8s/overlays/aws-eks` | EKS manifests (Kustomize); ALB Ingress for the API |
| `Makefile` | Primary dev/CI entrypoints (`make help`) |

For **PR previews** (GHCR image `pr-<n>`), **Vercel** for the demo UI, and **free-tier API hosting**, see the CI/CD pipeline — [Preview section](docs/cicd-pipeline.md).

## Prerequisites

- Node.js **20.19+** or **22.13+** (CI uses 22; `.nvmrc` pins 22).
- **GNU Make** (Git Bash, WSL, macOS, or Linux). On Windows without Make, install Git for Windows and use Git Bash, or `choco install make`.
- **Docker** (for local PostgreSQL), or any reachable Postgres matching `DATABASE_URL`.
- `apps/api/scripts/run-nest.cjs`, `apps/demo-ui/scripts/run-next.cjs` (resolve hoisted deps from the repo root). Cloning under `~/work/...` remains the most reliable on Windows.

## Quickstart (Make)

```bash
make env          # apps/api/.env + apps/demo-ui/.env.local from templates
make install
make db-up        # docker compose — skip if you use another Postgres
make migrate      # after Postgres is up
make dev-api      # terminal 1 — http://localhost:3000
make dev-demo     # terminal 2 — http://localhost:3001
```

- **Swagger UI:** http://localhost:3000/docs (OpenAPI JSON: http://localhost:3000/docs-json)
- For quick local runs without real LLM keys, set **`LLM_MOCK=1`** in `apps/api/.env` (see `apps/api/.env.example`).

Without GNU Make (for example PowerShell on Windows), use `npm run env` instead of `make env`, and mirror the other steps with root `npm run` scripts (`npm run build`, `npm run test`, `npm run ci`, etc.). CI and this README treat **make** as the canonical command interface when Make is available.

## Deploy local com imagem Docker (paridade com produção)

```bash
make db-up && make migrate   # Postgres must be reachable
make docker-build            # builds rt-chat-api:local from the root Dockerfile
make docker-run-local        # http://localhost:3000 — DATABASE_URL → Postgres on host.docker.internal:5432 (Docker Desktop on Windows/macOS). On Linux: `make docker-run-local DOCKER_DB_HOST=172.17.0.1`
```

Migrations are **not** run inside the container; apply them with `make migrate` before starting the container.

## API examples (curl)

Chat (mock mode recommended without keys):

```bash
curl -s -X POST http://localhost:3000/v1/chat \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"u1\",\"prompt\":\"Say hello in one sentence.\"}" | jq
```

Fetch persisted record:

```bash
curl -s http://localhost:3000/v1/chats/<id-from-response> | jq
```

Health and metrics:

```bash
curl -s http://localhost:3000/health/live
curl -s http://localhost:3000/health/ready
curl -s http://localhost:3000/metrics | head
```

## Testing

```bash
make contracts
make test              # contracts + API unit tests
make test-e2e          # API e2e — requires DATABASE_URL (e.g. after make db-up + make migrate)
```

**Rate limit check (manual):** set `RATE_LIMIT_MAX=2` and `RATE_LIMIT_TTL_MS=600000` in `apps/api/.env`, restart the API (`make dev-api`), then `POST /v1/chat` with the same body three times; the third should return **429**.

## CI

```bash
make ci
```

Pull requests and `main` use `.github/workflows/ci.yml`: lint (`lint:ci`), typecheck, unit tests (including demo UI), integration (Postgres + API e2e), demo UI (Playwright smoke), security (Trivy filesystem + image scan), and a Docker build (no push). **CodeQL** runs from `.github/workflows/codeql.yml` (also enable upload under repo **Code security** for alerts).

## CD

On every push to `main`, `.github/workflows/cd.yml` runs a quality gate, builds and pushes the API image to **GHCR** (`ghcr.io/<owner>/ai-chat-api:<git-sha>` and `:latest`), then optional staging, smoke tests, manual approval (GitHub Environment **production**), production deploy placeholders, post-deploy health, and rollback hooks (implement in the workflow jobs once environments exist).

Configuration variables, secrets, and the full diagram are in [docs/cicd-pipeline.md](docs/cicd-pipeline.md) (includes Portuguese sections for CD variables and AWS CLI OIDC).

### AWS EKS (optional)

Workflow `.github/workflows/cd-aws-eks.yml` builds the API image in GitHub Actions, pushes it to **Amazon ECR**, and applies `kubectl apply -k k8s/overlays/aws-eks` to EKS using OIDC (`id-token: write` + `configure-aws-credentials`). Manifests live under `k8s/base/`. Setup: [docs/aws-eks-oidc.md](docs/aws-eks-oidc.md) and [infra/terraform/github-oidc-ecr-eks/](infra/terraform/github-oidc-ecr-eks/).

GitHub Actions authenticates to AWS using OIDC and assumes a dedicated IAM role. The pipeline pushes the image to ECR, runs `aws eks update-kubeconfig`, and applies manifests to the `rt-chat` namespace. EKS access entries grant the role Kubernetes API access; the AWS Load Balancer Controller exposes the app via an ALB Ingress. Step-by-step checklist: [docs/aws-eks-oidc.md](docs/aws-eks-oidc.md).

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, WSL, tests, PR expectations
- [docs/development.md](docs/development.md) — CI parity, coverage, Playwright
- [docs/architecture.md](docs/architecture.md) — diagrams and AWS/EKS mapping
- [docs/aws-eks-oidc.md](docs/aws-eks-oidc.md) — ECR + EKS deploy via GitHub OIDC
- [docs/aws-cli-github-oidc-ecr-eks.md](docs/aws-cli-github-oidc-ecr-eks.md) — mesmo setup só com AWS CLI (+ roteiro)
- [k8s/README.md](k8s/README.md) — RDS PostgreSQL (`DATABASE_URL`, SG, TLS, migrações)
- [docs/runbook.md](docs/runbook.md) — env vars, operations, 503 behavior, future queue
- [docs/swagger.md](docs/swagger.md) — `/docs` and `/docs-json`
- [docs/datadog-setup.md](docs/datadog-setup.md) — agent Helm example
