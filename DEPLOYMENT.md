# Deployment Guide

## Pre-Deployment Checklist

- [ ] Update Docker image registry URLs
- [ ] Set strong secrets in `values.yaml` and Kubernetes manifests
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up database backups
- [ ] Configure ingress domain names
- [ ] Set resource limits based on your cluster capacity
- [ ] Configure monitoring and logging
- [ ] Test in staging environment first

## Deployment Strategies

### Strategy 1: Blue-Green Deployment

1. **Deploy new version (Green environment)**
```bash
helm install ecommerce-v2 ./helm-charts/ecommerce \
  --namespace ecommerce \
  --values values-green.yaml
```

2. **Test thoroughly**
```bash
kubectl port-forward svc/ecommerce-v2-frontend 3000:3000 -n ecommerce
# Run full test suite
```

3. **Switch traffic**
```bash
# Update ingress to point to new service
kubectl patch ingress ecommerce-ingress -n ecommerce \
  -p '{"spec":{"rules":[{"host":"ecommerce.local","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"ecommerce-v2-frontend","port":{"number":3000}}}}]}}]}}'
```

4. **Rollback if needed**
```bash
# Delete new version and revert ingress
helm uninstall ecommerce-v2 -n ecommerce
```

### Strategy 2: Canary Deployment

1. **Deploy new version alongside old**
```bash
kubectl patch service backend -n ecommerce -p \
  '{"spec":{"selector":{"version":"v1"}}}'

# Update old deployment
kubectl patch deployment backend -n ecommerce \
  -p '{"spec":{"template":{"metadata":{"labels":{"version":"v1"}}}}}'

# Deploy new version
kubectl apply -f backend-canary-deployment.yaml
```

2. **Gradually shift traffic**
```bash
# Start with 10%
kubectl patch deployment backend-canary -n ecommerce \
  -p '{"spec":{"replicas":1}}'
kubectl patch deployment backend -n ecommerce \
  -p '{"spec":{"replicas":9}}'

# Monitor metrics
kubectl top pod -n ecommerce
```

3. **Complete rollout**
```bash
# Once stable, scale old deployment to 0
kubectl patch deployment backend -n ecommerce \
  -p '{"spec":{"replicas":0}}'
```

### Strategy 3: Rolling Update (Default Helm)

```bash
helm upgrade ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce \
  --values values.yaml
  
# Monitor rollout
kubectl rollout status deployment/backend -n ecommerce --timeout=5m
```

## Production Deployment

### 1. Pre-flight Checks

```bash
# Validate Helm chart
helm lint ./helm-charts/ecommerce

# Check syntax
kubectl --dry-run=client apply -f k8s/ --recursive

# Verify images are available
docker pull your-registry/ecommerce-backend:v1.0.0
docker pull your-registry/ecommerce-frontend:v1.0.0
docker pull your-registry/ecommerce-ml:v1.0.0
```

### 2. Set Up Namespaces and Secrets

```bash
# Create namespace
kubectl create namespace ecommerce-prod

# Create image pull secret (if private registry)
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=username \
  --docker-password=password \
  --docker-email=email@example.com \
  -n ecommerce-prod

# Create application secrets
kubectl create secret generic database-credentials \
  --from-literal=DB_USER=prod_user \
  --from-literal=DB_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=DB_NAME=ecommerce_prod \
  --from-literal=DB_HOST=postgres.ecommerce-prod.svc.cluster.local \
  --from-literal=DB_PORT=5432 \
  -n ecommerce-prod

kubectl create secret generic django-secret \
  --from-literal=SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))') \
  -n ecommerce-prod
```

### 3. Configure Production Values

Create `values-prod.yaml`:

```yaml
replicaCount: 3

backend:
  replicaCount: 3
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10

frontend:
  replicaCount: 3
  resources:
    limits:
      cpu: 512m
      memory: 512Mi
    requests:
      cpu: 256m
      memory: 256Mi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 8

postgresql:
  primary:
    persistence:
      size: 100Gi

redis:
  master:
    persistence:
      size: 20Gi

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: ecommerce.com
      paths:
        - path: /
          pathType: Prefix

backend:
  env:
    DEBUG: "False"
    ALLOWED_HOSTS: "ecommerce.com,www.ecommerce.com"
    CORS_ALLOWED_ORIGINS: "https://ecommerce.com,https://www.ecommerce.com"
```

### 4. Deploy to Production

```bash
# Add helm repo for dependencies
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install with production values
helm install ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce-prod \
  --values values-prod.yaml \
  --set postgresql.auth.password=$(openssl rand -base64 32) \
  --set backend.image.tag=v1.0.0 \
  --set frontend.image.tag=v1.0.0 \
  --set mlRecommender.image.tag=v1.0.0 \
  --wait \
  --timeout 15m

# Verify deployment
kubectl get all -n ecommerce-prod
helm status ecommerce -n ecommerce-prod
```

### 5. Post-Deployment Steps

```bash
# Run database migrations
kubectl exec -it deployment/backend -n ecommerce-prod -- \
  python manage.py migrate

# Create superuser
kubectl exec -it deployment/backend -n ecommerce-prod -- \
  python manage.py createsuperuser

# Collect static files
kubectl exec -it deployment/backend -n ecommerce-prod -- \
  python manage.py collectstatic --noinput

# Verify all pods are running
kubectl get pods -n ecommerce-prod -w
```

### 6. Health Checks

```bash
# Check endpoint health
kubectl exec -it deployment/backend -n ecommerce-prod -- \
  curl http://localhost:8000/admin/

# Check database
kubectl exec -it statefulset/postgres -n ecommerce-prod -- \
  psql -U postgres -d ecommerce_db -c "SELECT 1"

# Check Redis
kubectl exec -it deployment/redis -n ecommerce-prod -- \
  redis-cli ping

# Check ML service
kubectl exec -it deployment/ml-recommender -n ecommerce-prod -- \
  curl http://localhost:8001/health
```

## Monitoring Setup

### Install Prometheus & Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Default credentials: admin / prom-operator
```

### Create Service Monitors

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-monitor
  namespace: ecommerce-prod
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
    - port: http
      interval: 30s
```

## Backup and Disaster Recovery

### Database Backup

```bash
# Manual backup
kubectl exec -it statefulset/postgres -n ecommerce-prod -- \
  pg_dump -U postgres ecommerce_db > backup.sql

# Automated backup with cronjob
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ecommerce-prod
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump -h postgres -U postgres ecommerce_db | gzip > /backups/backup-$(date +%Y%m%d).sql.gz
            volumeMounts:
            - name: backup-volume
              mountPath: /backups
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

### Restore from Backup

```bash
# Restore database
kubectl exec -it statefulset/postgres -n ecommerce-prod -- \
  psql -U postgres < backup.sql
```

## Scaling Guidelines

### Horizontal Scaling

```bash
# Manual scale
kubectl scale deployment backend --replicas=5 -n ecommerce-prod

# Check HPA status
kubectl describe hpa backend-hpa -n ecommerce-prod

# Adjust HPA thresholds
kubectl patch hpa backend-hpa -n ecommerce-prod --type merge -p \
  '{"spec":{"maxReplicas":20,"targetCPUUtilizationPercentage":70}}'
```

### Vertical Scaling

Update `values.yaml`:

```yaml
backend:
  resources:
    limits:
      cpu: 2000m
      memory: 2Gi
    requests:
      cpu: 1000m
      memory: 1Gi
```

Then upgrade:

```bash
helm upgrade ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce-prod \
  --values values-prod.yaml
```

## Troubleshooting Production Issues

### Pod CrashLoopBackOff

```bash
# Check logs
kubectl logs deployment/backend -n ecommerce-prod --previous

# Check events
kubectl describe pod <pod-name> -n ecommerce-prod

# Check resource limits
kubectl describe node
```

### Database Performance

```bash
# Slow queries
kubectl exec -it statefulset/postgres -n ecommerce-prod -- \
  psql -U postgres -d ecommerce_db << EOF
SELECT query, mean_time, calls FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;
EOF

# Index analysis
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### Memory Issues

```bash
# Check pod memory usage
kubectl top pod -n ecommerce-prod

# Identify high-memory pods
kubectl top pod -n ecommerce-prod --sort-by=memory
```

## Rollback Procedures

### Helm Rollback

```bash
# View release history
helm history ecommerce -n ecommerce-prod

# Rollback to previous release
helm rollback ecommerce 1 -n ecommerce-prod

# Verify rollback
helm status ecommerce -n ecommerce-prod
```

### Kubernetes Rollback

```bash
# Check rollout history
kubectl rollout history deployment/backend -n ecommerce-prod

# Rollback to previous revision
kubectl rollout undo deployment/backend -n ecommerce-prod

# Rollback to specific revision
kubectl rollout undo deployment/backend -n ecommerce-prod --to-revision=2

# Check rollout status
kubectl rollout status deployment/backend -n ecommerce-prod
```

## Cost Optimization

1. **Use spot instances** for non-critical workloads
2. **Set appropriate resource requests/limits** to avoid overprovisioning
3. **Implement pod disruption budgets** for graceful scaling
4. **Use horizontal pod autoscaling** to match demand
5. **Implement node autoscaling** based on cluster needs
6. **Use storage classes** optimized for your cloud provider

## Security Checklist

- [ ] Rotate secrets regularly
- [ ] Enable RBAC and network policies
- [ ] Use pod security policies
- [ ] Implement image scanning
- [ ] Set resource quotas
- [ ] Enable audit logging
- [ ] Implement admission controllers
- [ ] Use sealed secrets for sensitive data
- [ ] Implement service mesh (Istio/Linkerd) for mTLS
- [ ] Regular security audits

## Additional Resources

- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Production Best Practices](https://kubernetes.io/docs/concepts/production-environment/)
- [Deployment Patterns](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
