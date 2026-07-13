import { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatRupiah, formatDate, formatTime, getCategoryIcon, groupByDate, getWalletLogo, getWalletColor } from '../lib/utils';

const CATEGORIES = [
  'Semua',
  'Makanan & Minuman',
  'Transport',
  'Tagihan',
  'Gaji',
  'Investasi',
  'Belanja Harian',
  'Pendapatan Usaha',
  'Lainnya',
];

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Semua');
  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ total_masuk: 0, total_keluar: 0, net: 0 });

  useEffect(() => {
    api.get('/wallets').then((res) => setWallets(res.data.wallets));
  }, []);

  useEffect(() => {
    setPage(1);
    setTransactions([]);
    fetchTransactions(1);
  }, [category, walletId, startDate, endDate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchTransactions = async (pageNum) => {
    setLoading(true);
    try {
      const params = { page: pageNum };
      if (category !== 'Semua') params.category = category;
      if (walletId) params.wallet_id = walletId;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const res = await api.get('/transactions', { params });
      const newData = res.data.data || [];
      
      if (pageNum === 1) {
        setTransactions(newData);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        setTransactions((prev) => [...prev, ...newData]);
      }
      setHasMore(res.data.current_page < res.data.last_page);
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === 'week') {
      const today = new Date();
      const first = today.getDate() - today.getDay() + 1;
      const last = first + 6;
      const start = new Date(today.setDate(first));
      start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
      const end = new Date(today.setDate(last));
      end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (type === 'month') {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (type === 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  };

  const grouped = groupByDate(transactions);

  return (
    <div className="page">
      {/* Date Filter */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <select 
          value={filterType} 
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
        >
          <option value="all">Semua Waktu</option>
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini</option>
          <option value="custom">Pilih Tanggal</option>
        </select>

        {filterType === 'custom' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, background: 'var(--bg-success)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Masuk</div>
          <div style={{ fontWeight: 700, color: 'var(--text-success)', fontSize: '0.85rem' }}>+{formatRupiah(summary.total_masuk)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-danger)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Keluar</div>
          <div style={{ fontWeight: 700, color: 'var(--text-danger)', fontSize: '0.85rem' }}>-{formatRupiah(summary.total_keluar)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-card)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pendapatan</div>
          <div style={{ fontWeight: 700, color: summary.net >= 0 ? 'var(--text-success)' : 'var(--text-danger)', fontSize: '0.85rem' }}>
            {summary.net >= 0 ? '+' : ''}{formatRupiah(summary.net)}
          </div>
        </div>
      </div>

      {/* Category Filter Removed */}

      {/* Wallet Filter Removed */}

      {/* Transaction Groups */}
      {grouped.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Belum ada transaksi</p>
        </div>
      )}

      {grouped.map(([dateKey, txs]) => (
        <div key={dateKey} className="tx-group">
          <div className="tx-group-header">{formatDate(dateKey)}</div>
          {txs.map((tx) => (
            <div key={tx.id} className="tx-item">
              <div className={`tx-icon ${tx.type}`}>
                {getCategoryIcon(tx.category)}
              </div>
              <div className="tx-info">
                <div className="tx-note">{tx.note || tx.category}</div>
                <div className="tx-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {/* Wallet badge */}
                  {(() => {
                    const walletName = tx.wallet?.name || 'Cash';
                    const wLogo = getWalletLogo(walletName);
                    const wColor = getWalletColor(walletName);
                    return (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        padding: '1px 6px 1px 2px',
                        borderRadius: '20px',
                        background: wColor?.bg || 'var(--bg-card-hover)',
                        border: `1px solid ${wColor?.border || 'var(--border-color)'}`,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: wColor?.text || 'var(--text-muted)',
                      }}>
                        {wLogo ? (
                          <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                            <img src={wLogo} alt={walletName} style={{ height: '10px', objectFit: 'contain' }} />
                          </span>
                        ) : <span>💳</span>}
                        {walletName}
                      </span>
                    );
                  })()}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{formatTime(tx.created_at)}</span>
                  {tx.item && <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>· {tx.item}</span>}
                </div>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'masuk' ? '+' : '-'}{formatRupiah(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Load More */}
      {hasMore && !loading && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadMore}>
            Muat lebih banyak
          </button>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.text}</div>
      )}
    </div>
  );
}
