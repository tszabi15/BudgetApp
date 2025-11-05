import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import AddTransactionForm from '../components/AddTransactionForm';
import Modal from '../components/Modal';
import EditTransactionForm from '../components/EditTransactionForm';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function DashboardPage() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/transactions');
        setTransactions(response.data.transactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to fetch transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await apiClient.delete(`/transactions/${id}`);
      
      setTransactions(
        transactions.filter(transaction => transaction.id !== id)
      );
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction.");
    }
  };

  const handleAddNewTransaction = (newTransaction) => {
    setTransactions((prevTransactions) => [
      newTransaction, 
      ...prevTransactions
    ]);
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
    setTransactions(transactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    ));
    handleCloseModal();
  };

  const formatCurrency = (amount) => {
      const currency = user?.currency || 'USD';

      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
      }).format(amount);
  };
  
  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Your Transactions</h2>
      
      <AddTransactionForm onNewTransaction={handleAddNewTransaction} />

      {transactions.length > 0 && <h3>Recent Transactions</h3>}

      <ul className="transactions-list">
        {transactions.length === 0 ? (
          <p>No transactions found. Add one to get started!</p>
        ) : (

          transactions.slice(0, 10).map(t => (
            <li key={t.id} className="transaction-item">
              <div className="transaction-details">
                <div className="transaction-description">{t.description}</div>
                <div className="transaction-category">{t.category}</div>
                <div className="transaction-date">
                  {new Date(t.date).toLocaleDateString()}
                </div>
              </div>
              <div 
                className={`transaction-amount ${
                  t.amount < 0 ? 'expense' : 'income'
                }`}
              >
                {formatCurrency(t.amount)}
              </div>
              <div className="transaction-actions">
                <button onClick={() => handleOpenEditModal(t)} className="edit-button">
                  Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className="delete-button">
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

export default DashboardPage;