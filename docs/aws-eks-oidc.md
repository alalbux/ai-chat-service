# AWS EKS + GitHub OIDC (ECR + kubectl)

This guide complements the manifests under `k8s/` and the workflow `.github/workflows/cd-aws-eks.yml`.

## Checklist

1. **EKS cluster** with the AWS Load Balancer Controller installed and an **ALB IngressClass** named `alb` (or change `ingressClassName` in `k8s/base/ingress.yaml`).
2. **ECR repository** for the API image (for example `rt-chat-api`).
3. **IAM OIDC provider** for `token.actions.githubusercontent.com` in your AWS account.
4. **IAM role** trusted for your GitHub repo (`sub` like `repo:ORG/REPO:*`) with:
   - ECR push/pull permissions.
   - `eks:DescribeCluster` (for `aws eks update-kubeconfig`).
   - Kubernetes API access via **EKS access entries** (map the role to the cluster with an appropriate access policy).
5. **GitHub secret** `AWS_ROLE_ARN` pointing at that role.
6. **Repository variables** used by the workflow: `AWS_REGION`, `ECR_REPOSITORY`, `EKS_CLUSTER_NAME`.
7. **Kubernetes secret** `rt-chat-secrets` in namespace `rt-chat` with key `database_url` (RDS URL). See [k8s/README.md](../k8s/README.md).

## Apply manifests

```bash
aws eks update-kubeconfig --name YOUR_CLUSTER --region YOUR_REGION
kubectl apply -k k8s/overlays/aws-eks
kubectl -n rt-chat set image deployment/rt-chat-api api=ACCOUNT.dkr.ecr.REGION.amazonaws.com/REPO:TAG
kubectl rollout status deployment/rt-chat-api -n rt-chat
```

## Terraform starter

See [`infra/terraform/github-oidc-ecr-eks/`](../infra/terraform/github-oidc-ecr-eks/) for IAM OIDC + role + ECR policy scaffolding. Wire EKS access entries in the console or extend Terraform for your provider version.
