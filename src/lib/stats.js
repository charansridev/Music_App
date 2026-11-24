import { dayKey } from './utils.js';

function playedBetween(history, from, to) {
  return history.filter((entry) => entry.ts >= from && entry.ts < to);
}

function sumDuration(entries) {
  return entries.reduce((total, entry) => total + (entry.ms || 0), 0);
}

export const Stats = {
  totalMs(history) {
    return sumDuration(history);
  },
  totalPlays(history) {
    return history.length;
  },
  todayMs(history) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sumDuration(playedBetween(history, start.getTime(), Infinity));
  },
  streak(history) {
    const days = new Set(history.map((entry) => dayKey(entry.ts)));
    let count = 0;
    const date = new Date();
    if (!days.has(dayKey(date.getTime()))) date.setDate(date.getDate() - 1);
    while (days.has(dayKey(date.getTime()))) {
      count++;
      date.setDate(date.getDate() - 1);
    }
    return count;
  },
  last7Days(history) {
    const output = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let offset = 6; offset >= 0; offset--) {
      const start = now.getTime() - offset * 86400000;
      output.push({
        label: new Date(start).toLocaleDateString('en-US', { weekday: 'narrow' }),
        ms: sumDuration(playedBetween(history, start, start + 86400000)),
        ts: start,
      });
    }
    return output;
  },
  last8Weeks(history) {
    const output = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayOfWeek = (now.getDay() + 6) % 7;
    const thisMonday = now.getTime() - dayOfWeek * 86400000;
    for (let week = 7; week >= 0; week--) {
      const start = thisMonday - week * 7 * 86400000;
      output.push({
        label: new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ms: sumDuration(playedBetween(history, start, start + 7 * 86400000)),
        ts: start,
      });
    }
    return output;
  },
  topGenres(history, songs, limit = 5) {
    const songsById = new Map(songs.map((song) => [song.id, song]));
    const counts = {};
    let total = 0;
    history.forEach((entry) => {
      const song = songsById.get(entry.songId);
      if (!song) return;
      counts[song.genre] = (counts[song.genre] || 0) + 1;
      total++;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genre, count]) => ({ genre, pct: total ? Math.round((count / total) * 100) : 0, n: count }));
  },
  whenYouListen(history) {
    const buckets = [
      { name: 'Morning', from: 5, to: 12, color: '#FFB800', n: 0 },
      { name: 'Afternoon', from: 12, to: 17, color: '#FF2D2D', n: 0 },
      { name: 'Evening', from: 17, to: 22, color: '#BF5FFF', n: 0 },
      { name: 'Night', from: 22, to: 5, color: '#00F5FF', n: 0 },
    ];
    history.forEach((entry) => {
      const hour = new Date(entry.ts).getHours();
      const bucket = buckets.find((item) => item.from <= hour && hour < item.to)
        || (hour < 5 ? buckets[3] : null);
      if (bucket) bucket.n++;
    });
    return buckets;
  },
  avgDayMs(history) {
    if (!history.length) return 0;
    const earliest = Math.min(...history.map((entry) => entry.ts));
    const days = Math.max(1, Math.ceil((Date.now() - earliest) / 86400000));
    return this.totalMs(history) / days;
  },
  historyByDay(history) {
    const days = new Map();
    history.slice().sort((a, b) => b.ts - a.ts).forEach((entry) => {
      const key = dayKey(entry.ts);
      if (!days.has(key)) days.set(key, { ts: entry.ts, plays: [] });
      days.get(key).plays.push(entry);
    });
    return [...days.values()];
  },
  topSongs(history, songs, limit = 5) {
    const counts = {};
    history.forEach((entry) => {
      counts[entry.songId] = (counts[entry.songId] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ song: songs.find((song) => song.id === id), n: count }))
      .filter((entry) => entry.song);
  },
};
