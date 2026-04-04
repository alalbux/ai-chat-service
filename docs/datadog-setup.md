# Datadog on Kubernetes

Example Helm values for the Datadog Agent live in [`infra/datadog/values-agent-example.yaml`](../infra/datadog/values-agent-example.yaml).

## Steps (high level)

1. Create a Kubernetes secret with your Datadog API key (`datadog-secret` in the example).
2. Adjust `clusterName`, `site`, and scrape annotations to match your cluster.
3. Install the official Datadog Helm chart using those values.
4. Confirm APM and log pipelines in the Datadog UI.

For application-level metrics, continue to expose Prometheus metrics at `/metrics` and either let the Agent scrape them (as in the example) or use a Prometheus → Datadog integration.
