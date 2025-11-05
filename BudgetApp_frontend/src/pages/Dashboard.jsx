import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './Dashboard.css';

function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  
  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Your Transactions</h2>
      
      <ul className="transactions-list">
        {transactions.length === 0 ? (
          <p>No transactions found. Add one to get started!</p>
        ) : (
          transactions.map(t => (
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
                {t.amount.toFixed(2)}
              </div>
              <div className="transaction-actions">
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
    </div>
  );
}

export default DashboardPage;