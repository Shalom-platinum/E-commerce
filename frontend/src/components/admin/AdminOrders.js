import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services';
import '../../styles/AdminOrders.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAdminOrders();
      const data = response.data.results || response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Error updating order status');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#ff9800',
      processing: '#2196f3',
      shipped: '#00bcd4',
      delivered: '#4caf50',
      cancelled: '#f44336',
    };
    return statusColors[status] || '#999';
  };

  return (
    <div className="admin-orders">
      <div className="admin-header-section">
        <h2>Order Management</h2>
        <div className="status-filter">
          <label>Filter by Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading orders...</p>
      ) : (
        <div className="orders-container">
          <div className="orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className={`order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-header">
                    <h4>Order #{order.id}</h4>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-details">
                    <p><strong>Customer:</strong> {order.user?.username}</p>
                    <p><strong>Total:</strong> ${order.total_amount}</p>
                    <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-orders">No orders found</p>
            )}
          </div>

          {selectedOrder && (
            <div className="order-detail-panel">
              <h3>Order Details</h3>
              <div className="detail-section">
                <h4>Order Information</h4>
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                <p><strong>Customer:</strong> {selectedOrder.user?.username}</p>
                <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>

              <div className="detail-section">
                <h4>Items</h4>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product?.name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section">
                <h4>Shipping Address</h4>
                <p>
                  {selectedOrder.shipping_address?.street}<br/>
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.zip}<br/>
                  {selectedOrder.shipping_address?.country}
                </p>
              </div>

              <div className="detail-section">
                <h4>Total Amount</h4>
                <p className="total-amount">${selectedOrder.total_amount}</p>
              </div>

              <div className="detail-section">
                <h4>Update Status</h4>
                <div className="status-buttons">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                    <button
                      key={status}
                      className={`status-btn ${selectedOrder.status === status ? 'active' : ''}`}
                      onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                      style={selectedOrder.status === status ? { backgroundColor: getStatusColor(status) } : {}}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
