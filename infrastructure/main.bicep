param location string = 'eastus2'
param resourceGroupName string = 'K8s-RG'
param acrName string = 'ecommerce007'
param aksName string = 'ecommerce-cluster'
param aksNodeCount int = 2
param aksNodeSize string = 'Standard_B2s' // Cost-effective VM size

// ACR
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic' // Cost-effective tier
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

// AKS
resource aks 'Microsoft.ContainerService/managedClusters@2023-09-02-preview' = {
  name: aksName
  location: location
  properties: {
    kubernetesVersion: '1.28.5'
    dnsPrefix: '${aksName}-dns'
    agentPoolProfiles: [
      {
        name: 'agentpool'
        count: aksNodeCount
        vmSize: aksNodeSize
        osType: 'Linux'
        mode: 'System'
        type: 'VirtualMachineScaleSets'
        enableAutoScaling: true
        minCount: 1
        maxCount: 3
        scaleDownMode: 'Deallocate'
      }
    ]
    networkProfile: {
      networkPlugin: 'azure'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
      dockerBridgeCidr: '172.17.0.1/16'
    }
    addonProfiles: {
      ingressApplicationGateway: {
        enabled: false
      }
      httpApplicationRouting: {
        enabled: false
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// Role assignment for AKS to pull from ACR
resource aksAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aks.id, acr.id, 'AcrPull')
  scope: acr
  properties: {
    principalId: aks.properties.identityProfile.kubeletidentity.objectId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
    principalType: 'ServicePrincipal'
  }
}

// Outputs
output acrLoginServer string = acr.properties.loginServer
output aksClusterName string = aks.name
output aksResourceGroup string = resourceGroupName
output aksLocation string = location
