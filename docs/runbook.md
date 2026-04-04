# Runbook

## Required environment (API)

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | Postgres connection string for Prisma |
| `LLM_MOCK` | Set `1` for deterministic responses without external LLMs |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | Primary LLM (OpenRouter) |
| `OPENROUTER_SITE_URL` / `OPENROUTER_APP_NAME` | Optional OpenRouter headers |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Failover LLM (Google Gemini) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_TTL_MS` | Global throttling (per IP; default 100 req / 60s) |

## Operations

- **Migrations:** run `make migrate` (or `npx prisma migrate deploy` in CI) against the target database before rolling out a new API version. The container image does not auto-migrate.
- **Health:** orchestrators should use `/health/live` (process up) and `/health/ready` (DB reachable).
- **Metrics:** scrape `/metrics` with Prometheus-compatible collectors.

## 503 behavior

When both OpenRouter and Gemini fail, the API returns **503** with a small JSON payload describing provider errors. Clients should retry with backoff where appropriate.

## Rate limiting

Excessive traffic receives **429** from `@nestjs/throttler`. Tune `RATE_LIMIT_*` per environment.

## Future: async queue

For heavy load or slow providers, consider decoupling HTTP acceptance from completion via a queue/worker; this repo currently processes chat requests synchronously.
