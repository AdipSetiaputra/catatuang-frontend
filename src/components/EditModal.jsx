import { useState, useEffect } from 'react';
import api from '../lib/api';

const CATEGORIES = [
  'Makanan & Minuman',
  'Transport',
  'Tagihan',
  'Gaji',
  'Investasi',
  'Belanja Harian',
  'Pendapatan Usaha',
  'Lainnya',
];

export default function EditModal({ transaction, onSave, onClose }) {
  const [type, setType] = useState(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note || '');
  const [walletId, setWalletId] = useState(transaction.wallet_id);
  const [wallets, setWallets] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/wallets').then((res) => {
      setWallets(res.data.wallets);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(transaction.id, {
        type,
        amount: parseInt(amount, 10),
        category,
        note: note || null,
        wallet_id: walletId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Transaksi</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Type */}
          <div className="input-group">
            <label>Jenis</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${type === 'masuk' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setType('masuk')}
              >
                ↓ Masuk
              </button>
              <button
                type="button"
                className={`btn btn-sm ${type === 'keluar' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setType('keluar')}
              >
                ↑ Keluar
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="input-group">
            <label htmlFor="edit-amount">Nominal (Rp)</label>
            <input
              id="edit-amount"
              className="input-field"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="input-group">
            <label htmlFor="edit-category">Kategori</label>
            <select
              id="edit-category"
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Wallet */}
          <div className="input-group">
            <label htmlFor="edit-wallet">Dompet</label>
            <select
              id="edit-wallet"
              className="input-field"
              value={walletId}
              onChange={(e) => setWalletId(parseInt(e.target.value, 10))}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="input-group">
            <label htmlFor="edit-note">Catatan</label>
            <input
              id="edit-note"
              className="input-field"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan singkat"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={saving}
          >
            {saving ? <span className="spinner" /> : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
}
