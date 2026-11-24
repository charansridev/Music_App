const audioSources = new WeakMap();

function art(color, motif) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
  <defs>
    <filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
    <pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${color}22"/></pattern>
  </defs>
  <rect width="320" height="320" fill="#050505"/>
  <rect width="320" height="320" fill="url(#d)"/>
  <g filter="url(#b)" opacity=".55">${motif}</g>
  <g fill="none" stroke="${color}" stroke-width="5">${motif}</g>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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

export const DEMO_LOVED = ['s1', 's4', 's8', 's10', 's12', 's3'];

export const DEMO_PLAYLISTS = [
  { id: 'p1', name: 'Late night lo-fi', songIds: ['s8', 's9', 's1', 's13'] },
  { id: 'p2', name: 'Morning brew', songIds: ['s10', 's2', 's11', 's6', 's3'] },
];

function mulberry(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedHistory() {
  const history = [];
  const random = mulberry(42);
  const now = Date.now();
  const day = 86400000;

  for (let offset = 59; offset >= 0; offset--) {
    const dayStart = new Date(now - offset * day);
    dayStart.setHours(0, 0, 0, 0);
    let plays = 0;
    if (offset < 9) plays = 2 + Math.floor(random() * 4);
    else plays = random() < 0.72 ? 1 + Math.floor(random() * 5) : 0;

    for (let play = 0; play < plays; play++) {
      const song = DEMO_SONGS[Math.floor(random() * DEMO_SONGS.length)];
      const hour = [7, 8, 9, 12, 13, 17, 18, 20, 21, 22, 23][Math.floor(random() * 11)];
      const ts = dayStart.getTime() + hour * 3600000 + Math.floor(random() * 3500000);
      const ms = 60000 + random() * (song.duration * 1000 - 60000);
      history.push({ songId: song.id, ts, ms });
    }
  }

  history.push({ songId: 's1', ts: now - 20 * 60000, ms: 142000 });
  return history;
}

function songTech(id) {
  let hash = 7;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const specs = [
    { spec: '44.1kHz / 16b', short: 'FLAC 16/44.1', quant: '16-BIT FLAC', hz: '44.100 kHz' },
    { spec: '48kHz / 24b', short: 'FLAC 24/48', quant: '24-BIT FLAC', hz: '48.000 kHz' },
    { spec: '96kHz / 24b', short: 'FLAC 24/96', quant: '24-BIT FLAC', hz: '96.000 kHz' },
    { spec: 'DSD 2.8MHz', short: 'DSD 2.8', quant: 'DSD 1-BIT', hz: '2.8224 MHz' },
  ];
  const selected = specs[hash % specs.length];
  return { ...selected, dr: `DR${11 + ((hash >> 2) % 6)}`, hires: hash % specs.length >= 2 };
}

export function buildLibrary() {
  const songs = DEMO_SONGS.map((song) => ({ ...song, ...songTech(song.id) }));
  const albumMap = new Map();
  const artistMap = new Map();

  songs.forEach((song) => {
    const albumKey = `${song.album}|${song.albumArtist}`;
    if (!albumMap.has(albumKey)) {
      albumMap.set(albumKey, {
        key: albumKey,
        name: song.album,
        artist: song.albumArtist,
        year: song.year,
        genre: song.genre,
        art: song.art,
        songIds: [],
      });
    }
    albumMap.get(albumKey).songIds.push(song.id);

    if (!artistMap.has(song.artist)) {
      artistMap.set(song.artist, { name: song.artist, songIds: [], art: song.art });
    }
    artistMap.get(song.artist).songIds.push(song.id);
  });

  return {
    songs,
    albums: [...albumMap.values()],
    artists: [...artistMap.values()],
    genres: [...new Set(songs.map((song) => song.genre))],
  };
}

export function demoAudioSrc(song) {
  if (song.src) return song.src;
  if (audioSources.has(song)) return audioSources.get(song);

  const rate = 8000;
  const sampleCount = Math.floor(rate * song.duration);
  const seed = [...song.id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const base = 180 + (seed % 140);
  const scale = [0, 3, 5, 7, 10];
  const buffer = new ArrayBuffer(44 + sampleCount);
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeString(36, 'data');
  view.setUint32(40, sampleCount, true);

  for (let index = 0; index < sampleCount; index++) {
    const time = index / rate;
    const bar = Math.floor(time / 2) % 8;
    const frequency = base * Math.pow(2, scale[(bar + seed) % scale.length] / 12);
    const envelope = Math.min(1, time * 2) * (time > song.duration - 2 ? Math.max(0, (song.duration - time) / 2) : 1);
    const beat = time % 0.5 < 0.05 ? 0.6 : 1;
    const value = (
      Math.sin(2 * Math.PI * frequency * time) * 0.5
      + Math.sin(2 * Math.PI * frequency * 2 * time) * 0.2
      + Math.sin(2 * Math.PI * frequency / 2 * time) * 0.25
    ) * envelope * beat * 38;
    view.setUint8(44 + index, Math.max(0, Math.min(255, Math.round(128 + value))));
  }

  const source = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  audioSources.set(song, source);
  return source;
}
