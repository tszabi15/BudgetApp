import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import './SummaryStats.css';

const MONTHS = [
  { value: 1, name: 'January' }, { value: 2, name: 'February' },
  { value: 3, name: 'March' }, { value: 4, name: 'April' },
  { value: 5, name: 'May' }, { value: 6, name: 'June' },
  { value: 7, name: 'July' }, { value: 8, name: 'August' },
  { value: 9, name: 'September' }, { value: 10, name: 'October' },
  { value: 11, name: 'November' }, { value: 12, name: 'December' },
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

function SummaryStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const yearOptions = getYearOptions();
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/stats', {
          params: { month, year }
        });
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [month, year]);

  const formatCurrency = (amount) => {
    const currency = user?.currency || 'USD';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="stats-container">
      <div className="stats-filters">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.name}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="stat-card income">
        <h4>Total Income</h4>
        <div className="amount">{formatCurrency(stats.total_income)}</div>
      </div>
      <div className="stat-card expense">
        <h4>Total Expenses</h4>
        <div className="amount">{formatCurrency(stats.total_expense)}</div>
      </div>
      <div className="stat-card net">
        <h4>Net Balance</h4>
        <div className="amount">{formatCurrency(stats.net_balance)}</div>
      </div>
    </div>
  );
}

export default SummaryStats;