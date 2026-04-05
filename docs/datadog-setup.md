# Datadog

## Docker Compose (local APM)

The stack uses a named bridge network **`rtchat`** ([`docker-compose.yml`](../docker-compose.yml)) so the API resolves the Agent as **`datadog-agent`**.

1. Copy [`docker-compose.datadog.env.example`](../docker-compose.datadog.env.example) to **`.env`** in the repo root (do not commit). Set **`DD_API_KEY`** and **`DD_SITE`** (e.g. `us5.datadoghq.com`).
2. Set **`DD_TRACE_ENABLED=true`** in that `.env` when you want the API to send traces.
3. Start Postgres + API + Agent:

   ```bash
   docker compose --profile datadog --env-file .env up -d --build
   ```

Without the **`datadog`** profile, only Postgres and API run; **`DD_TRACE_ENABLED`** defaults to **`false`**, so the app does not require an Agent.

The API container receives:

- **`DD_AGENT_HOST=datadog-agent`**, **`DD_TRACE_AGENT_PORT=8126`**
- **`DD_SERVICE`**, **`DD_ENV`**, **`DD_VERSION`** (override via `.env` if needed)
- Optional **`DD_LOGS_INJECTION`**, **`DD_TRACE_SAMPLE_RATE`**

Nest is instrumented with **`dd-trace`**: [`apps/api/src/tracer.ts`](../apps/api/src/tracer.ts) is loaded first from [`apps/api/src/main.ts`](../apps/api/src/main.ts).

## Kubernetes

Example Helm values for the Datadog Agent live in [`infra/datadog/values-agent-example.yaml`](../infra/datadog/values-agent-example.yaml).

### Steps (high level)

1. Create a Kubernetes secret with your Datadog API key (`datadog-secret` in the example).
2. Adjust `clusterName`, `site`, and scrape annotations to match your cluster.
3. Install the official Datadog Helm chart using those values.
4. Point the API deployment at the in-cluster trace intake (port **8126**). On the API container, set at least **`DD_TRACE_ENABLED`** (use **`false`** until the Agent is ready), **`DD_SERVICE`**, **`DD_ENV`**, **`DD_TRACE_AGENT_PORT=8126`**, and when sending traces **`DD_AGENT_HOST`** (see below). You can add these in [`k8s/base/deployment.yaml`](../k8s/base/deployment.yaml) or patch the Deployment after apply.

To **enable APM** after the Agent is installed, set **`DD_TRACE_ENABLED=true`** and **`DD_AGENT_HOST`** to a reachable trace endpoint, for example:

- **DaemonSet / host networking:** `DD_AGENT_HOST` = the node IP (`status.hostIP` via downward API), if the Agent listens on the node on 8126.
- **Service:** DNS name of the Datadog trace Service in the Agent namespace (depends on your Helm release name).

Example patch (adjust namespace and deployment name):

```bash
kubectl -n rt-chat set env deployment/rt-chat-api \
  DD_TRACE_ENABLED=true \
  DD_AGENT_HOST=<trace-host-or-node-ip>
```

The Nest app already loads [`dd-trace`](../apps/api/src/tracer.ts) before bootstrap; no image change is required beyond a rebuild that includes the current API code.

For application-level metrics, continue to expose Prometheus metrics at `/metrics` and either let the Agent scrape them (as in the example) or use a Prometheus → Datadog integration.

## Next.js demo UI

The demo app (`apps/demo-ui`) is not covered here; use Datadog’s Next.js guidance if you need browser or SSR tracing there.
