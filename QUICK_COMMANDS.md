# Quick Command Reference

## 🐳 Docker & Docker Compose

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up (remove volumes)
docker-compose down -v

# Build specific service
docker-compose build backend
docker-compose build frontend
docker-compose build ml-recommender

# Scale services
docker-compose up -d --scale backend=3
```

### Building Images
```bash
# Build backend image
docker build -t ecommerce-backend:latest ./backend

# Build frontend image
docker build -t ecommerce-frontend:latest ./frontend

# Build ML image
docker build -t ecommerce-ml:latest ./ml-recommender

# Tag images for registry
docker tag ecommerce-backend:latest your-registry.com/ecommerce-backend:latest
docker tag ecommerce-frontend:latest your-registry.com/ecommerce-frontend:latest
docker tag ecommerce-ml:latest your-registry.com/ecommerce-ml:latest

# Push to registry
docker push your-registry.com/ecommerce-backend:latest
docker push your-registry.com/ecommerce-frontend:latest
docker push your-registry.com/ecommerce-ml:latest
```

---

## ☸️ Kubernetes (kubectl)

### Cluster Management
```bash
# Create namespace
kubectl create namespace ecommerce

# Delete namespace (careful!)
kubectl delete namespace ecommerce

# Get current context
kubectl config current-context

# Switch context
kubectl config use-context <context-name>

# View cluster info
kubectl cluster-info
```

### Secrets & Config
```bash
# Create database secret
kubectl create secret generic database-credentials \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD=postgres123 \
  --from-literal=DB_NAME=ecommerce_db \
  --from-literal=DB_HOST=postgres \
  --from-literal=DB_PORT=5432 \
  -n ecommerce

# Create Django secret
kubectl create secret generic django-secret \
  --from-literal=SECRET_KEY="your-secret-key-here" \
  -n ecommerce

# View secrets
kubectl get secrets -n ecommerce
kubectl describe secret database-credentials -n ecommerce
```

### Deployment Operations
```bash
# Apply manifests
kubectl apply -f k8s/

# Apply specific manifest
kubectl apply -f k8s/04-backend.yaml

# Check deployment status
kubectl get deployments -n ecommerce
kubectl describe deployment backend -n ecommerce
kubectl rollout status deployment/backend -n ecommerce --timeout=5m

# View pods
kubectl get pods -n ecommerce
kubectl get pods -n ecommerce -w  # Watch for changes

# View logs
kubectl logs deployment/backend -n ecommerce
kubectl logs pod/backend-5d5c7b8d8c-abc12 -n ecommerce
kubectl logs -f deployment/backend -n ecommerce  # Follow logs

# Scale deployment
kubectl scale deployment backend --replicas=5 -n ecommerce

# Rollout operations
kubectl rollout history deployment/backend -n ecommerce
kubectl rollout undo deployment/backend -n ecommerce
kubectl rollout undo deployment/backend --to-revision=2 -n ecommerce
```

### Debugging
```bash
# Describe pod for errors
kubectl describe pod <pod-name> -n ecommerce

# Execute command in pod
kubectl exec -it <pod-name> -n ecommerce -- /bin/bash
kubectl exec -it deployment/backend -n ecommerce -- python manage.py migrate

# Port forward
kubectl port-forward svc/backend 8000:8000 -n ecommerce
kubectl port-forward svc/frontend 3000:3000 -n ecommerce
kubectl port-forward svc/ml-recommender 8001:8001 -n ecommerce

# Get events
kubectl get events -n ecommerce --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pod -n ecommerce
kubectl top node
```

### Services & Networking
```bash
# List services
kubectl get svc -n ecommerce

# Get service details
kubectl describe service backend -n ecommerce

# List ingress
kubectl get ingress -n ecommerce

# View ingress details
kubectl describe ingress ecommerce-ingress -n ecommerce
```

### Database Operations
```bash
# Connect to PostgreSQL
kubectl exec -it statefulset/postgres -n ecommerce -- \
  psql -U postgres -d ecommerce_db

# Create Django superuser
kubectl exec -it deployment/backend -n ecommerce -- \
  python manage.py createsuperuser

# Run migrations
kubectl exec -it deployment/backend -n ecommerce -- \
  python manage.py migrate

# Collect static files
kubectl exec -it deployment/backend -n ecommerce -- \
  python manage.py collectstatic --noinput
```

---

## 📦 Helm

### Chart Management
```bash
# Validate chart
helm lint ./helm-charts/ecommerce

# Template (dry-run)
helm template ecommerce ./helm-charts/ecommerce

# Show values
helm show values ./helm-charts/ecommerce

# Check chart dependencies
helm dependency list ./helm-charts/ecommerce
helm dependency update ./helm-charts/ecommerce
```

### Releases
```bash
# Install chart
helm install ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce \
  --create-namespace \
  --values ./helm-charts/ecommerce/values.yaml

# Upgrade release
helm upgrade ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce \
  --values values-prod.yaml

# Check release status
helm status ecommerce -n ecommerce

# View release history
helm history ecommerce -n ecommerce

# Get release values
helm get values ecommerce -n ecommerce

# Rollback release
helm rollback ecommerce -n ecommerce
helm rollback ecommerce 1 -n ecommerce  # To specific revision

# Delete release
helm uninstall ecommerce -n ecommerce
```

### Repository Management
```bash
# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add myrepo https://my.registry.com/charts

# Update repositories
helm repo update

# List repositories
helm repo list

# Remove repository
helm repo remove bitnami

# Search charts
helm search repo bitnami
helm search repo bitnami/postgresql
```

---

## 🔄 CI/CD with GitHub Actions

### Manual Workflow Trigger
```bash
# Trigger workflow from command line
gh workflow run deploy.yml -f branch=main

# List workflows
gh workflow list

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# View run logs
gh run view <run-id> --log
```

### Git Operations
```bash
# Clone repository
git clone https://github.com/username/ecommerce.git

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
gh pr create --title "New feature" --body "Description"

# Merge pull request
gh pr merge <pr-number>
```

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test products

# Run specific test class
python manage.py test products.tests.ProductViewSetTest

# Run with verbosity
python manage.py test --verbosity=2

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend Tests
```bash
# Build frontend
npm run build

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/products/

# Using wrk
wrk -t4 -c100 -d30s http://localhost:8000/api/products/
```

---

## 📊 Monitoring & Debugging

### Check System Health
```bash
# Cluster health
kubectl cluster-info
kubectl get nodes
kubectl describe nodes

# All resources
kubectl get all -n ecommerce
kubectl get all -A  # All namespaces

# Resource quotas
kubectl describe quota -n ecommerce
```

### Database Operations
```bash
# Backup database
kubectl exec statefulset/postgres -n ecommerce -- \
  pg_dump -U postgres ecommerce_db > backup.sql

# Test database connection
kubectl run -it --rm --image=postgres:15-alpine --restart=Never -- \
  psql -h postgres.ecommerce.svc.cluster.local -U postgres -d ecommerce_db -c "SELECT 1"
```

### Service Testing
```bash
# Test service DNS
kubectl run -it --rm --image=nicolaka/netshoot --restart=Never -- \
  nslookup backend.ecommerce.svc.cluster.local

# Test service connectivity
kubectl run -it --rm --image=curlimages/curl --restart=Never -- \
  curl http://backend:8000/admin/

# Port forwarding for local testing
kubectl port-forward svc/backend 8000:8000 -n ecommerce &
curl http://localhost:8000/api/products/
```

---

## 🔐 Security Operations

### RBAC
```bash
# Check RBAC policies
kubectl get rolebindings -n ecommerce
kubectl describe rolebinding <name> -n ecommerce

# Create role
kubectl create role pod-reader \
  --verb=get --verb=list --resource=pods -n ecommerce

# Create role binding
kubectl create rolebinding read-pods \
  --clusterrole=pod-reader --serviceaccount=ecommerce:default -n ecommerce
```

### Secrets Management
```bash
# List all secrets
kubectl get secrets -n ecommerce

# Encode secret value
echo -n "password123" | base64

# Decode secret value
kubectl get secret database-credentials -n ecommerce \
  -o jsonpath='{.data.DB_PASSWORD}' | base64 --decode

# Create secret from file
kubectl create secret generic db-backup \
  --from-file=backup.sql -n ecommerce
```

---

## 📈 Performance Tuning

### Autoscaling
```bash
# View HPA status
kubectl get hpa -n ecommerce
kubectl describe hpa backend-hpa -n ecommerce

# Edit HPA
kubectl edit hpa backend-hpa -n ecommerce

# Manually patch HPA
kubectl patch hpa backend-hpa -n ecommerce \
  --type merge -p '{"spec":{"maxReplicas":10}}'
```

### Resource Management
```bash
# View resource requests
kubectl describe deployment backend -n ecommerce

# Edit resource limits
kubectl set resources deployment backend \
  --limits=cpu=1000m,memory=1Gi \
  --requests=cpu=500m,memory=512Mi \
  -n ecommerce
```

---

## 🛠️ Troubleshooting Commands

### Common Issues
```bash
# Pod stuck in pending
kubectl describe pod <pod-name> -n ecommerce

# Pod crash loop
kubectl logs <pod-name> -n ecommerce --previous

# Service not accessible
kubectl get endpoints <service-name> -n ecommerce

# Check ingress configuration
kubectl get ingress -n ecommerce
kubectl describe ingress ecommerce-ingress -n ecommerce

# Validate manifest
kubectl apply -f manifest.yaml --dry-run=client

# Get detailed pod info
kubectl get pod <pod-name> -n ecommerce -o yaml
```

### Network Debugging
```bash
# Check DNS resolution
kubectl run -it --rm --image=nicolaka/netshoot --restart=Never -- \
  nslookup kubernetes.default

# Check connectivity between pods
kubectl run -it --rm --image=nicolaka/netshoot --restart=Never -- \
  curl http://backend:8000

# Check network policies
kubectl get networkpolicies -n ecommerce
```

---

## 📝 Useful Aliases (add to .bashrc or .zshrc)

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgd='kubectl get deployments'
alias kgn='kubectl get nodes'
alias kdp='kubectl describe pod'
alias kdd='kubectl describe deployment'
alias klogs='kubectl logs -f'
alias kex='kubectl exec -it'
alias kaf='kubectl apply -f'
alias kdel='kubectl delete'
alias kwl='kubectl logs'

# Helm aliases
alias h='helm'
alias hi='helm install'
alias hu='helm upgrade'
alias hl='helm list'
alias hs='helm status'
alias hr='helm rollback'
```

---

## 📚 Reference Links

- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Helm Commands](https://helm.sh/docs/helm/helm/)
- [Docker Commands](https://docs.docker.com/engine/reference/commandline/cli/)
- [Git Commands](https://git-scm.com/docs)
- [Django Management](https://docs.djangoproject.com/en/4.2/ref/django-admin/)

---

**Keep this guide handy for quick command references!**
