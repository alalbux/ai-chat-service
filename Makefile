.PHONY: help env install db-up db-down migrate dev-api dev-demo contracts test test-e2e ci \
	docker-build docker-run-local

DOCKER_DB_HOST ?= host.docker.internal

help:
	@echo "AI Chat monorepo — common targets:"
	@echo "  make env           Copy .env templates (apps/api, apps/demo-ui)"
	@echo "  make install       npm ci (or npm install)"
	@echo "  make db-up         docker compose up -d postgres"
	@echo "  make db-down       docker compose down"
	@echo "  make migrate       prisma migrate dev (API workspace)"
	@echo "  make dev-api       Nest API on :3000 (watch); Swagger at /docs"
	@echo "  make dev-demo      Next demo on :3001"
	@echo "  make contracts     Zod contract tests"
	@echo "  make test          contracts + API unit tests"
	@echo "  make test-e2e      API e2e (needs DATABASE_URL + migrated DB)"
	@echo "  make ci            lint:ci, typecheck, test, build"
	@echo "  make docker-build  Build rt-chat-api:local"
	@echo "  make docker-run-local  Run API container -> :3000 (Postgres via DOCKER_DB_HOST, default host.docker.internal)"

env:
	npm run env

install:
	npm install

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

migrate:
	npm run migrate

dev-api:
	@echo Swagger UI: http://localhost:3000/docs
	node apps/api/scripts/run-nest.cjs start --watch

dev-demo:
	npm run dev -w @ai-chat/demo-ui

contracts:
	npm run contracts

test:
	npm run test

test-e2e:
	npm run test-e2e -w @ai-chat/api

ci:
	npm run lint:ci
	npm run typecheck
	npm run test:cov
	npm run build

docker-build:
	docker build -t rt-chat-api:local .

docker-run-local:
	docker run --rm -p 3000:3000 \
		-e DATABASE_URL=postgresql://rtchat:rtchat@$(DOCKER_DB_HOST):5432/rtchat?schema=public \
		-e LLM_MOCK=1 \
		-e PORT=3000 \
		rt-chat-api:local
