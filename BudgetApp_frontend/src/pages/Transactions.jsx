import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import Modal from '../components/Modal';
import EditTransactionForm from '../components/EditTransactionForm';
import { useAuth } from '../context/AuthContext';
import './Transactions.css'; 
import './Dashboard.css';

function TransactionsPage() {
    const { user } = useAuth();

    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
        try {
            const response = await apiClient.get('/categories');
            setCategories(response.data.categories);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/transactions', {
            params: {
                search: searchTerm || null,
                category: selectedCategory || null,
            }
            });
            setTransactions(response.data.transactions);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError("Failed to fetch transactions.");
        } finally {
            setLoading(false);
        }
        };
        
        fetchTransactions();
    }, [searchTerm, selectedCategory]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
        await apiClient.delete(`/transactions/${id}`);
        setTransactions(transactions.filter(t => t.id !== id));
        } catch (err) {
        alert("Failed to delete.");
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

    return (
        <div className="transactions-page-container">
        <h2>Transactions</h2>

        <div className="filters-container">
            <div className="filter-group">
            <label htmlFor="search">Search by Name</label>
            <input 
                type="text"
                id="search"
                placeholder="e.g., Coffee, Salary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <div className="filter-group">
            <label htmlFor="category">Filter by Category</label>
            <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="">All Categories</option>
                {categories.map(category => (
                <option key={category} value={category}>{category}</option>
                ))}
            </select>
            </div>
        </div>

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}
        
        {!loading && !error && (
            <ul className="transactions-list">
            {transactions.length === 0 ? (
                <p>No transactions match your filters.</p>
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
                    <div className={`transaction-amount ${t.amount < 0 ? 'expense' : 'income'}`}>
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
        )}
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

export default TransactionsPage;