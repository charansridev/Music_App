// Demo dataset — same song model the real folder scanner will produce later.

const GENRE_COLORS = {
  'Pop': '#FF2D2D',
  'Hip hop': '#BF5FFF',
  'Rock': '#FF2D2D',
  'Jazz & soul': '#FFB800',
  'Electronic': '#00F5FF',
  'Folk': '#39FF14',
};

function art(c, motif) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
  <defs>
    <filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
    <pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${c}22"/></pattern>
  </defs>
  <rect width="320" height="320" fill="#050505"/>
  <rect width="320" height="320" fill="url(#d)"/>
  <g filter="url(#b)" opacity=".55">${motif}</g>
  <g fill="none" stroke="${c}" stroke-width="5">${motif}</g>
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const ART = {
  coffee: art('#FF2D2D', '<circle cx="160" cy="150" r="80"/><circle cx="160" cy="150" r="30" fill="#FF2D2D" stroke="none"/>'),
  redmoon: art('#BF5FFF', '<rect x="70" y="90" width="180" height="140"/><path d="M70 90 160 40l90 50"/>'),
  glass: art('#00F5FF', '<path d="M50 250 160 60l110 190z"/><circle cx="160" cy="190" r="24" fill="#00F5FF" stroke="none"/>'),
  night: art('#FFB800', '<circle cx="230" cy="90" r="50"/><path d="M40 240h240M40 270h180M40 210h160" />'),
  green: art('#39FF14', '<rect x="80" y="80" width="160" height="160"/><rect x="130" y="130" width="60" height="60" fill="#39FF14" stroke="none"/>'),
  golden: art('#FF2D2D', '<path d="M60 240c40-90 160-90 200 0"/><circle cx="160" cy="110" r="46" fill="#FF2D2D" stroke="none"/>'),
};

const DEMO_SONGS = [
  { id: 's1', title: 'Milk Foam Clouds', artist: 'Juniper Hollow', album: 'Stream & Static', albumArtist: 'Juniper Hollow', year: 2026, genre: 'Pop', track: 1, duration: 222, art: ART.coffee },
  { id: 's2', title: 'Paper Boats', artist: 'Juniper Hollow', album: 'Stream & Static', albumArtist: 'Juniper Hollow', year: 2026, genre: 'Pop', track: 2, duration: 195, art: ART.coffee },
  { id: 's3', title: 'Velvet Radio', artist: 'Juniper Hollow', album: 'Stream & Static', albumArtist: 'Juniper Hollow', year: 2026, genre: 'Pop', track: 3, duration: 245, art: ART.coffee },
  { id: 's4', title: 'Red Moon Freestyle', artist: 'Koff Mamrah', album: 'Red Moon Freestyle', albumArtist: 'Koff Mamrah', year: 2026, genre: 'Hip hop', track: 1, duration: 178, art: ART.redmoon },
  { id: 's5', title: 'Static Kicks', artist: 'Koff Mamrah', album: 'Red Moon Freestyle', albumArtist: 'Koff Mamrah', year: 2026, genre: 'Hip hop', track: 2, duration: 202, art: ART.redmoon },
  { id: 's6', title: 'Glasshouse', artist: 'Love Orchard', album: 'Glasshouse', albumArtist: 'Love Orchard', year: 2025, genre: 'Rock', track: 1, duration: 258, art: ART.glass },
  { id: 's7', title: 'Orchard Lines', artist: 'Love Orchard', album: 'Glasshouse', albumArtist: 'Love Orchard', year: 2025, genre: 'Rock', track: 2, duration: 216, art: ART.glass },
  { id: 's8', title: 'Night Dunes', artist: 'Dune Static', album: 'Night Dunes', albumArtist: 'Dune Static', year: 2026, genre: 'Jazz & soul', track: 1, duration: 301, art: ART.night },
  { id: 's9', title: 'Moon Sand', artist: 'Dune Static', album: 'Night Dunes', albumArtist: 'Dune Static', year: 2026, genre: 'Jazz & soul', track: 2, duration: 227, art: ART.night },
  { id: 's10', title: 'Soft Green Rooms', artist: 'Miss & Liven', album: 'Soft Green Rooms', albumArtist: 'Miss & Liven', year: 2025, genre: 'Pop', track: 1, duration: 208, art: ART.green },
  { id: 's11', title: 'Fern Light', artist: 'Miss & Liven', album: 'Soft Green Rooms', albumArtist: 'Miss & Liven', year: 2025, genre: 'Pop', track: 2, duration: 191, art: ART.green },
  { id: 's12', title: 'Golden Hour Club', artist: 'Koff Mamrah', album: 'Golden Hour Club', albumArtist: 'Koff Mamrah', year: 2024, genre: 'Jazz & soul', track: 1, duration: 284, art: ART.golden },
  { id: 's13', title: 'Slow Mornings', artist: 'Koff Mamrah', album: 'Golden Hour Club', albumArtist: 'Koff Mamrah', year: 2024, genre: 'Jazz & soul', track: 2, duration: 233, art: ART.golden },
];

const DEMO_LOVED = new Set(['s1', 's4', 's8', 's10', 's12', 's3']);

const DEMO_PLAYLISTS = [
  { id: 'p1', name: 'Late night lo-fi', songIds: ['s8', 's9', 's1', 's13'] },
  { id: 'p2', name: 'Morning brew', songIds: ['s10', 's2', 's11', 's6', 's3'] },
];

// Seeded play history: last 60 days, with a live streak
function seedHistory() {
  const out = [];
  const rand = mulberry(42);
  const now = Date.now();
  const DAY = 86400000;
  for (let d = 59; d >= 0; d--) {
    const dayStart = new Date(now - d * DAY);
    dayStart.setHours(0, 0, 0, 0);
    let plays = 0;
    if (d < 9) plays = 2 + Math.floor(rand() * 4);        // current streak
    else plays = rand() < 0.72 ? 1 + Math.floor(rand() * 5) : 0;
    for (let p = 0; p < plays; p++) {
      const song = DEMO_SONGS[Math.floor(rand() * DEMO_SONGS.length)];
      const hour = [7, 8, 9, 12, 13, 17, 18, 20, 21, 22, 23][Math.floor(rand() * 11)];
      const ts = dayStart.getTime() + hour * 3600000 + Math.floor(rand() * 3500000);
      const ms = 60000 + rand() * (song.duration * 1000 - 60000);
      out.push({ songId: song.id, ts, ms });
    }
  }
  // a few plays today
  out.push({ songId: 's1', ts: now - 20 * 60000, ms: 142000 });
  return out;
}
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLibrary() {
  const songs = DEMO_SONGS.map(s => ({ ...s, src: null }));
  const albumMap = new Map();
  const artistMap = new Map();
  songs.forEach(s => {
    const ak = s.album + '|' + s.albumArtist;
    if (!albumMap.has(ak)) albumMap.set(ak, { key: ak, name: s.album, artist: s.albumArtist, year: s.year, genre: s.genre, art: s.art, songIds: [] });
    albumMap.get(ak).songIds.push(s.id);
    if (!artistMap.has(s.artist)) artistMap.set(s.artist, { name: s.artist, songIds: [], art: s.art });
    artistMap.get(s.artist).songIds.push(s.id);
  });
  const genres = [...new Set(songs.map(s => s.genre))];
  return { songs, albums: [...albumMap.values()], artists: [...artistMap.values()], genres };
}

// Short generated tone-track so the demo player actually plays something.
function demoAudioSrc(song) {
  if (song.src) return song.src;
  const rate = 8000, n = Math.floor(rate * song.duration);
  const seed = [...song.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 180 + (seed % 140);
  const scale = [0, 3, 5, 7, 10];
  const buf = new ArrayBuffer(44 + n);
  const dv = new DataView(buf);
  const wstr = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); dv.setUint32(4, 36 + n, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  wstr(36, 'data'); dv.setUint32(40, n, true);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const bar = Math.floor(t / 2) % 8;
    const f = base * Math.pow(2, scale[(bar + seed) % scale.length] / 12);
    const env = Math.min(1, t * 2) * (t > song.duration - 2 ? Math.max(0, (song.duration - t) / 2) : 1);
    const beat = t % 0.5 < 0.05 ? 0.6 : 1;
    const v = (Math.sin(2 * Math.PI * f * t) * 0.5 + Math.sin(2 * Math.PI * f * 2 * t) * 0.2 + Math.sin(2 * Math.PI * f / 2 * t) * 0.25) * env * beat * 38;
    dv.setUint8(44 + i, Math.max(0, Math.min(255, Math.round(128 + v))));
  }
  song.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return song.src;
}
