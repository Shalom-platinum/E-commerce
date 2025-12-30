import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services';
import '../../styles/AdminCategories.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCategories();
      const data = response.data.results || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await productAPI.updateCategory(editingCategory.id, formData);
      } else {
        await productAPI.createCategory(formData);
      }
      fetchCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error('Failed to save category:', err);
      alert('Error saving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await productAPI.deleteCategory(categoryId);
        fetchCategories();
      } catch (err) {
        console.error('Failed to delete category:', err);
        alert('Error deleting category');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  return (
    <div className="admin-categories">
      <div className="admin-header-section">
        <h2>Category Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add New Category
        </button>
      </div>

      {showForm && (
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-category-form">
            <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            
            <div className="form-group">
              <label>Category Name *</label>
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
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading categories...</p>
      ) : (
        <div className="categories-grid">
          {categories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              <div className="category-actions">
                <button 
                  className="btn btn-sm btn-info"
                  onClick={() => handleEdit(category)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(category.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
