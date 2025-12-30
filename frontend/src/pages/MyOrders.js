import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrders();
      // Handle both paginated and direct array responses
      const data = response.data.results || response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      const response = await orderAPI.getOrderDetail(orderId);
      setSelectedOrder(response.data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await orderAPI.cancelOrder(orderId);
      alert('Order cancelled successfully');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert('Failed to cancel order');
      console.error(err);
    }
  };

  if (loading) return <p className="loading-text">Loading orders...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="orders-container">
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.order_number}</h3>
                <span className={`status-badge ${order.status}`}>
                  {order.status}
                </span>
                <span className={`payment-badge ${order.payment_status}`}>
                  Payment: {order.payment_status}
                </span>
              </div>

              <div className="order-info">
                <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Total:</strong> ${parseFloat(order.total_amount || 0).toFixed(2)}</p>
                <p><strong>Items:</strong> {order.items?.length || 0}</p>
              </div>

              <button 
                className="btn btn-secondary"
                onClick={() => fetchOrderDetail(order.id)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="order-detail-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>

            <h3>Order #{selectedOrder.order_number}</h3>

            <div className="order-detail-info">
              <div className="detail-section">
                <h4>Status</h4>
                <p><strong>Order Status:</strong> {selectedOrder.status}</p>
                <p><strong>Payment Status:</strong> {selectedOrder.payment_status}</p>
              </div>

              <div className="detail-section">
                <h4>Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${parseFloat(item.price || 0).toFixed(2)}</td>
                        <td>${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section">
                <h4>Addresses</h4>
                <div className="address-info">
                  <strong>Shipping:</strong>
                  <p>{selectedOrder.shipping_address}</p>
                </div>
                <div className="address-info">
                  <strong>Billing:</strong>
                  <p>{selectedOrder.billing_address}</p>
                </div>
              </div>

              <div className="order-total">
                <strong>Total: ${parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</strong>
              </div>

              {selectedOrder.status === 'pending' && (
                <button 
                  className="btn btn-danger"
                  onClick={() => handleCancel(selectedOrder.id)}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
