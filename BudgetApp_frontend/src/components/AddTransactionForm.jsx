import { useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import './AddTransactionForm.css';

function AddTransactionForm({ onNewTransaction }) {
    const { user } = useAuth();

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const transactionData = {
        description,
        amount: parseFloat(amount),
        category: category || 'Other',
    };

    if (date) {
        transactionData.date = new Date(date).toISOString();
    }

    try {
        const response = await apiClient.post('/transactions', transactionData);
        
        onNewTransaction(response.data.transaction);

        setDescription('');
        setAmount('');
        setCategory('');
        setDate('');

    } catch (err) {
        console.error("Error adding transaction:", err);
        setError("Failed to add transaction. Please check your inputs.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Add New Transaction</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="description">Description *</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="amount">Amount ({user?.currency || 'USD'})</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., -50 (expense) or 500 (income)"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Food, Salary"
            />
          </div>
          <div className="form-field">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="add-button" disabled={loading}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}

export default AddTransactionForm;