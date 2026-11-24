export function formatTime(seconds) {
  const value = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const minutes = Math.floor(value / 60);
  const remainder = Math.floor(value % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function formatMinutes(milliseconds) {
  const minutes = Math.round(milliseconds / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60 ? `${minutes % 60}m` : ''}`.trim();
}

export function formatHours(milliseconds) {
  return (milliseconds / 3600000).toFixed(1);
}

export function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatHundredths(seconds) {
  const value = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const minutes = Math.floor(value / 60);
  const remainder = Math.floor(value % 60);
  const hundredths = Math.floor((value % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

export function dayKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDecibels(volume) {
  if (volume <= 0) return '-∞ dB';
  return `${(20 * Math.log10(volume)).toFixed(1)} dB`;
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
