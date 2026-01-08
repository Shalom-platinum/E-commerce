# E-Commerce Platform CI/CD

This repository contains an automated CI/CD pipeline for deploying the E-Commerce platform to Azure Kubernetes Service (AKS).

## Prerequisites

- Azure subscription with AKS cluster
- Azure Container Registry (ACR)
- GitHub repository with secrets configured

## Azure Resources Used

- **Resource Group**: `K8s-RG`
- **AKS Cluster**: `ecommerce-cluster`
- **ACR**: `ecommerce007.azurecr.io`
- **Namespace**: `ecommerce`

## Infrastructure Setup (Bicep)

If you need to create the infrastructure from scratch:

```bash
# Using Bash
./infrastructure/deploy.sh

# Or using PowerShell
./infrastructure/deploy.ps1
```

This will create:
- Resource group `K8s-RG`
- ACR `ecommerce007` (Basic tier for cost savings)
- AKS cluster `ecommerce-cluster` with 2 B2s nodes (cost-effective)

## GitHub Secrets Required

Add the following secrets to your GitHub repository:

### AZURE_CREDENTIALS
Create a service principal and get the credentials:

```bash
az ad sp create-for-rbac --name "github-actions-sp" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID --sdk-auth
```

Copy the JSON output and paste it as the `AZURE_CREDENTIALS` secret.

## Workflow

The CI/CD pipeline (`/.github/workflows/deploy.yml`) does the following:

1. **Build Phase**:
   - Builds Docker images for backend, frontend, and ML recommender
   - Pushes images to Azure Container Registry

2. **Deploy Phase**:
   - Connects to AKS cluster
   - Deploys/upgrades Helm chart
   - Uses latest image tags

## Manual Deployment

If you need to deploy manually:

```bash
# Build and push images
docker build -t ecommerce007.azurecr.io/ecommerce-backend:latest ./backend
docker build -t ecommerce007.azurecr.io/ecommerce-frontend:latest ./frontend
docker build -t ecommerce007.azurecr.io/ecommerce-ml:latest ./ml-recommender

az acr login --name ecommerce007
docker push ecommerce007.azurecr.io/ecommerce-backend:latest
docker push ecommerce007.azurecr.io/ecommerce-frontend:latest
docker push ecommerce007.azurecr.io/ecommerce-ml:latest

# Deploy
az aks get-credentials --resource-group K8s-RG --name ecommerce-cluster
helm upgrade ecommerce ./helm-charts/ecommerce -f ./helm-charts/ecommerce/values.yaml -n ecommerce
```

## Cost Optimization

The setup uses:
- Basic ACR tier
- Minimal AKS node configuration (B2s VMs)
- Auto-scaling enabled (1-3 nodes)
- Spot instances can be configured for further savings

## Monitoring

Check deployment status:
```bash
kubectl get pods -n ecommerce
kubectl get svc -n ecommerce
helm status ecommerce -n ecommerce
```