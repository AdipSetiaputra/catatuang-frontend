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

  useEffect(() => {
    api.get('/wallets').then((res) => setWallets(res.data.wallets));
  }, []);

  useEffect(() => {
    setPage(1);
    setTransactions([]);
    fetchTransactions(1);
  }, [category, walletId]);

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

      const res = await api.get('/transactions', { params });
      const newData = res.data.data || [];
      
      if (pageNum === 1) {
        setTransactions(newData);
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

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  };

  const grouped = groupByDate(transactions);

  // Calculate monthly summary from loaded transactions
  const totalMasuk = transactions
    .filter((t) => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalKeluar = transactions
    .filter((t) => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="page">
      {/* Monthly Summary */}
      <div style={{ padding: '16px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, background: 'var(--bg-success)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15), 0 1px 2px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Masuk</div>
          <div style={{ fontWeight: 700, color: 'var(--text-success)', fontSize: '0.95rem' }}>+{formatRupiah(totalMasuk)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-danger)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15), 0 1px 2px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Keluar</div>
          <div style={{ fontWeight: 700, color: 'var(--text-danger)', fontSize: '0.95rem' }}>-{formatRupiah(totalKeluar)}</div>
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
