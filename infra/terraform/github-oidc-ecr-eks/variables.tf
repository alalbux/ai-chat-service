variable "aws_region" {
  type        = string
  description = "AWS region for ECR/EKS"
  default     = "us-east-1"
}

variable "github_org" {
  type        = string
  description = "GitHub org or user (for trust policy audience)"
}

variable "github_repo" {
  type        = string
  description = "Repository name only (without org)"
}

variable "ecr_repository_name" {
  type        = string
  description = "ECR repository to grant push/pull"
  default     = "rt-chat-api"
}
