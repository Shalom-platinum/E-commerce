# E-Commerce Frontend - Complete Setup Guide

## Overview
The frontend has been restructured to support both **Customer Portal** and **Admin Portal** with enhanced UI/UX.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navigation.js           # Main navigation component
│   │   └── admin/
│   │       ├── AdminProducts.js    # Product management (CRUD)
│   │       ├── AdminCategories.js  # Category management
│   │       ├── AdminOrders.js      # Order tracking and management
│   │       └── AdminUsers.js       # User management
│   ├── pages/
│   │   ├── AdminPortal.js          # Admin main portal
│   │   ├── ProductList.js          # Customer product listing
│   │   ├── ProductDetail.js        # Product detail view
│   │   ├── Cart.js                 # Shopping cart
│   │   ├── Checkout.js             # Checkout process
│   │   ├── Login.js                # User login
│   │   ├── Register.js             # User registration
│   │   ├── UserProfile.js          # User profile management
│   │   └── MyOrders.js             # Customer order history
│   ├── styles/
│   │   ├── AdminPortal.css         # Admin portal styling
│   │   ├── AdminProducts.css       # Product management styles
│   │   ├── AdminCategories.css     # Category management styles
│   │   ├── AdminOrders.css         # Order management styles
│   │   └── AdminUsers.css          # User management styles
│   ├── api.js                      # API configuration
│   ├── services.js                 # API service methods
│   ├── App.js                      # Main app component
│   ├── App.css                     # Main app styles
│   └── index.js                    # React entry point
└── public/
    └── index.html

```

## Features

### Customer Portal
- **Product Listing**: Browse all active products
- **Product Filtering**: Filter by category, price, size, gender, color
- **Product Search**: Search by name, description, material
- **Product Details**: View detailed product information and reviews
- **Shopping Cart**: Add/remove items from cart
- **Checkout**: Complete order with shipping and billing addresses
- **Order History**: Track all past orders
- **User Profile**: Manage profile information and addresses
- **Product Reviews**: Rate and review purchased products
- **Recommendations**: View popular and personalized product recommendations

### Admin Portal (Staff Only)
Access via `/admin` route when logged in as admin user

#### Product Management
- ✅ Create new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Toggle product status (active/inactive)
- ✅ View all products (including inactive)
- ✅ Bulk operations available

#### Category Management
- ✅ Create new categories
- ✅ Edit existing categories
- ✅ Delete categories
- ✅ View all categories

#### Order Management
- ✅ View all orders (not just own orders)
- ✅ Filter orders by status (pending, processing, shipped, delivered, cancelled)
- ✅ Update order status
- ✅ View order details with items breakdown
- ✅ Track shipping information

#### User Management
- ✅ View all registered users
- ✅ Search users by username or email
- ✅ View user account details and activity
- ✅ Grant/revoke admin access
- ✅ Manage user accounts

## API Endpoints Used

### Customer Endpoints
```
GET    /products/categories/              - List categories
GET    /products/products/                - List products (active only)
GET    /products/products/{id}/           - Get product detail
POST   /products/products/{id}/add_review - Add product review
GET    /carts/                            - Get user cart
POST   /carts/add_item/                   - Add item to cart
POST   /carts/remove_item/                - Remove item from cart
GET    /orders/                           - Get user orders
POST   /orders/create_from_cart/          - Create order from cart
GET    /accounts/users/me/                - Get current user profile
POST   /accounts/users/login/             - User login
POST   /accounts/users/register/          - User registration
```

### Admin Endpoints
```
GET    /products/products/                - List all products (including inactive)
POST   /products/products/                - Create product
PUT    /products/products/{id}/           - Update product
DELETE /products/products/{id}/           - Delete product

GET    /products/categories/              - List all categories
POST   /products/categories/              - Create category
PUT    /products/categories/{id}/         - Update category
DELETE /products/categories/{id}/         - Delete category

GET    /orders/                           - List all orders
PATCH  /orders/{id}/                      - Update order status

GET    /accounts/users/                   - List all users
PATCH  /accounts/users/{id}/              - Update user role
```

## User Roles

### Customer User
- Can view active products only
- Can create orders
- Can view only their own orders
- Can write reviews
- Cannot access admin panel

### Admin User
- Can view ALL products (active and inactive)
- Can manage products (CRUD)
- Can manage categories
- Can view and update ALL orders
- Can manage user accounts and roles
- Has full access to admin portal

## How to Use Admin Portal

### 1. Login as Admin
```
Username: admin
Password: (your admin password)
```

### 2. Navigate to Admin Portal
- After login, click "Admin Panel" button in navigation
- Or access directly at: `http://localhost:3000/admin`

### 3. Product Management
- **Add Product**: Click "+ Add New Product" button
- **Edit Product**: Click "Edit" button on product table
- **Delete Product**: Click "Delete" button (with confirmation)
- **Toggle Status**: Edit product and check/uncheck "Active" checkbox

### 4. Category Management
- **Add Category**: Click "+ Add New Category" button
- **Edit Category**: Click "Edit" button on category card
- **Delete Category**: Click "Delete" button

### 5. Order Tracking
- View all customer orders
- Filter by status using dropdown
- Click order to view details
- Update order status using status buttons

### 6. User Management
- Search users by username or email
- Click user to view details
- Grant admin access to users
- Remove admin access from users

## Environment Variables

Create `.env` file in frontend directory:
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ML_URL=http://localhost:8001
```

## Authentication

Token-based authentication is used:
- Login returns `auth_token` which is stored in localStorage
- Token is automatically added to all API requests
- Token is removed from localStorage on logout

## Styling

The frontend uses:
- **CSS3** with custom properties (CSS variables)
- **Gradient backgrounds** for modern look
- **Flexbox and CSS Grid** for responsive layouts
- **Smooth transitions** and animations
- **Mobile-first responsive design**

### Color Scheme
- Primary: `#667eea` to `#764ba2` (purple gradient)
- Success: `#4caf50` (green)
- Danger: `#f44336` (red)
- Warning: `#ff9800` (orange)
- Info: `#2196f3` (blue)

## Troubleshooting

### "Products not showing" or "Products are inactive"
**Solution**: Edit the product in admin panel and check the "Active" checkbox

### "Cannot access admin panel" 
**Solution**: Ensure your user account has `is_staff=true` in the backend

### "API endpoints not found (404)"
**Solution**: Check that the backend is running and routes are properly configured

### "Style not loading"
**Solution**: Clear browser cache and restart React dev server: `npm start`

## Future Enhancements
- [ ] Product images upload
- [ ] Advanced analytics dashboard
- [ ] Inventory management
- [ ] Discount codes and promotions
- [ ] Email notifications
- [ ] Payment gateway integration
- [ ] Two-factor authentication
- [ ] Audit logs for admin actions
