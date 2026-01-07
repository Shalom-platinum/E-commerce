import React, { useState, useEffect } from 'react';
import { cartAPI, orderAPI, userAPI } from '../services';

export default function Cart({ setCartItems }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedBilling, setSelectedBilling] = useState('');
  const [newAddress, setNewAddress] = useState({
    label: 'home',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
      setCartItems(response.data.items?.length || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load cart, Please try to Sign In/Up if you haven\'t already.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await userAPI.getAddresses();
      // Handle both paginated and direct array responses
      const data = response.data.results || response.data;
      const addressList = Array.isArray(data) ? data : [];
      setAddresses(addressList);
      if (addressList.length > 0) {
        setSelectedShipping(addressList[0].id);
        setSelectedBilling(addressList[0].id);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await cartAPI.removeFromCart(productId);
      fetchCart();
    } catch (err) {
      setError('Failed to remove item');
      console.error(err);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.street_address || !newAddress.city) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await userAPI.createAddress(newAddress);
      setAddresses([...addresses, response.data]);
      setNewAddress({ label: 'home', street_address: '', city: '', state: '', postal_code: '', country: '' });
      setShowAddressForm(false);
      setSelectedShipping(response.data.id);
      setSelectedBilling(response.data.id);
    } catch (err) {
      setError('Failed to add address');
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (!selectedShipping || !selectedBilling) {
      setError('Please select shipping and billing addresses');
      return;
    }

    try {
      const shippingAddress = addresses.find(a => a.id == selectedShipping);
      const billingAddress = addresses.find(a => a.id == selectedBilling);

      await orderAPI.createOrderFromCart(
        `${shippingAddress.street_address}, ${shippingAddress.city}, ${shippingAddress.state}`,
        `${billingAddress.street_address}, ${billingAddress.city}, ${billingAddress.state}`
      );

      alert('Order created successfully!');
      setCart({ items: [] });
      setCartItems(0);
    } catch (err) {
      setError('Failed to create order. Please try again.');
      console.error(err);
    }
  };

  if (loading) return <p className="loading-text">Loading cart...</p>;
  if (error) return <p className="error-text">{error}</p>;

  const totalPrice = cart?.items?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0;

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>

      {!cart?.items || cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <p>Continue shopping to add items to your cart</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  {item.product.image && <img src={item.product.image} alt={item.product.name} />}
                </div>
                <div className="item-details">
                  <h4>{item.product.name}</h4>
                  <p>Price: ${item.product.price}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Subtotal: ${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleRemoveItem(item.product.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>${totalPrice.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <strong>$10.00</strong>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <strong>${(totalPrice + 10).toFixed(2)}</strong>
            </div>
          </div>

          <div className="checkout-section">
            <h3>Shipping & Billing Address</h3>

            {addresses.length === 0 ? (
              <p className="warning-text">No addresses on file. Please add one to continue.</p>
            ) : (
              <>
                <div className="address-selection">
                  <div className="form-group">
                    <label>Shipping Address:</label>
                    <select value={selectedShipping} onChange={(e) => setSelectedShipping(e.target.value)}>
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.street_address}, {addr.city}, {addr.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Billing Address:</label>
                    <select value={selectedBilling} onChange={(e) => setSelectedBilling(e.target.value)}>
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr.street_address}, {addr.city}, {addr.state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button 
              className="btn btn-secondary"
              onClick={() => setShowAddressForm(!showAddressForm)}
            >
              {showAddressForm ? 'Cancel' : 'Add New Address'}
            </button>

            {showAddressForm && (
              <div className="address-form">
                <h4>Add New Address</h4>
                  <div className="form-group">
                    <label>Address Label:</label>
                    <select value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}>
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Street Address"
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                  />
                <input 
                  type="text" 
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="Postal Code"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="Country"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                />
                <button className="btn btn-primary" onClick={handleAddAddress}>Save Address</button>
              </div>
            )}

            <button 
              className="btn btn-primary btn-large"
              onClick={handleCheckout}
              disabled={!selectedShipping || !selectedBilling}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
