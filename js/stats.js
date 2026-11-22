// Stats aggregation over App.history
const Stats = {
  playedBetween(from, to) {
    return App.history.filter(h => h.ts >= from && h.ts < to);
  },
  totalMs() {
    return App.history.reduce((a, h) => a + (h.ms || 0), 0);
  },
  totalPlays() { return App.history.length; },
  todayMs() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this.playedBetween(start.getTime(), Infinity).reduce((a, h) => a + (h.ms || 0), 0);
  },
  // consecutive days (ending today) with at least one play
  streak() {
    const days = new Set(App.history.map(h => dayKey(h.ts)));
    let n = 0;
    const d = new Date();
    // today may not have plays yet without breaking the streak
    if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d.getTime()))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },
  last7Days() {
    const out = [];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    for (let d = 6; d >= 0; d--) {
      const start = now.getTime() - d * 86400000;
      const ms = this.playedBetween(start, start + 86400000).reduce((a, h) => a + (h.ms || 0), 0);
      const date = new Date(start);
      out.push({ label: date.toLocaleDateString('en-US', { weekday: 'narrow' }), ms, ts: start });
    }
    return out;
  },
  last8Weeks() {
    const out = [];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const dow = (now.getDay() + 6) % 7; // Monday start
    const thisMonday = now.getTime() - dow * 86400000;
    for (let w = 7; w >= 0; w--) {
      const start = thisMonday - w * 7 * 86400000;
      const ms = this.playedBetween(start, start + 7 * 86400000).reduce((a, h) => a + (h.ms || 0), 0);
      out.push({ label: new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), ms, ts: start });
    }
    return out;
  },
  topGenres(limit = 5) {
    const bySong = new Map(App.songs.map(s => [s.id, s]));
    const counts = {};
    let total = 0;
    App.history.forEach(h => {
      const s = bySong.get(h.songId);
      if (!s) return;
      counts[s.genre] = (counts[s.genre] || 0) + 1;
      total++;
    });
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
    return rows.map(([g, n]) => ({ genre: g, pct: total ? Math.round(n / total * 100) : 0, n }));
  },
  whenYouListen() {
    const buckets = [
      { name: 'Morning', from: 5, to: 12, color: '#FFB800', n: 0 },
      { name: 'Afternoon', from: 12, to: 17, color: '#FF2D2D', n: 0 },
      { name: 'Evening', from: 17, to: 22, color: '#BF5FFF', n: 0 },
      { name: 'Night', from: 22, to: 5, color: '#00F5FF', n: 0 },
    ];
    App.history.forEach(h => {
      const hr = new Date(h.ts).getHours();
      const b = buckets.find(b => b.from <= hr && hr < b.to)
        || (hr < 5 ? buckets[3] : null);
      if (b) b.n++;
    });
    return buckets;
  },
  avgDayMs() {
    if (!App.history.length) return 0;
    const min = Math.min(...App.history.map(h => h.ts));
    const days = Math.max(1, Math.ceil((Date.now() - min) / 86400000));
    return this.totalMs() / days;
  },
  historyByDay() {
    const map = new Map();
    App.history.slice().sort((a, b) => b.ts - a.ts).forEach(h => {
      const k = dayKey(h.ts);
      if (!map.has(k)) map.set(k, { ts: h.ts, plays: [] });
      map.get(k).plays.push(h);
    });
    return [...map.values()];
  },
  topSongs(limit = 5) {
    const counts = {};
    App.history.forEach(h => counts[h.songId] = (counts[h.songId] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit)
      .map(([id, n]) => ({ song: App.songs.find(s => s.id === id), n })).filter(x => x.song);
  },
};
