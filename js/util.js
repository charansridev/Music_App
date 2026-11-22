// Icons + helpers
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  library: '<path d="M4 4v16"/><path d="M9 4v16"/><path d="m13 5 5.5 15"/><rect x="2.5" y="3" width="0" height="0"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.5-9C1.2 8 3 5 6.2 5c2 0 3.4 1 4.3 2.6h3C14.4 6 15.8 5 17.8 5 21 5 22.8 8 21.5 11c-2 4.4-9.5 9-9.5 9z" transform="scale(.92) translate(1 0)"/>',
  playlist: '<path d="M4 6h11M4 11h11M4 16h7"/><path d="M17 16a3 3 0 1 0 3-3v-5l-4 1.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7"/><circle cx="12" cy="16.8" r=".4"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5 6.3 6.3M17.7 17.7l1.8 1.8M19.5 4.5 17.7 6.3M6.3 17.7 4.5 19.5"/>',
  queue: '<path d="M4 6h16M4 12h10"/><path d="M18 12v6M15.5 15.5 18 18l2.5-2.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  prev: '<path d="M17.5 5.5v13L8 12z" fill="currentColor" stroke="none"/><rect x="5.5" y="5.5" width="2.2" height="13" rx="1" fill="currentColor" stroke="none"/>',
  next: '<path d="M6.5 5.5v13L16 12z" fill="currentColor" stroke="none"/><rect x="16.3" y="5.5" width="2.2" height="13" rx="1" fill="currentColor" stroke="none"/>',
  shuffle: '<path d="M3 6h3.5c2 0 3.2 1 4.3 2.7l2.4 3.6c1.1 1.7 2.3 2.7 4.3 2.7H21M3 17h3.5c1.6 0 2.7-.6 3.6-1.7M21 6h-3.5c-1.6 0-2.7.6-3.6 1.7"/><path d="m18.5 3.5 2.5 2.5-2.5 2.5M18.5 14.5 21 17l-2.5 2.5"/>',
  repeat: '<path d="M17 3.5 20 6l-3 2.5M20 6H7a3.5 3.5 0 0 0-3.5 3.5V11M7 20.5 4 18l3-2.5M4 18h13a3.5 3.5 0 0 0 3.5-3.5V13"/><path d="M10 12h4" stroke-width="0"/>',
  repeat1: '<path d="M17 3.5 20 6l-3 2.5M20 6H7a3.5 3.5 0 0 0-3.5 3.5V11M7 20.5 4 18l3-2.5M4 18h13a3.5 3.5 0 0 0 3.5-3.5V13"/><text x="9.2" y="14.6" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">1</text>',
  volume: '<path d="M4 9v6h3.5L12 19V5L7.5 9z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9v6h3.5L12 19V5L7.5 9z" fill="currentColor" stroke="none"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  dots: '<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  trash: '<path d="M4.5 6.5h15M9 6V4.5h6V6M6.5 6.5 7.5 20h9l1-13.5"/><path d="M10 10v6M14 10v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  fire: '<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-2.5 1.5-4.3 3-5.5C8.7 8 9 6 9 4.5c2 1 3.4 2.7 3.6 4.6 1.2-.5 2-1.6 2.2-3.1 2.4 1.9 3.7 4.6 3.7 7 0 4.4-2.5 8-6.5 8z"/>',
  note: '<path d="M9 18V6l10-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
  edit: '<path d="m14.5 5.5 4 4L8 20H4v-4z"/><path d="m12.5 7.5 4 4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  skip: '<path d="M5 4l7 8-7 8M13 4l7 8-7 8" transform="rotate(180 12 12)"/>',
};
function ico(name, cls) {
  return `<svg class="ico ${cls || ''}" viewBox="0 0 24 24">${I[name] || ''}</svg>`;
}
document.querySelectorAll('[data-ico]').forEach(el => { el.innerHTML = ico(el.dataset.ico); });

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtMin(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim();
}
function fmtHours(ms) { return (ms / 3600000).toFixed(1); }
function fmtDay(ts) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2400);
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
