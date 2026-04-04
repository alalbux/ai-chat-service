# Kubernetes manifests

[Kustomize](https://kustomize.io/) layout:

- `k8s/base` — Namespace `rt-chat`, Deployment, Service, Ingress (ALB).
- `k8s/overlays/aws-eks` — Patches for AWS (for example ALB health check path).

## RDS PostgreSQL

1. Create an RDS Postgres instance (prefer TLS).
2. Build `DATABASE_URL`, for example:
   `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public&sslmode=require`
3. Store it as a Kubernetes secret:

```bash
kubectl create namespace rt-chat --dry-run=client -o yaml | kubectl apply -f -
kubectl -n rt-chat create secret generic rt-chat-secrets \
  --from-literal=database_url='postgresql://...'
```

4. Allow the cluster (node security groups or RDS security group) to reach RDS on port **5432**.

## Migrations

Run Prisma migrations against RDS **before** or as part of deploy (Job, CI step, or manual):

```bash
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

The container entrypoint does **not** run migrations automatically.

## Image

The base manifest uses a placeholder image `ghcr.io/example/ai-chat-api:latest`. After `kubectl apply`, set the real image:

```bash
kubectl -n rt-chat set image deployment/rt-chat-api api=YOUR_REGISTRY/rt-chat-api:TAG
```

The GitHub workflow `cd-aws-eks.yml` automates this pattern.
