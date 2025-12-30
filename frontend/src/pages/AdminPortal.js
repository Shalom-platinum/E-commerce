import React, { useState } from 'react';
import AdminProducts from '../components/admin/AdminProducts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminOrders from '../components/admin/AdminOrders';
import AdminUsers from '../components/admin/AdminUsers';
import '../styles/AdminPortal.css';

export default function AdminPortal({ user }) {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="admin-portal">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-user">Welcome, {user?.username}</p>
      </div>

      <div className="admin-container">
        <nav className="admin-sidebar">
          <div className="admin-nav-title">Management</div>
          <button
            className={`admin-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            📂 Categories
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        </nav>

        <main className="admin-content">
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'users' && <AdminUsers />}
        </main>
      </div>
    </div>
  );
}
