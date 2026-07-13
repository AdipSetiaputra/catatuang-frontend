/**
 * Format integer amount to Indonesian Rupiah string.
 * e.g. 18000 -> "Rp18.000"
 */
export function formatRupiah(amount) {
  if (amount == null) return 'Rp0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}Rp${formatted}`;
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
    const d = new Date(tx.created_at);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const dateKey = d.toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

/**
 * Get wallet logo URL.
 */
export function getWalletLogo(walletName) {
  if (!walletName) return null;
  const name = walletName.toLowerCase();
  
  const logos = {
    'bca': '/logo_bca.png',
    'bri': '/logo_bri.png',
    'bsi': '/logo_bsi.png',
    'dana': '/logo_dana.png',
    'gopay': '/logo_gopay.png',
    'go-pay': '/logo_gopay.png',
    'kaspro': '/logo_kaspro.png',
    'mandiri': '/logo_mandiri.png',
    'ovo': '/logo_ovo.png',
    'shopeepay': '/logo_shopeepay.png',
    'shopee pay': '/logo_shopeepay.png'
  };

  for (const [key, path] of Object.entries(logos)) {
    if (name.includes(key)) return path;
  }
  return null;
}

/**
 * Get wallet brand accent color (background tint).
 */
export function getWalletColor(walletName) {
  if (!walletName) return null;
  const name = walletName.toLowerCase();

  const colors = {
    'bca':       { bg: 'rgba(0, 82, 148, 0.12)',  border: 'rgba(0, 82, 148, 0.25)',  text: '#005294' },
    'bri':       { bg: 'rgba(0, 102, 51, 0.12)',  border: 'rgba(0, 102, 51, 0.25)',  text: '#006633' },
    'bni':       { bg: 'rgba(255, 140, 0, 0.12)', border: 'rgba(255, 140, 0, 0.25)', text: '#cc7000' },
    'bsi':       { bg: 'rgba(2, 128, 144, 0.12)', border: 'rgba(2, 128, 144, 0.25)', text: '#028090' },
    'dana':      { bg: 'rgba(9, 123, 238, 0.12)', border: 'rgba(9, 123, 238, 0.25)', text: '#097bee' },
    'gopay':     { bg: 'rgba(0, 176, 79, 0.12)',  border: 'rgba(0, 176, 79, 0.25)',  text: '#00b04f' },
    'go-pay':    { bg: 'rgba(0, 176, 79, 0.12)',  border: 'rgba(0, 176, 79, 0.25)',  text: '#00b04f' },
    'kaspro':    { bg: 'rgba(255, 87, 34, 0.12)', border: 'rgba(255, 87, 34, 0.25)', text: '#ff5722' },
    'mandiri':   { bg: 'rgba(0, 93, 179, 0.12)',  border: 'rgba(0, 93, 179, 0.25)',  text: '#005db3' },
    'ovo':       { bg: 'rgba(98, 0, 234, 0.12)',  border: 'rgba(98, 0, 234, 0.25)',  text: '#6200ea' },
    'shopeepay': { bg: 'rgba(238, 77, 45, 0.12)', border: 'rgba(238, 77, 45, 0.25)', text: '#ee4d2d' },
    'shopee pay':{ bg: 'rgba(238, 77, 45, 0.12)', border: 'rgba(238, 77, 45, 0.25)', text: '#ee4d2d' },
    'cimb':      { bg: 'rgba(190, 0, 0, 0.12)',   border: 'rgba(190, 0, 0, 0.25)',   text: '#be0000' },
    'danamon':   { bg: 'rgba(255, 60, 0, 0.12)',  border: 'rgba(255, 60, 0, 0.25)',  text: '#ff3c00' },
    'permata':   { bg: 'rgba(0, 120, 60, 0.12)',  border: 'rgba(0, 120, 60, 0.25)',  text: '#00783c' },
  };

  for (const [key, color] of Object.entries(colors)) {
    if (name.includes(key)) return color;
  }
  return null;
}
