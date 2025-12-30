import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services';
import '../../styles/AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAdminUsers();
      const data = response.data.results || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAdmin = async (userId, isStaff) => {
    try {
      await userAPI.updateUserRole(userId, { is_staff: !isStaff });
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_staff: !isStaff });
      }
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Error updating user role');
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-header-section">
        <h2>User Management</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading users...</p>
      ) : (
        <div className="users-container">
          <div className="users-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="user-header">
                    <h4>{user.username}</h4>
                    <span className={`role-badge ${user.is_staff ? 'admin' : 'customer'}`}>
                      {user.is_staff ? 'Admin' : 'Customer'}
                    </span>
                  </div>
                  <div className="user-info">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                    <p><strong>Joined:</strong> {new Date(user.date_joined).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-users">No users found</p>
            )}
          </div>

          {selectedUser && (
            <div className="user-detail-panel">
              <h3>User Details</h3>
              
              <div className="detail-section">
                <h4>Account Information</h4>
                <div className="detail-row">
                  <label>Username:</label>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <label>First Name:</label>
                  <span>{selectedUser.first_name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Last Name:</label>
                  <span>{selectedUser.last_name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Joined:</label>
                  <span>{new Date(selectedUser.date_joined).toLocaleString()}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Account Status</h4>
                <div className="detail-row">
                  <label>Active:</label>
                  <span className={selectedUser.is_active ? 'active' : 'inactive'}>
                    {selectedUser.is_active ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Role:</label>
                  <span className={selectedUser.is_staff ? 'admin' : 'customer'}>
                    {selectedUser.is_staff ? 'Administrator' : 'Customer'}
                  </span>
                </div>
              </div>

              <div className="detail-actions">
                <button 
                  className={`btn ${selectedUser.is_staff ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleAdmin(selectedUser.id, selectedUser.is_staff)}
                >
                  {selectedUser.is_staff ? 'Remove Admin Access' : 'Grant Admin Access'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
