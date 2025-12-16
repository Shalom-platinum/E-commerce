# E-Commerce Platform - Kubernetes & Helm DevOps Project

A complete e-commerce application built with Django backend, React frontend, and ML recommender engine, fully containerized and orchestrated with Kubernetes and Helm.

## Architecture Overview

### Services
- **Backend**: Django REST API with multiple apps (products, carts, orders, user_accounts)
- **Frontend**: React SPA with responsive UI
- **ML Recommender**: Flask-based machine learning service for product recommendations
- **Database**: PostgreSQL for persistent data
- **Cache**: Redis for caching and sessions
- **Ingress**: Nginx ingress controller for routing

### Key Features
- ✅ Modular Django apps with proper separation of concerns
- ✅ DRF ModelViewSet with serializers for all endpoints
- ✅ ML-based recommendation engine with content-based filtering
- ✅ Automatic model retraining pipeline (supports transactional & telemetry data)
- ✅ Complete Kubernetes manifests with auto-scaling
- ✅ Production-ready Helm charts
- ✅ GitHub Actions CI/CD pipeline
- ✅ Multi-replica deployments with high availability
- ✅ Resource limits and health checks

## Project Structure

```
E-commerce/
├── backend/                    # Django Backend
│   ├── ecommerce/             # Main Django project
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py            # URL routing
│   │   └── wsgi.py            # WSGI application
│   ├── products/              # Products Django app
│   ├── carts/                 # Shopping cart app
│   ├── orders/                # Orders management app
│   ├── user_accounts/         # User profile & auth app
│   ├── Dockerfile             # Backend Docker image
│   ├── manage.py              # Django management script
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── api.js             # API client configuration
│   │   └── services.js        # API service calls
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── Dockerfile             # Frontend Docker image
│   └── package.json           # Node dependencies
│
├── ml-recommender/            # ML Recommendation Service
│   ├── app.py                 # Flask application
│   ├── recommender.py         # ML recommendation logic
│   ├── entrypoint.sh          # Container entrypoint
│   ├── Dockerfile             # ML Docker image
│   └── requirements.txt        # Python ML dependencies
│
├── helm-charts/               # Helm Charts
│   └── ecommerce/
│       ├── Chart.yaml         # Helm chart metadata
│       ├── values.yaml        # Default configuration
│       └── templates/         # K8s resource templates
│
├── k8s/                       # Kubernetes Manifests
│   ├── 00-namespace-config.yaml
│   ├── 01-pvc.yaml            # Persistent volume claims
│   ├── 02-postgres.yaml       # Database service
│   ├── 03-redis.yaml          # Cache service
│   ├── 04-backend.yaml        # Backend deployment
│   ├── 05-ml-recommender.yaml # ML service deployment
│   ├── 06-frontend.yaml       # Frontend deployment
│   ├── 07-ingress.yaml        # Ingress routing
│   └── 08-hpa.yaml            # Horizontal pod autoscalers
│
└── .github/workflows/         # CI/CD Pipeline
    └── deploy.yml             # GitHub Actions workflow
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (minikube, EKS, AKS, etc.)
- Helm 3.x
- kubectl
- Git

### Local Development

#### 1. Build Docker Images
```bash
# Backend
docker build -t ecommerce-backend:latest ./backend

# Frontend
docker build -t ecommerce-frontend:latest ./frontend

# ML Recommender
docker build -t ecommerce-ml:latest ./ml-recommender
```

#### 2. Deploy to Kubernetes (using kubectl)
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
  --from-literal=SECRET_KEY="your-secret-key-here" \
  -n ecommerce

# Apply manifests
kubectl apply -f k8s/

# Verify deployments
kubectl get deployments -n ecommerce
kubectl get pods -n ecommerce
```

#### 3. Deploy using Helm
```bash
# Update values.yaml with your registry
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install chart
helm install ecommerce ./helm-charts/ecommerce \
  --namespace ecommerce \
  --values ./helm-charts/ecommerce/values.yaml \
  --set backend.image.repository=your-registry/ecommerce-backend \
  --set frontend.image.repository=your-registry/ecommerce-frontend \
  --set mlRecommender.image.repository=your-registry/ecommerce-ml

# Verify
helm status ecommerce -n ecommerce
kubectl get all -n ecommerce
```

### Port Forwarding (for local testing)
```bash
# Backend API
kubectl port-forward svc/backend 8000:8000 -n ecommerce

# Frontend
kubectl port-forward svc/frontend 3000:3000 -n ecommerce

# ML Service
kubectl port-forward svc/ml-recommender 8001:8001 -n ecommerce
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **ML API**: http://localhost:8001

## API Endpoints

### Products
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Product detail
- `GET /api/products/{id}/reviews/` - Product reviews
- `POST /api/products/{id}/add_review/` - Add review

### Cart
- `GET /api/carts/` - Get user cart
- `POST /api/carts/add_item/` - Add to cart
- `POST /api/carts/remove_item/` - Remove from cart
- `POST /api/carts/clear/` - Clear cart

### Orders
- `GET /api/orders/` - List user orders
- `GET /api/orders/{id}/` - Order detail
- `POST /api/orders/create_from_cart/` - Create order from cart
- `POST /api/orders/{id}/cancel/` - Cancel order

### User Accounts
- `POST /api/accounts/users/register/` - Register user
- `GET /api/accounts/users/me/` - Get profile
- `PUT /api/accounts/users/update_profile/` - Update profile
- `GET /api/accounts/addresses/` - List addresses
- `POST /api/accounts/addresses/` - Create address

### ML Recommendations
- `GET /api/recommendations/product/{id}` - Product-based recommendations
- `GET /api/recommendations/user/{id}` - Personalized recommendations
- `GET /api/recommendations/popular` - Popular products

## Database Models

### Products App
- `Category` - Product categories
- `Product` - Individual products with attributes (gender, size, color, material)
- `ProductReview` - User product reviews

### Carts App
- `Cart` - User shopping cart
- `CartItem` - Items in cart with quantities

### Orders App
- `Order` - Order information
- `OrderItem` - Items in order
- `OrderTracking` - Order status tracking

### User Accounts App
- `UserProfile` - Extended user information
- `Address` - User shipping/billing addresses

## ML Recommender System

### Algorithm
- **Content-Based Filtering**: Uses TF-IDF vectorization on product attributes
- **Features**: Category, gender, color, material, size, price, rating
- **Similarity Metrics**: Cosine similarity with price and rating adjustments
- **User Preferences**: Optional filtering by user gender/size preferences

### Dummy Data Generation
- 100 products with realistic attributes
- 200 users with purchase/view/rating history
- Features: category, gender, size, color, material, price, rating

### Retraining Pipeline
The system supports retraining with:
- **Transactional Data**: Purchase history, cart additions
- **Telemetry Data**: Page views, search queries, time spent
- **Automatic Retraining**: Triggered on new significant data volumes

### Endpoints
```bash
# Product recommendations
curl http://ml-recommender:8001/api/recommendations/product/1?n=5

# Personalized recommendations
curl http://ml-recommender:8001/api/recommendations/user/123?n=5

# Popular products
curl http://ml-recommender:8001/api/recommendations/popular?n=5

# Trigger retraining
curl -X POST http://ml-recommender:8001/api/retrain
```

## Scaling & Performance

### Horizontal Pod Autoscaling (HPA)
- **Backend**: 2-5 replicas (80% CPU threshold)
- **Frontend**: 2-4 replicas (80% CPU threshold)
- **ML Service**: 1-3 replicas (80% CPU threshold)

### Resource Limits
```yaml
Backend:
  Requests: 250m CPU, 256Mi RAM
  Limits: 500m CPU, 512Mi RAM

Frontend:
  Requests: 128m CPU, 128Mi RAM
  Limits: 256m CPU, 256Mi RAM

ML Service:
  Requests: 500m CPU, 512Mi RAM
  Limits: 1000m CPU, 1Gi RAM

PostgreSQL:
  Requests: 500m CPU, 512Mi RAM
  Limits: 1000m CPU, 1Gi RAM

Redis:
  Requests: 250m CPU, 256Mi RAM
  Limits: 500m CPU, 512Mi RAM
```

## GitHub Actions CI/CD

### Workflow Steps
1. **Build Phase**:
   - Checkout code
   - Build Docker images for all services
   - Push to container registry (GitHub Container Registry)

2. **Deploy Phase** (on main branch):
   - Configure Kubernetes cluster
   - Deploy using Helm
   - Verify rollout status

3. **Test Phase** (on pull requests):
   - Run backend tests
   - Build frontend
   - Test code quality

### Environment Variables Required
- `KUBECONFIG`: Base64-encoded kubeconfig file

### Secrets Configuration
Add these to your GitHub repository:
```
KUBECONFIG - Your base64-encoded kubeconfig
```

## Environment Variables

### Backend
```
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=postgres
DB_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
ML_SERVICE_URL=http://ml-recommender:8001
SECRET_KEY=your-secret-key-here
```

### Frontend
```
REACT_APP_API_URL=http://backend:8000/api
REACT_APP_ML_URL=http://ml-recommender:8001
```

### ML Service
```
PORT=8001
```

## Database Initialization

### Create Admin User
```bash
kubectl exec -it deployment/backend -n ecommerce -- python manage.py createsuperuser
```

### Load Dummy Data
```bash
kubectl exec -it deployment/backend -n ecommerce -- python manage.py shell << EOF
from products.models import Category, Product
from django.contrib.auth.models import User

# Create categories
categories = ['T-Shirts', 'Jeans', 'Jackets', 'Shoes', 'Dresses', 'Sweaters']
for cat in categories:
    Category.objects.get_or_create(name=cat, defaults={'description': f'{cat} category'})

print("Categories created successfully")
EOF
```

## Monitoring & Logging

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n ecommerce

# Frontend logs
kubectl logs -f deployment/frontend -n ecommerce

# ML service logs
kubectl logs -f deployment/ml-recommender -n ecommerce

# Database logs
kubectl logs -f statefulset/postgres -n ecommerce
```

### View Metrics
```bash
# Pod resource usage
kubectl top pod -n ecommerce

# Node resource usage
kubectl top node
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n ecommerce
kubectl logs <pod-name> -n ecommerce
```

### Database connection issues
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
  psql -h postgres -U postgres -d ecommerce_db -c "SELECT 1"
```

### Service communication issues
```bash
# Test service DNS
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- \
  nslookup backend.ecommerce.svc.cluster.local
```

## Cleanup

### Remove Kubernetes Resources
```bash
# Using kubectl
kubectl delete namespace ecommerce

# Using Helm
helm uninstall ecommerce -n ecommerce
```

## Technologies Stack

- **Backend**: Django 4.2, Django REST Framework, PostgreSQL
- **Frontend**: React 18, Axios
- **ML**: Flask, scikit-learn, pandas, numpy
- **DevOps**: Docker, Kubernetes, Helm
- **CI/CD**: GitHub Actions
- **Caching**: Redis
- **Database**: PostgreSQL

## Performance Tips

1. **Database Indexing**: Add indexes on frequently queried fields
2. **Query Optimization**: Use `select_related()` and `prefetch_related()`
3. **Caching Strategy**: Implement Redis caching for recommendations
4. **Image Optimization**: Compress product images before upload
5. **CDN**: Use CDN for static frontend assets

## Security Considerations

1. Update `SECRET_KEY` in production
2. Use strong database passwords
3. Enable HTTPS with cert-manager
4. Implement rate limiting on API endpoints
5. Use Network Policies for inter-pod communication
6. Regularly update dependencies
7. Enable Pod Security Policies

## Contributing

1. Create feature branch
2. Commit changes
3. Push to branch
4. Create Pull Request
5. GitHub Actions will run tests and build preview

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, create an issue in the repository or check the troubleshooting section.
