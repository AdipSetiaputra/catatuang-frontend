/**
 * Format integer amount to Indonesian Rupiah string.
 * e.g. 18000 -> "Rp18.000"
 */
export function formatRupiah(amount) {
  if (amount == null) return 'Rp0';
  const abs = Math.abs(amount);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formatted}`;
}

/**
 * Format date to Indonesian locale string.
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format time from datetime string.
 */
export function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format short date (e.g., "1 Jul")
 */
export function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Check if two dates are the same day.
 */
export function isSameDay(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date is today.
 */
export function isToday(dateStr) {
  return isSameDay(dateStr, new Date());
}

/**
 * Get category emoji icon.
 */
export function getCategoryIcon(category) {
  const icons = {
    'Makanan & Minuman': '🍔',
    'Transport': '🚗',
    'Tagihan': '📄',
    'Gaji': '💰',
    'Investasi': '📈',
    'Belanja Harian': '🛒',
    'Pendapatan Usaha': '💼',
    'Lainnya': '📌',
  };
  return icons[category] || '📌';
}

/**
 * Group transactions by date.
 */
export function groupByDate(transactions) {
  const groups = {};
  for (const tx of transactions) {
    const dateKey = new Date(tx.created_at).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}
