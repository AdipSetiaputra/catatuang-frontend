import { useState, useRef, useEffect } from 'react';
import api from '../lib/api';
import { formatRupiah, formatDate, formatTime, getCategoryIcon, getWalletLogo, getWalletColor } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { Camera, Image as ImageIcon, Send, PencilLine, Trash2, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

function useTypewriter(text, speed = 10, delay = 0) {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    let timeout;
    let i = 0;
    const type = () => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
        timeout = setTimeout(type, speed);
      }
    };
    timeout = setTimeout(type, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);
  return displayText;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Typewriter states for empty state
  const titleText = `Halo ${user?.name || ''}!`;
  const line1Text = "Kenalin, aku Asep AI. Cukup cerita, biar aku yang catat keuanganmu.";
  const line2Text = "Mulai catat keuanganmu!";

  const typedTitle = useTypewriter(titleText, 60, 300);
  const typedLine1 = useTypewriter(line1Text, 45, 300 + titleText.length * 60 + 300);
  const typedLine2 = useTypewriter(line2Text, 45, 300 + titleText.length * 60 + 300 + line1Text.length * 45 + 300);

  // Load today's transactions on mount
  useEffect(() => {
    loadToday();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadToday = async () => {
    try {
      const res = await api.get('/transactions/today');
      
      const visibleTxs = res.data.transactions
        .filter(tx => tx.source !== 'SISTEM_TRANSFER')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const groupedMessages = [];
      let lastRawInput = null;

      for (const tx of visibleTxs) {
        if (tx.raw_input && tx.raw_input !== lastRawInput) {
          groupedMessages.push({
            id: `user-${tx.id}`,
            type: 'user',
            text: tx.raw_input,
            time: tx.created_at,
          });
          lastRawInput = tx.raw_input;
        } else if (!tx.raw_input && tx.note !== lastRawInput) {
          groupedMessages.push({
            id: `user-${tx.id}`,
            type: 'user',
            text: tx.note,
            time: tx.created_at,
          });
          lastRawInput = tx.note;
        }

        groupedMessages.push({
          id: `ai-${tx.id}`,
          type: 'ai',
          transaction: tx,
          time: tx.created_at,
        });
      }

      setMessages(groupedMessages);
    } catch (e) {
      console.error('Failed to load today transactions', e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);

    // Add user bubble
    const userMsg = {
      id: `user-temp-${Date.now()}`,
      type: 'user',
      text,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add loading bubble
    const loadingMsg = {
      id: `loading-${Date.now()}`,
      type: 'loading',
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const res = await api.post('/transactions/parse', { text });

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== loadingMsg.id);

        if (res.data.is_recap) {
          return [
            ...filtered.map((m) =>
              m.id === userMsg.id ? { ...m, id: `user-recap-${Date.now()}` } : m
            ),
            {
              id: `ai-recap-${Date.now()}`,
              type: 'ai-recap',
              message: res.data.message,
              urls: res.data.recap_urls,
              transactions: res.data.transactions,
              time: new Date().toISOString(),
            },
          ];
        }

        if (res.data.is_greeting) {
          return [
            ...filtered.map((m) =>
              m.id === userMsg.id ? { ...m, id: `user-greeting-${Date.now()}` } : m
            ),
            {
              id: `ai-greeting-${Date.now()}`,
              type: 'ai-recap', // Reuse recap UI so it shows plain text
              message: res.data.message,
              urls: null,
              transactions: [],
              time: new Date().toISOString(),
            },
          ];
        }

        // Multi-transaction response (e.g. tagih tunai + ongkir)
        if (res.data.is_multi && res.data.transactions) {
          const txList = res.data.transactions.filter(tx => tx.source !== 'SISTEM_TRANSFER');
          const updatedFiltered = filtered.map((m) =>
            m.id === userMsg.id ? { ...m, id: `user-multi-${Date.now()}` } : m
          );
          const aiBubbles = txList.map((tx) => ({
            id: `ai-${tx.id}`,
            type: 'ai',
            transaction: tx,
            time: tx.created_at,
          }));
          return [...updatedFiltered, ...aiBubbles];
        }

        const tx = res.data.transaction;
        return [
          ...filtered.map((m) =>
            m.id === userMsg.id ? { ...m, id: `user-${tx.id}` } : m
          ),
          {
            id: `ai-${tx.id}`,
            type: 'ai',
            transaction: tx,
            time: tx.created_at,
          },
        ];
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Gagal memproses. Coba lagi.';
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== loadingMsg.id);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            type: 'error',
            text: errorMessage,
            time: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setSending(true);

    const imageUrl = URL.createObjectURL(file);

    // Add user bubble with receipt image
    const userMsg = {
      id: `user-temp-${Date.now()}`,
      type: 'user',
      text: imageUrl,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const loadingMsg = {
      id: `loading-${Date.now()}`,
      type: 'loading',
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await api.post('/transactions/parse-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const tx = res.data.transaction;

      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== loadingMsg.id);
        return [
          ...filtered.map((m) =>
            m.id === userMsg.id ? { ...m, id: `user-${tx.id}` } : m
          ),
          {
            id: `ai-${tx.id}`,
            type: 'ai',
            transaction: tx,
            time: tx.created_at,
            isReceipt: true,
          },
        ];
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Gagal membaca struk. Coba lagi.';
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== loadingMsg.id);
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            type: 'error',
            text: errorMessage,
            time: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (txId) => {
    try {
      await api.delete(`/transactions/${txId}`);
      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== `user-${txId}` && m.id !== `ai-${txId}`
        )
      );
      setToast({ type: 'success', text: 'Transaksi dihapus' });
    } catch (e) {
      setToast({ type: 'error', text: 'Gagal menghapus' });
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 'calc(57px + max(8px, env(safe-area-inset-bottom)))' }}>
      {/* Chat Messages */}
      <div className="chat-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', marginBottom: '16px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.img
                src="/bot.png"
                alt="Bot Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.35 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              />
            </div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', fontWeight: 600 }}>
              {typedTitle}
              <span className="cursor-blink" style={{ opacity: typedTitle.length === titleText.length ? 0 : 1 }}>|</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              <span dangerouslySetInnerHTML={{
                __html: typedLine1.replace('Asep AI', '<strong>Asep AI</strong>').replace('Cukup cerita', '<br/>Cukup cerita')
              }} />
              {typedTitle.length === titleText.length && typedLine1.length < line1Text.length && (
                <span className="cursor-blink">|</span>
              )}
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              {typedLine2}
              {typedLine1.length === line1Text.length && typedLine2.length < line2Text.length && (
                <span className="cursor-blink">|</span>
              )}
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.type === 'user') {
            const isImage = msg.text.startsWith('http') || msg.text.startsWith('/storage') || msg.text.startsWith('blob:') || msg.text.startsWith('data:image');

            return (
              <div key={msg.id} className="bubble-wrapper user">
                <div className="bubble user" style={{ padding: isImage ? '4px' : undefined }}>
                  {isImage ? (
                    <img src={msg.text} alt="Receipt" style={{ maxWidth: '200px', borderRadius: '12px', display: 'block' }} />
                  ) : (
                    msg.text
                  )}
                </div>
                <span className="bubble-time">{formatTime(msg.time)}</span>
              </div>
            );
          }

          if (msg.type === 'loading') {
            return (
              <div key={msg.id} className="bubble-wrapper ai">
                <div className="bubble ai">
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            );
          }

          if (msg.type === 'error') {
            return (
              <div key={msg.id} className="bubble-wrapper ai">
                <div className="bubble ai" style={{ borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} className="text-danger" />
                  <span style={{ color: 'var(--text-danger)' }}>{msg.text}</span>
                </div>
              </div>
            );
          }

          if (msg.type === 'ai-recap') {
            const handleDownload = async (url, ext) => {
              try {
                const toastId = Date.now();
                setToast({ type: 'info', text: `Menyiapkan file ${ext}...` });
                const res = await api.get(url, { responseType: 'blob' });
                const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', `rekap-transaksi.${ext}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                setToast({ type: 'success', text: `Berhasil mengunduh ${ext}` });
              } catch (e) {
                setToast({ type: 'error', text: `Gagal mengunduh ${ext}` });
              }
            };

            return (
              <div key={msg.id} className="bubble-wrapper ai">
                <div className="bubble ai">
                  <div style={{ marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', gap: '8px' }}>
                    <div style={{ borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <img src="/bot.png" alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.35)' }} />
                    </div>
                    <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.message}</span>
                  </div>

                  {msg.transactions && msg.transactions.length > 0 && (
                    <div style={{ margin: '12px 0', padding: '8px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Daftar Transaksi Hari Ini:</div>
                      {msg.transactions.map((t, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: idx < msg.transactions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--text-primary)' }}>{t.note || t.category}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {(() => {
                                const walletName = t.wallet?.name || 'Cash';
                                const wLogo = getWalletLogo(walletName);
                                const wColor = getWalletColor(walletName);
                                return wLogo ? (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                    padding: '1px 6px 1px 2px',
                                    borderRadius: '20px',
                                    background: wColor?.bg || 'rgba(0,0,0,0.06)',
                                    border: `1px solid ${wColor?.border || 'rgba(0,0,0,0.1)'}`,
                                  }}>
                                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                                      <img src={wLogo} alt={walletName} style={{ height: '10px', objectFit: 'contain' }} />
                                    </span>
                                    <span style={{ color: wColor?.text || 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem' }}>{walletName}</span>
                                  </span>
                                ) : '💳 ' + walletName;
                              })()}
                            </span>
                          </div>
                          <span style={{ fontWeight: 500, color: t.type === 'masuk' ? '#10b981' : '#ef4444' }}>
                            {t.type === 'masuk' ? '+' : '-'}{formatRupiah(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.urls && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleDownload('/export/pdf', 'pdf')} className="bubble-action-btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', textDecoration: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#ef4444" />
                          <path d="M14 2V8H20" fill="#b91c1c" />
                          <text x="12" y="16" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">PDF</text>
                        </svg>
                        PDF
                      </button>
                      <button onClick={() => handleDownload('/export/word', 'docx')} className="bubble-action-btn" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', textDecoration: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#3b82f6" />
                          <path d="M14 2V8H20" fill="#2563eb" />
                          <text x="12" y="16" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">DOC</text>
                        </svg>
                        Word
                      </button>
                      <button onClick={() => handleDownload('/export/excel', 'xlsx')} className="bubble-action-btn" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', textDecoration: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#10b981" />
                          <path d="M14 2V8H20" fill="#059669" />
                          <text x="12" y="16" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">XLS</text>
                        </svg>
                        Excel
                      </button>
                    </div>
                  )}
                </div>
                <span className="bubble-time">{formatTime(msg.time)}</span>
              </div>
            );
          }

          if (msg.type === 'ai') {
            const tx = msg.transaction;
            return (
              <div key={msg.id} className="bubble-wrapper ai">
                <div className="bubble ai">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <img src="/bot.png" alt="bot" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.35)' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {tx.is_receipt ? 'Struk dicatat' : 'Dicatat'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    {tx.category && tx.category !== 'Lainnya' && (
                      <span className="category-badge">
                        {getCategoryIcon(tx.category)} {tx.category}
                      </span>
                    )}
                    <span
                      className={`tx-amount ${tx.type}`}
                      style={{ fontSize: '1rem' }}
                    >
                      {tx.type === 'masuk' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {tx.note}
                  </div>

                  {/* Optional fields */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {tx.wallet && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px 2px 3px', borderRadius: '20px',
                        background: (() => { const c = getWalletColor(tx.wallet.name); return c?.bg || 'rgba(0,0,0,0.06)'; })(),
                        border: (() => { const c = getWalletColor(tx.wallet.name); return `1px solid ${c?.border || 'rgba(0,0,0,0.1)'}`; })(),
                      }}>
                        {(() => {
                          const wLogo = getWalletLogo(tx.wallet.name);
                          const wColor = getWalletColor(tx.wallet.name);
                          return wLogo ? (
                            <>
                              <span style={{ width: '16px', height: '16px', borderRadius: '5px', background: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                                <img src={wLogo} alt={tx.wallet.name} style={{ height: '12px', objectFit: 'contain' }} />
                              </span>
                              <span style={{ color: wColor?.text || 'var(--text-muted)', fontWeight: 600 }}>{tx.wallet.name}</span>
                            </>
                          ) : <><span>💳</span><span>{tx.wallet.name}</span></>;
                        })()}
                      </span>
                    )}
                    {tx.item && <span>📦 {tx.item}</span>}
                    {tx.platform && tx.platform.toLowerCase() !== tx.wallet?.name?.toLowerCase() && <span>📱 {tx.platform}</span>}
                    {tx.source && <span>📥 {tx.source}</span>}
                    {tx.store && <span>🏪 {tx.store}</span>}
                  </div>

                  {/* Receipt items */}
                  {tx.receipt_items && tx.receipt_items.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                        Rincian struk ({tx.receipt_items.length} item):
                      </div>
                      {tx.receipt_items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: 'var(--text-muted)' }}>
                          <span>{item.item_name} x{item.qty}</span>
                          <span>{formatRupiah(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bubble-actions">
                    <button
                      className="bubble-action-btn"
                      onClick={() => handleDelete(tx.id)}
                      style={{ color: 'var(--text-danger)' }}
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
                <span className="bubble-time">{formatTime(msg.time)}</span>
              </div>
            );
          }

          return null;
        })}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        {/* Gallery Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        {/* Camera Input */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />

        <button
          className="chat-btn chat-upload-btn"
          onClick={() => cameraInputRef.current?.click()}
          disabled={sending}
          title="Ambil Foto"
        >
          <Camera size={20} strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }} />
        </button>

        <button
          className="chat-btn chat-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Pilih dari Galeri"
        >
          <ImageIcon size={20} strokeWidth={2.5} style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }} />
        </button>

        <input
          id="chat-input"
          className="chat-input"
          type="text"
          placeholder="Ketik transaksi..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          autoComplete="off"
        />

        <button
          id="chat-send"
          className="chat-btn chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          <Send size={18} strokeWidth={2.5} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
