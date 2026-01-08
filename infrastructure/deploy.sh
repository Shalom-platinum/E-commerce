# Deploy Infrastructure with Bicep

# Set variables
RESOURCE_GROUP="K8s-RG"
LOCATION="eastus2"
TEMPLATE_FILE="infrastructure/main.bicep"

# Create resource group if it doesn't exist
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy Bicep template
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file $TEMPLATE_FILE \
  --parameters location=$LOCATION

# Get AKS credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name ecommerce-cluster

echo "Infrastructure deployed successfully!"
echo "AKS cluster: ecommerce-cluster"
echo "ACR: ecommerce007.azurecr.io"