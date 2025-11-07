import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';
import Modal from '../components/Modal';
import EditTransactionForm from '../components/EditTransactionForm';
import './Dashboard.css';
import './Transactions.css';

function AdminPage() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [descSearchTerm, setDescSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/transactions/all');
        setAllTransactions(response.data.all_transactions);
      } catch (err) {
        console.error("Error fetching all transactions:", err);
        setError("Failed to fetch data. Are you an admin?");
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Admin: Are you sure you want to delete this transaction?")) {
      return;
    }
    try {
      await apiClient.delete(`/transactions/${id}`);
      setAllTransactions(allTransactions.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction.");
    }
  };

  const handleOpenEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleUpdateSuccess = (updatedTransaction) => {
    setAllTransactions(allTransactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    ));
    handleCloseModal();
  };

  const formatCurrency = (amount, currencyCode) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
    }).format(amount);
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const descMatch = t.description.toLowerCase().includes(descSearchTerm.toLowerCase());

      const userMatch = t.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        t.user_id.toString().includes(userSearchTerm);
                        
      return descMatch && userMatch;
    });
  }, [allTransactions, descSearchTerm, userSearchTerm]);

  if (loading) {
    return <div className="loading">Loading admin data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="transactions-page-container">
      <h2>Admin Panel - All Transactions</h2>
      
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="admin-desc-search">Search by Description</label>
          <input 
            type="text"
            id="admin-desc-search"
            placeholder="Search description..."
            value={descSearchTerm}
            onChange={(e) => setDescSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="admin-user-search">Search by User (ID or Name)</label>
          <input 
            type="text"
            id="admin-user-search"
            placeholder="Search user ID or name..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ul className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          filteredTransactions.map(t => (
            <li key={t.id} className="transaction-item">
              <div className="transaction-details">
                <div className="transaction-description">{t.description}</div>
                <div className="transaction-category">{t.category}</div>
                <div className="transaction-date">
                  {new Date(t.date).toLocaleDateString()}
                </div>
                <div className="transaction-user" style={{fontSize: '0.8rem', color: '#555', paddingTop: '4px'}}>
                  {t.username} (ID: {t.user_id})
                </div>
              </div>
              <div 
                className={`transaction-amount ${
                  t.amount < 0 ? 'expense' : 'income'
                }`}
              >
                {formatCurrency(t.amount, t.currency)}
              </div>
              <div className="transaction-actions">
                <button 
                  onClick={() => handleOpenEditModal(t)}
                  className="edit-button"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <Modal show={isModalOpen} onClose={handleCloseModal}>
        <EditTransactionForm
          transaction={editingTransaction}
          onUpdate={handleUpdateSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

export default AdminPage;