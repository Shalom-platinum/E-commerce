# Quick Start Guide

## Prerequisites
- Docker & Docker Compose installed
- kubectl installed
- Helm 3.x installed
- A Kubernetes cluster (minikube for local development)

## Option 1: Local Development with Docker Compose

### Start All Services
```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 8000)
- ML Recommender (port 8001)
- Frontend (port 3000)

### Verify Services
```bash
docker-compose ps
```

### Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin (user: admin, password: admin)
- **ML API**: http://localhost:8001/health

### Useful Commands
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ml-recommender

# Stop services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v
```

## Option 2: Kubernetes Deployment with kubectl

### 1. Start Kubernetes Cluster
```bash
minikube start
eval $(minikube docker-env)  # Use minikube's Docker daemon
```

### 2. Build Images (if using minikube)
```bash
docker build -t ecommerce-backend:latest ./backend
docker build -t ecommerce-frontend:latest ./frontend
docker build -t ecommerce-ml:latest ./ml-recommender
```

### 3. Deploy
```bash
# Create namespace
kubectl create namespace ecommerce

# Create secrets
kubectl create secret generic database-credentials \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=postgres123 \
  --from-literal=DB_NAME=ecommerce_db \
  --from-literal=DB_HOST=postgres \
  --from-literal=DB_PORT=5432 \
  -n ecommerce

kubectl create secret generic django-secret \
  --from-literal=SECRET_KEY="django-insecure-your-secret-key-here" \
  -n ecommerce

# Apply manifests
kubectl apply -f k8s/

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s \
  deployment/postgres -n ecommerce
kubectl wait --for=condition=available --timeout=300s \
  deployment/backend -n ecommerce
```

### 4. Access Services
```bash
# Port forward to access locally
kubectl port-forward svc/frontend 3000:3000 -n ecommerce &
kubectl port-forward svc/backend 8000:8000 -n ecommerce &
kubectl port-forward svc/ml-recommender 8001:8001 -n ecommerce &

# Or get service details
kubectl get svc -n ecommerce
```

## Option 3: Kubernetes Deployment with Helm

### 1. Install Helm Dependencies
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### 2. Deploy Chart
```bash
helm install ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce --create-namespace \
  --set backend.image.tag=latest \
  --set frontend.image.tag=latest \
  --set mlRecommender.image.tag=latest
```

### 3. Verify Deployment
```bash
helm status ecommerce -n ecommerce
kubectl get all -n ecommerce
```

### 4. Access Services
```bash
# Port forwarding
kubectl port-forward svc/ecommerce-backend 8000:8000 -n ecommerce &
kubectl port-forward svc/ecommerce-frontend 3000:3000 -n ecommerce &

# Or upgrade with ingress enabled
helm upgrade ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ecommerce.local
```

## Testing the Application

### 1. Create Products (via Django Admin)
Visit http://localhost:8000/admin
- Login with admin credentials
- Add categories and products

### 2. Test API
```bash
# List products
curl http://localhost:8000/api/products/

# Register user
curl -X POST http://localhost:8000/api/accounts/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "confirm_password": "testpass123"
  }'

# Get recommendations
curl http://localhost:8001/api/recommendations/product/1?n=5
```

### 3. Test Frontend
Visit http://localhost:3000 and interact with the interface

## Database Management

### Create Superuser
```bash
# With Docker Compose
docker-compose exec backend python manage.py createsuperuser

# With Kubernetes
kubectl exec -it deployment/backend -n ecommerce -- python manage.py createsuperuser
```

### Run Migrations
```bash
# With Docker Compose
docker-compose exec backend python manage.py migrate

# With Kubernetes
kubectl exec -it deployment/backend -n ecommerce -- python manage.py migrate
```

### Load Sample Data
```bash
# Create some products via Django admin or API
```

## Monitoring & Debugging

### View Logs
```bash
# Docker Compose
docker-compose logs -f [service-name]

# Kubernetes
kubectl logs -f deployment/[deployment-name] -n ecommerce
```

### Check Pod Status
```bash
kubectl describe pod [pod-name] -n ecommerce
kubectl logs [pod-name] -n ecommerce
```

### View Resources
```bash
kubectl get pods -n ecommerce
kubectl get svc -n ecommerce
kubectl get ingress -n ecommerce
```

## Scaling

### Manual Scaling
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n ecommerce

# Scale frontend to 2 replicas
kubectl scale deployment frontend --replicas=2 -n ecommerce
```

### Check HPA Status
```bash
kubectl get hpa -n ecommerce
kubectl describe hpa backend-hpa -n ecommerce
```

## Cleanup

### Docker Compose
```bash
docker-compose down -v
```

### Kubernetes (kubectl)
```bash
kubectl delete namespace ecommerce
```

### Kubernetes (Helm)
```bash
helm uninstall ecommerce -n ecommerce
kubectl delete namespace ecommerce
```

## Troubleshooting

### Services won't start
1. Check logs: `docker-compose logs` or `kubectl logs`
2. Verify database connectivity
3. Check environment variables

### Database connection errors
```bash
# Test connection
docker-compose exec postgres psql -U postgres -d ecommerce_db -c "SELECT 1"

# Or in Kubernetes
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
  psql -h postgres -U postgres -d ecommerce_db -c "SELECT 1"
```

### ML service not responding
1. Check if service is ready: `kubectl describe deployment ml-recommender -n ecommerce`
2. Check logs for model initialization errors

## Next Steps

1. **Add More Features**: Implement payment processing, email notifications
2. **Improve ML Model**: Train on real data, implement collaborative filtering
3. **Add Tests**: Write unit and integration tests
4. **Setup Monitoring**: Add Prometheus/Grafana for metrics
5. **Enable SSL/TLS**: Configure cert-manager for HTTPS
6. **Database Backup**: Setup automated backup strategy

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [React Documentation](https://react.dev/)
