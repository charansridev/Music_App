const demoAudioUrls = new Map();

function art(bg, accent, motif) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="${bg}"/>
  <g>${motif}</g>
  <circle cx="276" cy="44" r="14" fill="${accent}"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const ART = {
  coffee: art(
    '#0A0A0A',
    '#F4D026',
    '<path d="M0 240 L160 140 L320 240" fill="none" stroke="#F25C2A" stroke-width="26"/><path d="M0 285 L160 185 L320 285" fill="none" stroke="#18B848" stroke-width="22"/><circle cx="160" cy="116" r="56" fill="#F2F1EC"/><circle cx="160" cy="116" r="18" fill="#0A0A0A"/>',
  ),
  redmoon: art(
    '#F2F1EC',
    '#F25C2A',
    '<rect x="36" y="42" width="164" height="236" fill="#0A0A0A"/><circle cx="212" cy="196" r="70" fill="#E892C4"/><circle cx="212" cy="196" r="24" fill="#0A0A0A"/>',
  ),
  glass: art(
    '#D8D1C5',
    '#2B7DE9',
    '<circle cx="160" cy="160" r="108" fill="#0A0A0A"/><path d="M148 64 H172 L166 130 H154 Z" fill="#D8D1C5"/><path d="M148 64 H172 L166 130 H154 Z" fill="#D8D1C5" transform="rotate(120 160 160)"/><path d="M148 64 H172 L166 130 H154 Z" fill="#D8D1C5" transform="rotate(240 160 160)"/><circle cx="160" cy="160" r="22" fill="#F2F1EC"/>',
  ),
  night: art(
    '#0A0A0A',
    '#18B848',
    '<path d="M40 240 A120 120 0 0 1 280 240" fill="none" stroke="#F4D026" stroke-width="22"/><path d="M74 240 A86 86 0 0 1 246 240" fill="none" stroke="#18B848" stroke-width="20"/><path d="M108 240 A52 52 0 0 1 212 240" fill="none" stroke="#F25C2A" stroke-width="18"/><circle cx="160" cy="240" r="18" fill="#F2F1EC"/>',
  ),
  green: art(
    '#00921E',
    '#F25C2A',
    '<path d="M64 64 H248 V248 M242 70 L68 244" fill="none" stroke="#F2F1EC" stroke-width="34" stroke-linecap="square"/><circle cx="88" cy="236" r="26" fill="#0A0A0A"/>',
  ),
  golden: art(
    '#B5AAA0',
    '#E53935',
    '<rect x="34" y="34" width="252" height="96" fill="#0A0A0A"/><rect x="34" y="156" width="120" height="130" fill="#F4D026"/><circle cx="222" cy="220" r="64" fill="#F2F1EC"/><circle cx="222" cy="220" r="20" fill="#0A0A0A"/>',
  ),
};

const DEMO_SONGS = [
  { id: 'demo-s1', title: 'Milk Foam Clouds', artist: 'Juniper Hollow', album: 'Stream & Static', albumArtist: 'Juniper Hollow', year: 2026, genre: 'Pop', track: 1, duration: 222, art: ART.coffee },
  { id: 'demo-s2', title: 'Paper Boats', artist: 'Juniper Hollow', album: 'Stream & Static', albumArtist: 'Juniper Hollow', year: 2026, genre: 'Pop', track: 2, duration: 195, art: ART.coffee },
  { id: 'demo-s3', title: 'Velvet Radio', artist: 'Juniper Hollow', album: 'Stream & Static', albumArtist: 'Juniper Hollow', year: 2026, genre: 'Pop', track: 3, duration: 245, art: ART.coffee },
  { id: 'demo-s4', title: 'Red Moon Freestyle', artist: 'Koff Mamrah', album: 'Red Moon Freestyle', albumArtist: 'Koff Mamrah', year: 2026, genre: 'Hip hop', track: 1, duration: 178, art: ART.redmoon },
  { id: 'demo-s5', title: 'Static Kicks', artist: 'Koff Mamrah', album: 'Red Moon Freestyle', albumArtist: 'Koff Mamrah', year: 2026, genre: 'Hip hop', track: 2, duration: 202, art: ART.redmoon },
  { id: 'demo-s6', title: 'Glasshouse', artist: 'Love Orchard', album: 'Glasshouse', albumArtist: 'Love Orchard', year: 2025, genre: 'Rock', track: 1, duration: 258, art: ART.glass },
  { id: 'demo-s7', title: 'Orchard Lines', artist: 'Love Orchard', album: 'Glasshouse', albumArtist: 'Love Orchard', year: 2025, genre: 'Rock', track: 2, duration: 216, art: ART.glass },
  { id: 'demo-s8', title: 'Night Dunes', artist: 'Dune Static', album: 'Night Dunes', albumArtist: 'Dune Static', year: 2026, genre: 'Jazz & soul', track: 1, duration: 301, art: ART.night },
  { id: 'demo-s9', title: 'Moon Sand', artist: 'Dune Static', album: 'Night Dunes', albumArtist: 'Dune Static', year: 2026, genre: 'Jazz & soul', track: 2, duration: 227, art: ART.night },
  { id: 'demo-s10', title: 'Soft Green Rooms', artist: 'Miss & Liven', album: 'Soft Green Rooms', albumArtist: 'Miss & Liven', year: 2025, genre: 'Pop', track: 1, duration: 208, art: ART.green },
  { id: 'demo-s11', title: 'Fern Light', artist: 'Miss & Liven', album: 'Soft Green Rooms', albumArtist: 'Miss & Liven', year: 2025, genre: 'Pop', track: 2, duration: 191, art: ART.green },
  { id: 'demo-s12', title: 'Golden Hour Club', artist: 'Koff Mamrah', album: 'Golden Hour Club', albumArtist: 'Koff Mamrah', year: 2024, genre: 'Jazz & soul', track: 1, duration: 284, art: ART.golden },
  { id: 'demo-s13', title: 'Slow Mornings', artist: 'Koff Mamrah', album: 'Golden Hour Club', albumArtist: 'Koff Mamrah', year: 2024, genre: 'Jazz & soul', track: 2, duration: 233, art: ART.golden },
];

export const DEMO_LOVED = ['demo-s1', 'demo-s4', 'demo-s8', 'demo-s10', 'demo-s12', 'demo-s3'];

export const DEMO_PLAYLISTS = [
  { id: 'demo-p1', name: 'Late night lo-fi', songIds: ['demo-s8', 'demo-s9', 'demo-s1', 'demo-s13'] },
  { id: 'demo-p2', name: 'Morning brew', songIds: ['demo-s10', 'demo-s2', 'demo-s11', 'demo-s6', 'demo-s3'] },
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

export function seedDemoHistory() {
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

  history.push({ songId: 'demo-s1', ts: now - 20 * 60000, ms: 142000 });
  return history;
}

function songTech(id) {
  let hash = 7;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const specs = [
    { spec: '44.1kHz / 16b', short: 'FLAC 16/44.1', quant: '16-BIT FLAC', hz: '44.100 kHz', dr: '1411k · 2CH', hires: false },
    { spec: '48kHz / 24b', short: 'FLAC 24/48', quant: '24-BIT FLAC', hz: '48.000 kHz', dr: '2304k · 2CH', hires: true },
    { spec: '96kHz / 24b', short: 'FLAC 24/96', quant: '24-BIT FLAC', hz: '96.000 kHz', dr: '4608k · 2CH', hires: true },
    { spec: 'DSD 2.8MHz', short: 'DSD 2.8', quant: 'DSD 1-BIT', hz: '2.8224 MHz', dr: '5644k · 2CH', hires: true },
  ];
  return specs[hash % specs.length];
}

function demoAudioSrc(song) {
  if (demoAudioUrls.has(song.id)) return demoAudioUrls.get(song.id);

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

  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  demoAudioUrls.set(song.id, url);
  return url;
}

export function revokeDemoAudioUrls() {
  demoAudioUrls.forEach((url) => URL.revokeObjectURL(url));
  demoAudioUrls.clear();
}

export function buildDemoSongs() {
  return DEMO_SONGS.map((song) => ({
    ...song,
    ...songTech(song.id),
    artType: 'image/svg+xml',
    resolveAudioUrl: () => demoAudioSrc(song),
  }));
}
