# Deploy Infrastructure with Bicep

param(
    [string]$ResourceGroup = "K8s-RG",
    [string]$Location = "eastus2",
    [string]$TemplateFile = "infrastructure/main.bicep"
)

#dd
# Create resource group if it doesn't exist
az group create --name $ResourceGroup --location $Location

# Deploy Bicep template
az deployment group create `
  --resource-group $ResourceGroup `
  --template-file $TemplateFile `
  --parameters location=$Location

# Get AKS credentials
az aks get-credentials --resource-group $ResourceGroup --name ecommerce-cluster

Write-Host "Infrastructure deployed successfully!"
Write-Host "AKS cluster: ecommerce-cluster"
Write-Host "ACR: ecommerce007.azurecr.io"