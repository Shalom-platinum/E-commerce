import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services';
import '../../styles/AdminProducts.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    category_id: '',
    gender: 'U',
    size: '',
    color: '',
    material: '',
    stock: '',
    sku: '',
    image: null,
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Get all products (admin can see inactive ones)
      const response = await productAPI.getProducts();
      const data = response.data.results || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      const data = response.data.results || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use FormData to handle file uploads
      const data = new FormData();
      
      // Add all fields to FormData
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('cost_price', formData.cost_price || 0);
      data.append('category_id', formData.category_id);
      data.append('gender', formData.gender);
      data.append('size', formData.size || '');
      data.append('color', formData.color || '');
      data.append('material', formData.material || '');
      data.append('stock', formData.stock || 0);
      data.append('sku', formData.sku);
      data.append('is_active', formData.is_active);
      
      // Only append image if it's a file (not when editing with existing image)
      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }
      
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id, data);
      } else {
        await productAPI.createProduct(data);
      }
      fetchProducts();
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        cost_price: '',
        category_id: '',
        gender: 'U',
        size: '',
        color: '',
        material: '',
        stock: '',
        sku: '',
        image: null,
        is_active: true,
      });
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(productId);
        fetchProducts();
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      gender: 'unisex',
      size: 'M',
      color: 'black',
      material: '',
      stock: '',
      is_active: true,
    });
  };

  return (
    <div className="admin-products">
      <div className="admin-header-section">
        <h2>Product Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add New Product
        </button>
      </div>

      {showForm && (
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-product-form" encType="multipart/form-data">
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="U">Unisex</option>
                  <option value="M">Men</option>
                  <option value="W">Women</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Size</label>
                <select name="size" value={formData.size} onChange={handleInputChange}>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="e.g., PROD-001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Cost Price</label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Product Image *</label>
              <input
                type="file"
                name="image"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                accept="image/*"
                required={!editingProduct}
              />
              {editingProduct && formData.image && typeof formData.image === 'string' && (
                <p className="form-hint">Current image: {formData.image}</p>
              )}
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <label htmlFor="is_active">Active (Visible to customers)</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading products...</p>
      ) : (
        <div className="products-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category?.name || 'N/A'}</td>
                  <td>${product.price}</td>
                  <td>{product.stock || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button 
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
