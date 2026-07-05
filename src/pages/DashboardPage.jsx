import { useState, useEffect } from 'react';
import api from '../lib/api';
import { formatRupiah, getCategoryIcon } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>Gagal memuat dashboard</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={fetchSummary}>
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Section: Total Balance */}
      <div style={{ padding: '20px 16px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Total Saldo
        </div>
        <div className="summary-value balance" style={{ fontSize: '2rem', marginTop: '4px' }}>
          {formatRupiah(data.total_balance)}
        </div>
      </div>

      {/* Wallets Removed */}

      {/* Today Summary */}
      <div style={{ padding: '8px 16px 4px' }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          📅 Hari Ini
        </h2>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Masuk</span>
          <span className="summary-value income">+{formatRupiah(data.today.total_masuk)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Keluar</span>
          <span className="summary-value expense">-{formatRupiah(data.today.total_keluar)}</span>
        </div>
        <div className="summary-card full-width">
          <span className="summary-label">Selisih Hari Ini</span>
          <span className={`summary-value ${data.today.net >= 0 ? 'income' : 'expense'}`}>
            {data.today.net >= 0 ? '+' : ''}{formatRupiah(data.today.net)}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {data.today.transaction_count} transaksi
          </span>
        </div>
      </div>

      {/* Top Categories Removed */}

      {/* 7-Day Chart */}
      {data.chart_7_days && data.chart_7_days.length > 0 && (
        <div style={{ padding: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              📈 Grafik 7 Hari Terakhir
            </h2>
            <div style={{ padding: '4px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              7 Hari
            </div>
          </div>

          <div style={{ width: '100%', height: 220, background: 'var(--bg-card)', borderRadius: '12px', padding: '16px 16px 0 0', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart_7_days} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}jt` : value >= 1000 ? `${value / 1000}k` : value} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) => [formatRupiah(value), '']}
                />
                <Area type="monotone" dataKey="masuk" name="Masuk" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMasuk)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="keluar" name="Keluar" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorKeluar)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }}></div>Masuk</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }}></div>Keluar</div>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          📆 Bulan Ini
        </h2>
      </div>

      <div className="summary-grid" style={{ paddingBottom: '24px' }}>
        <div className="summary-card">
          <span className="summary-label">Masuk</span>
          <span className="summary-value income" style={{ fontSize: '1.05rem' }}>
            +{formatRupiah(data.monthly.total_masuk)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Keluar</span>
          <span className="summary-value expense" style={{ fontSize: '1.05rem' }}>
            -{formatRupiah(data.monthly.total_keluar)}
          </span>
        </div>
      </div>

      {/* Copyright Footer */}
      <div style={{ textAlign: 'center', padding: '0 16px 24px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Montra.By Adip setia.
      </div>
    </div>
  );
}
