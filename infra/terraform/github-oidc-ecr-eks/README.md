# Terraform: GitHub OIDC → IAM role + ECR + EKS API access

This directory holds a **minimal starting point** for wiring GitHub Actions (OIDC) to AWS so workflows can push to ECR and `kubectl apply` to EKS without long-lived keys.

## What you customize

- GitHub org/repo allowed in the IAM role trust policy.
- ECR repository name(s).
- EKS cluster name and `AccessEntry` / `AccessPolicy` for the role (see [AWS EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html)).

## Layout

- `main.tf` — OIDC provider + IAM role + example policies (placeholders).
- `variables.tf` — inputs you must set for your account.
- `outputs.tf` — role ARN for `secrets.AWS_ROLE_ARN` in GitHub.

Apply from your machine (or a secure runner) after configuring the AWS provider and remote state.

## Related docs

- [docs/aws-eks-oidc.md](../../docs/aws-eks-oidc.md)
- [docs/aws-cli-github-oidc-ecr-eks.md](../../docs/aws-cli-github-oidc-ecr-eks.md)
