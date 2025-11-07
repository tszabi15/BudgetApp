import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Modal from '../components/Modal';

import './UserManagement.css';
import '../components/AddTransactionForm.css'; 

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, rolesResponse] = await Promise.all([
          apiClient.get('/admin/users'),
          apiClient.get('/roles')
        ]);
        setUsers(usersResponse.data.users);
        setRoles(rolesResponse.data.roles);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also delete all their transactions.")) {
      return;
    }
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleUpdateSuccess = (updatedUser) => {
    setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    handleCloseModal();
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="transactions-page-container">
      <h2>User Management</h2>

      <ul className="user-list">
        {users.map(user => (
          <li key={user.id} className="user-card">
            
            <div className="user-card-info">
              <h3>{user.username}</h3>
              <div className="email">{user.email}</div>
              <div className="user-card-details">
                <span className={`role ${user.role}`}>{user.role}</span>
                <span>•</span>
                <span>Currency: {user.currency}</span>
                <span>•</span>
                <span>ID: {user.id}</span>
              </div>
            </div>

            <div className="user-card-actions">
              <button 
                onClick={() => handleOpenEditModal(user)}
                className="edit-button"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(user.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
            
          </li>
        ))}
      </ul>

      <Modal show={isModalOpen} onClose={handleCloseModal}>
        <EditUserForm
          user={editingUser}
          availableRoles={roles}
          onUpdate={handleUpdateSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

function EditUserForm({ user, availableRoles, onUpdate, onCancel }) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    role: user.role,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.put(`/admin/users/${user.id}`, formData);
      
      onUpdate({ ...user, ...formData });

    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Edit User: {user.username}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            {availableRoles.map(roleName => (
              <option key={roleName} value={roleName}>
                {roleName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="add-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserManagementPage;