# AWS CLI: GitHub OIDC + ECR + EKS (sem Terraform)

Este fluxo é o mesmo descrito em [aws-eks-oidc.md](./aws-eks-oidc.md), mas usando **AWS CLI** e o console para recursos que o Terraform cobriria.

## 1. Criar o OIDC provider (se ainda não existir)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list <thumbprint>
```

O thumbprint pode ser obtido a partir do certificado TLS do endpoint OIDC (veja a documentação AWS atualizada).

## 2. Criar a role IAM para o GitHub Actions

Trust policy (exemplo — ajuste `ORG` e `REPO`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:*"
        }
      }
    }
  ]
}
```

Anexe políticas para **ECR** (push/pull) e **EKS** (`DescribeCluster` no mínimo; para `kubectl` é necessário access entry no cluster).

## 3. ECR

```bash
aws ecr create-repository --repository-name rt-chat-api --region REGION
```

## 4. EKS access entry

No console EKS → **Access** → adicione o ARN da role com política adequada (por exemplo administrativa em ambientes de lab, ou restrita em produção).

## 5. GitHub

- Secret: `AWS_ROLE_ARN`
- Variáveis: `AWS_REGION`, `ECR_REPOSITORY`, `EKS_CLUSTER_NAME`

Dispare `.github/workflows/cd-aws-eks.yml` com o `image_tag` desejado.
