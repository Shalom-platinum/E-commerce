import React, { useState, useEffect } from 'react';
import { userAPI } from '../services';

export default function UserProfile({ user, setUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await userAPI.getAddresses();
      setAddresses(response.data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(formData);
      setUser(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await userAPI.deleteAddress(addressId);
      fetchAddresses();
      alert('Address deleted successfully');
    } catch (err) {
      alert('Failed to delete address');
      console.error(err);
    }
  };

  return (
    <div className="profile-container">
      <h2>My Profile</h2>

      <div className="profile-section">
        <div className="profile-header">
          <h3>Personal Information</h3>
          <button 
            className="btn btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {isEditing ? (
          <div className="profile-form">
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <button 
              className="btn btn-primary"
              onClick={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="profile-info">
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
            <p><strong>Member Since:</strong> {new Date(user?.date_joined).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      <div className="addresses-section">
        <h3>Saved Addresses</h3>

        {addresses.length > 0 ? (
          <div className="addresses-list">
            {addresses.map(addr => (
              <div key={addr.id} className="address-card">
                <div className="address-content">
                  <p><strong>{addr.street}</strong></p>
                  <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                  <p>{addr.country}</p>
                </div>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteAddress(addr.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No addresses saved.</p>
        )}
      </div>
    </div>
  );
}
