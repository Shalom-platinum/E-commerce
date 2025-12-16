# API Reference Guide

## Base URL
```
http://localhost:8000/api  (local)
http://backend:8000/api    (kubernetes)
```

## Authentication
Most endpoints require a token. Include in headers:
```
Authorization: Token <your-auth-token>
```

---

## Products API

### List Products
```http
GET /api/products/
```

**Query Parameters**:
- `category` - Filter by category ID
- `gender` - Filter by gender (M, W, U)
- `size` - Filter by size
- `color` - Filter by color
- `price` - Filter by price range
- `search` - Search by name, description, material
- `ordering` - Sort by price, rating, or created_at

**Example**:
```bash
curl "http://localhost:8000/api/products/?gender=M&size=L&ordering=-rating"
```

**Response**:
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Classic Blue T-Shirt",
      "price": "29.99",
      "gender": "M",
      "size": "L",
      "color": "Blue",
      "rating": 4.5,
      "image": "http://localhost:8000/media/products/tshirt.jpg",
      "category": {
        "id": 1,
        "name": "T-Shirts"
      }
    }
  ]
}
```

### Get Product Details
```http
GET /api/products/{id}/
```

**Response**:
```json
{
  "id": 1,
  "name": "Classic Blue T-Shirt",
  "description": "High quality cotton t-shirt",
  "category": {
    "id": 1,
    "name": "T-Shirts",
    "description": "Casual t-shirts collection"
  },
  "price": "29.99",
  "cost_price": "15.00",
  "gender": "M",
  "size": "L",
  "color": "Blue",
  "material": "100% Cotton",
  "rating": 4.5,
  "stock": 50,
  "image": "http://localhost:8000/media/products/tshirt.jpg",
  "sku": "TSH-BLU-L",
  "is_active": true,
  "reviews": [
    {
      "id": 1,
      "user": "john_doe",
      "rating": 5,
      "title": "Excellent quality",
      "comment": "Very comfortable and fits perfectly",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get Product Reviews
```http
GET /api/products/{id}/reviews/
```

### Add Product Review
```http
POST /api/products/{id}/add_review/
Content-Type: application/json
Authorization: Token <token>

{
  "rating": 5,
  "title": "Great product",
  "comment": "Very satisfied with this purchase"
}
```

### List Categories
```http
GET /api/products/categories/
```

---

## Cart API

### Get Cart
```http
GET /api/carts/
Authorization: Token <token>
```

**Response**:
```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Classic Blue T-Shirt",
        "price": "29.99",
        "image": "http://localhost:8000/media/products/tshirt.jpg"
      },
      "quantity": 2,
      "total": "59.98"
    }
  ],
  "total": "59.98",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Add to Cart
```http
POST /api/carts/add_item/
Authorization: Token <token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

### Remove from Cart
```http
POST /api/carts/remove_item/
Authorization: Token <token>
Content-Type: application/json

{
  "product_id": 1
}
```

### Clear Cart
```http
POST /api/carts/clear/
Authorization: Token <token>
```

---

## Orders API

### List Orders
```http
GET /api/orders/
Authorization: Token <token>
```

**Query Parameters**:
- `status` - pending, processing, shipped, delivered, cancelled
- `payment_status` - pending, paid, failed

**Response**:
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "order_number": "ORD-ABC123XYZ",
      "status": "shipped",
      "payment_status": "paid",
      "total_amount": "129.98",
      "tax_amount": "13.00",
      "shipping_cost": "10.00",
      "shipping_address": "123 Main St, City, State 12345",
      "billing_address": "123 Main St, City, State 12345",
      "items": [
        {
          "id": 1,
          "product": { ... },
          "quantity": 2,
          "price": "29.99"
        }
      ],
      "tracking": [
        {
          "id": 1,
          "status": "shipped",
          "description": "Order has been shipped",
          "created_at": "2024-01-16T10:00:00Z"
        }
      ],
      "notes": "Special delivery instructions",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-16T10:00:00Z"
    }
  ]
}
```

### Get Order Details
```http
GET /api/orders/{id}/
Authorization: Token <token>
```

### Create Order from Cart
```http
POST /api/orders/create_from_cart/
Authorization: Token <token>
Content-Type: application/json

{
  "shipping_address": "123 Main St, City, State 12345",
  "billing_address": "123 Main St, City, State 12345"
}
```

**Response**: Order object (see list response format)

### Cancel Order
```http
POST /api/orders/{id}/cancel/
Authorization: Token <token>
```

---

## User Accounts API

### Register User
```http
POST /api/accounts/users/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123",
  "confirm_password": "securepassword123"
}
```

**Response**:
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Get User Profile
```http
GET /api/accounts/users/me/
Authorization: Token <token>
```

**Response**:
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "profile": {
    "phone": "+1234567890",
    "date_of_birth": "1990-01-15",
    "gender": "M",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA",
    "profile_image": "http://localhost:8000/media/profile_images/user.jpg"
  },
  "addresses": [
    {
      "id": 1,
      "label": "home",
      "street_address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "USA",
      "is_default": true
    }
  ]
}
```

### Update User Profile
```http
PUT /api/accounts/users/update_profile/
Authorization: Token <token>
Content-Type: application/json

{
  "first_name": "Jonathan",
  "profile": {
    "phone": "+1234567890",
    "gender": "M",
    "city": "New York"
  }
}
```

### List User Addresses
```http
GET /api/accounts/addresses/
Authorization: Token <token>
```

### Create Address
```http
POST /api/accounts/addresses/
Authorization: Token <token>
Content-Type: application/json

{
  "label": "home",
  "street_address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA",
  "is_default": true
}
```

### Update Address
```http
PUT /api/accounts/addresses/{id}/
Authorization: Token <token>
Content-Type: application/json

{
  "label": "work",
  "street_address": "456 Work Ave",
  "city": "Boston",
  "state": "MA",
  "postal_code": "02101",
  "country": "USA",
  "is_default": false
}
```

### Delete Address
```http
DELETE /api/accounts/addresses/{id}/
Authorization: Token <token>
```

---

## ML Recommendations API

### Get Product Recommendations
```http
GET /api/recommendations/product/{product_id}?n=5&gender=M&size=L
```

**Query Parameters**:
- `n` - Number of recommendations (default: 5)
- `gender` - Optional gender filter
- `size` - Optional size filter

**Response**:
```json
{
  "product_id": 1,
  "recommendations": [
    {
      "product_id": 5,
      "category": "T-Shirts",
      "gender": "M",
      "color": "Black",
      "similarity_score": 0.92
    },
    {
      "product_id": 8,
      "category": "T-Shirts",
      "gender": "M",
      "color": "White",
      "similarity_score": 0.87
    }
  ],
  "count": 2
}
```

### Get Personalized Recommendations
```http
GET /api/recommendations/user/{user_id}?n=5
```

**Query Parameters**:
- `n` - Number of recommendations (default: 5)

**Response**:
```json
{
  "user_id": 123,
  "recommendations": [
    {
      "product_id": 15,
      "category": "Jeans",
      "gender": "M",
      "color": "Blue",
      "similarity_score": 0.85
    }
  ],
  "count": 1
}
```

### Get Popular Products
```http
GET /api/recommendations/popular?n=5
```

**Response**:
```json
{
  "recommendations": [
    {
      "product_id": 1,
      "category": "T-Shirts",
      "gender": "U",
      "color": "Black"
    }
  ],
  "count": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid parameters",
  "details": {
    "field": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

---

## Pagination

List endpoints support pagination:

**Response Headers**:
- `count` - Total number of items
- `next` - URL to next page (or null)
- `previous` - URL to previous page (or null)

**Query Parameters**:
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

**Example**:
```bash
curl "http://localhost:8000/api/products/?page=2&page_size=50"
```

---

## Authentication

### Get Token (Django)
To obtain a token, Django REST Framework provides several authentication methods.

**Token Authentication Setup** (already configured):
1. Tokens are created when users register or login
2. Include token in all authenticated requests:
```
Authorization: Token abc123def456...
```

---

## Health Checks

### Backend Health
```http
GET /admin/
```
Returns 200 if healthy

### ML Service Health
```http
GET /health
```
**Response**:
```json
{
  "status": "healthy",
  "service": "ml-recommender"
}
```

---

## Rate Limiting

Not currently implemented, but recommended for production.

---

## Versioning

Current API version: v1 (implicit in URLs)

Future versions could use:
- `/api/v1/products/` (URL path)
- `Accept: application/json; version=1.0` (header)
