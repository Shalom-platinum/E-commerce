import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'dashboard') {
        const response = await adminAPI.getDashboardStats();
        setStats(response.data);
      } else if (activeTab === 'pending') {
        const response = await adminAPI.getPendingOrders(page);
        setPendingOrders(response.data);
      } else if (activeTab === 'analytics') {
        const response = await adminAPI.getPaymentAnalytics();
        setAnalytics(response.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await adminAPI.getOrderDetails(orderId);
      setOrderDetails(response.data);
      setSelectedOrder(orderId);
    } catch (err) {
      setError('Failed to fetch order details');
      console.error(err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      await adminAPI.updatePaymentStatus(orderId, newStatus);
      alert(`Order marked as ${newStatus}!`);
      setSelectedOrder(null);
      setOrderDetails(null);
      fetchData();
    } catch (err) {
      setError('Failed to update payment status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setPage(1); }}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => { setActiveTab('pending'); setPage(1); }}
        >
          ⏳ Pending Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => { setActiveTab('analytics'); setPage(1); }}
        >
          📈 Payment Analytics
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="loading-text">Loading data...</p>}

      {!loading && activeTab === 'dashboard' && stats && (
        <div className="dashboard-stats">
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending_count}</div>
            <div className="stat-label">Pending Orders</div>
            <div className="stat-amount">${stats.pending_amount?.toFixed(2) || '0.00'}</div>
          </div>

          <div className="stat-card paid">
            <div className="stat-number">{stats.paid_count}</div>
            <div className="stat-label">Paid Orders</div>
            <div className="stat-amount">${stats.paid_amount?.toFixed(2) || '0.00'}</div>
          </div>

          <div className="stat-card failed">
            <div className="stat-number">{stats.failed_count}</div>
            <div className="stat-label">Failed Orders</div>
            <div className="stat-amount">${stats.failed_amount?.toFixed(2) || '0.00'}</div>
          </div>

          {stats.payment_status_changes && (
            <div className="stat-card changes">
              <div className="stat-number">{stats.payment_status_changes.total_changes || 0}</div>
              <div className="stat-label">Status Changes (30 days)</div>
              <div className="stat-breakdown">
                <small>✅ {stats.payment_status_changes.confirmed || 0} confirmed</small>
                <small>❌ {stats.payment_status_changes.failed || 0} failed</small>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'pending' && (
        <div className="pending-orders-section">
          <h2>Pending Payment Orders</h2>
          
          {Array.isArray(pendingOrders) && pendingOrders.length > 0 ? (
            <>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Total</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.order_number}</td>
                        <td>{order.user}</td>
                        <td>{order.email}</td>
                        <td>${order.total_amount?.toFixed(2)}</td>
                        <td>{order.items_count}</td>
                        <td>
                          <span className={`status-badge ${order.payment_status}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-small"
                            onClick={() => fetchOrderDetails(order.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button 
                  className="btn btn-small"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button 
                  className="btn btn-small"
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No pending orders found.</p>
          )}

          {selectedOrder && orderDetails && (
            <div className="order-detail-modal">
              <div className="modal-content">
                <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
                
                <h3>Order #{orderDetails.order_number}</h3>

                <div className="order-info">
                  <div className="info-section">
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> {orderDetails.user}</p>
                    <p><strong>Email:</strong> {orderDetails.email}</p>
                    <p><strong>Phone:</strong> {orderDetails.phone || 'N/A'}</p>
                  </div>

                  <div className="info-section">
                    <h4>Order Details</h4>
                    <p><strong>Total:</strong> ${orderDetails.total_amount?.toFixed(2)}</p>
                    <p><strong>Status:</strong> {orderDetails.status}</p>
                    <p><strong>Payment Status:</strong> {orderDetails.payment_status}</p>
                    <p><strong>Created:</strong> {new Date(orderDetails.created_at).toLocaleString()}</p>
                  </div>

                  <div className="info-section">
                    <h4>Shipping Address</h4>
                    <p>{orderDetails.shipping_address}</p>
                  </div>

                  <div className="info-section">
                    <h4>Items</h4>
                    <ul>
                      {orderDetails.items?.map(item => (
                        <li key={item.id}>
                          {item.product_name} x{item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {orderDetails.payment_events && orderDetails.payment_events.length > 0 && (
                    <div className="info-section">
                      <h4>Payment History</h4>
                      <div className="payment-history">
                        {orderDetails.payment_events.map((event, idx) => (
                          <div key={idx} className="payment-event">
                            <span className={`event-type ${event.interaction_type}`}>
                              {event.interaction_type === 'payment_confirmed' ? '✅' : '❌'}
                              {event.interaction_type}
                            </span>
                            <span className="event-date">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="payment-actions">
                  <h4>Update Payment Status</h4>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleUpdatePaymentStatus(orderDetails.id, 'paid')}
                      disabled={updating || orderDetails.payment_status === 'paid'}
                    >
                      ✅ Mark as Paid
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleUpdatePaymentStatus(orderDetails.id, 'failed')}
                      disabled={updating || orderDetails.payment_status === 'failed'}
                    >
                      ❌ Mark as Failed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'analytics' && analytics && (
        <div className="analytics-section">
          <h2>Payment Analytics</h2>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Payment Status Distribution</h4>
              <div className="status-distribution">
                <div className="status-item">
                  <strong>Confirmed:</strong> {analytics.status_distribution?.confirmed || 0}
                </div>
                <div className="status-item">
                  <strong>Failed:</strong> {analytics.status_distribution?.failed || 0}
                </div>
                <div className="status-item">
                  <strong>Pending:</strong> {analytics.status_distribution?.pending || 0}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h4>Success Rate</h4>
              <div className="success-rate">
                <div className="rate-number">
                  {analytics.success_rate?.toFixed(2) || '0'}%
                </div>
                <p>of payment confirmations</p>
              </div>
            </div>

            {analytics.daily_payment_data && (
              <div className="analytics-card">
                <h4>Daily Payment Activity</h4>
                <div className="daily-data">
                  {Object.entries(analytics.daily_payment_data).slice(-7).map(([date, count]) => (
                    <div key={date} className="daily-item">
                      <span>{new Date(date).toLocaleDateString()}</span>
                      <span className="count">{count} events</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
