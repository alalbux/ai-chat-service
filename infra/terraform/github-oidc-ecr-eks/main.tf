terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.github_repo}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json
}

data "aws_iam_policy_document" "ecr_push" {
  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:BatchGetImage",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "ecr" {
  name   = "ecr-push-pull"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.ecr_push.json
}

data "aws_iam_policy_document" "eks_access" {
  statement {
    sid    = "EksDescribe"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "eks" {
  name   = "eks-describe"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.eks_access.json
}

# Grant the role Kubernetes API access on your cluster (EKS access entries).
# Example (AWS Console): EKS → cluster → Access → create entry for this role
# with policy AmazonEKSClusterAdminPolicy (or a narrower custom policy).
# Terraform resources for access entries vary by provider version; see docs/aws-eks-oidc.md.
