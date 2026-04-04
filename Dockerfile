# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts

RUN npm ci

RUN npm run build -w @ai-chat/contracts

# Prisma generate needs a syntactically valid URL at build time
ENV DATABASE_URL="postgresql://rtchat:rtchat@localhost:5432/rtchat?schema=public"
RUN npm run build -w @ai-chat/api

RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
COPY --from=build /app /app

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
