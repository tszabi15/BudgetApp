import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './AddTransactionForm.css';

function EditTransactionForm({ transaction, onUpdate, onCancel }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setCategory(transaction.category);
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const updatedData = {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(date).toISOString(),
    };

    try {
      const response = await apiClient.put(
        `/transactions/${transaction.id}`,
        updatedData
      );

      onUpdate(response.data.transaction);
      
    } catch (err) {
      setError("Failed to update transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Edit Transaction</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="edit-description">Description *</label>
            <input
              type="text" id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="edit-amount">Amount *</label>
            <input
              type="number" id="edit-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="edit-category">Category</label>
            <input
              type="text" id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="edit-date">Date</label>
            <input
              type="date" id="edit-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button type="submit" className="add-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}
export default EditTransactionForm;