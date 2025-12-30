import React from 'react';

export default function Checkout({ setCurrentPage }) {
  return (
    <div className="checkout-container">
      <h2>Order Confirmation</h2>
      <div className="success-message">
        <div className="success-icon">✅</div>
        <h3>Order Placed Successfully!</h3>
        <p>Your order has been created and is pending payment confirmation.</p>
        <p>An admin will review your payment status shortly.</p>
        
        <div className="next-steps">
          <h4>What's Next?</h4>
          <ol>
            <li>An admin will verify your payment details</li>
            <li>Your order status will change to "processing" once payment is confirmed</li>
            <li>You can track your order status in "My Orders"</li>
            <li>You'll receive email notifications for order updates</li>
          </ol>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setCurrentPage('orders')}
        >
          View My Orders
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setCurrentPage('home')}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
