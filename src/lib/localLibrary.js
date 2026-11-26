import { parseBlob } from 'music-metadata';

export const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
  '.opus',
  '.webm',
  '.aif',
  '.aiff',
]);

const DB_NAME = 'nothing-audio-os';
const DB_VERSION = 1;
const HANDLE_STORE = 'handles';
const LAST_FOLDER_KEY = 'last-folder';

let audioUrls = new WeakMap();
const activeObjectUrls = new Set();

export function supportsDirectoryPicker() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export async function pickDirectoryHandle() {
  return window.showDirectoryPicker({ id: 'nothing-music-folder', mode: 'read' });
}

export async function verifyHandlePermission(handle) {
  if (!handle) return false;
  if (typeof handle.queryPermission === 'function') {
    const state = await handle.queryPermission({ mode: 'read' });
    if (state === 'granted') return true;
  }
  if (typeof handle.requestPermission === 'function') {
    const state = await handle.requestPermission({ mode: 'read' });
    return state === 'granted';
  }
  return true;
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFolderHandle(handle) {
  if (!handle) return;
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).put(handle, LAST_FOLDER_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore storage failures in restricted/private browser contexts.
  }
}

export async function loadSavedFolderHandle() {
  try {
    const db = await openHandleDb();
    const handle = await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const request = tx.objectStore(HANDLE_STORE).get(LAST_FOLDER_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export async function clearSavedFolderHandle() {
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).delete(LAST_FOLDER_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore storage failures in restricted/private browser contexts.
  }
}

export function getSongAudioUrl(song) {
  if (!song) return '';
  if (song.src) return song.src;
  if (typeof song.resolveAudioUrl === 'function') return song.resolveAudioUrl();
  if (audioUrls.has(song)) return audioUrls.get(song);
  if (!song.file) return '';
  const url = URL.createObjectURL(song.file);
  audioUrls.set(song, url);
  activeObjectUrls.add(url);
  return url;
}

export function revokeAllObjectUrls() {
  activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeObjectUrls.clear();
  audioUrls = new WeakMap();
}

function hashString(value) {
  let hash = 7;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function fallbackArt(key) {
  const hash = hashString(key || 'nothing');
  const palette = ['#FF2D2D', '#00F5FF', '#FFB800', '#22c55e', '#BF5FFF', '#e2e2e2'];
  const motifs = [
    (c) => `<circle cx="160" cy="160" r="78"/><circle cx="160" cy="160" r="26" fill="${c}" stroke="none"/>`,
    (c) => `<rect x="76" y="76" width="168" height="168"/><rect x="132" y="132" width="56" height="56" fill="${c}" stroke="none"/>`,
    (c) => `<path d="M56 244 160 62l104 182z"/><circle cx="160" cy="186" r="22" fill="${c}" stroke="none"/>`,
    (c) => `<circle cx="220" cy="100" r="44"/><path d="M44 236h232M44 266h168M44 206h144"/>`,
    (c) => `<path d="M60 236c40-88 160-88 200 0"/><circle cx="160" cy="112" r="42" fill="${c}" stroke="none"/>`,
  ];
  const color = palette[hash % palette.length];
  const motif = motifs[(hash >> 3) % motifs.length](color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
  <defs>
    <filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
    <pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${color}22"/></pattern>
  </defs>
  <rect width="320" height="320" fill="#050505"/>
  <rect width="320" height="320" fill="url(#d)"/>
  <g filter="url(#b)" opacity=".5">${motif}</g>
  <g fill="none" stroke="${color}" stroke-width="5">${motif}</g>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getExtension(name) {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

function parseFallbackPathInfo(relativePath, fileName) {
  const ext = getExtension(fileName);
  const baseName = ext ? fileName.slice(0, -ext.length) : fileName;
  const parts = relativePath.split('/').filter(Boolean);
  const parentFolder = parts.length >= 2 ? parts[parts.length - 2] : 'Local Folder';
  const dashSplit = baseName.split(' - ');
  if (dashSplit.length >= 2) {
    return {
      ext,
      fallbackArtist: dashSplit[0].trim() || 'Unknown Artist',
      fallbackTitle: dashSplit.slice(1).join(' - ').trim() || baseName,
      fallbackAlbum: parentFolder,
    };
  }
  return {
    ext,
    fallbackArtist: 'Unknown Artist',
    fallbackTitle: baseName,
    fallbackAlbum: parentFolder,
  };
}

function formatSpecs(format = {}, ext = '') {
  const sampleRate = format.sampleRate || 0;
  const bits = format.bitsPerSample || 0;
  const channels = format.numberOfChannels || 2;
  const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : 0;
  const rawContainer = (format.container || ext.replace(/^\./, '') || 'AUDIO').toUpperCase();
  const container = rawContainer === 'MPEG' ? 'MP3' : rawContainer;
  const codec = (format.codec || container).toUpperCase();
  const khz = sampleRate ? `${(sampleRate / 1000).toFixed(sampleRate % 1000 === 0 ? 0 : 1)}kHz` : '';
  const hz = sampleRate ? `${(sampleRate / 1000).toFixed(3)} kHz` : '—';
  const lossless = Boolean(format.lossless || ['.flac', '.wav', '.aif', '.aiff'].includes(ext));
  const hires = sampleRate >= 88200 || bits >= 24;

  let spec = container;
  if (sampleRate && bits) spec = `${khz} / ${bits}b`;
  else if (sampleRate && bitrate) spec = `${khz} · ${bitrate}k`;
  else if (sampleRate) spec = `${khz} ${container}`;

  let short = container;
  if (lossless && bits && sampleRate) {
    short = `${container} ${bits}/${(sampleRate / 1000).toFixed(sampleRate % 1000 === 0 ? 0 : 1)}`;
  } else if (bitrate) {
    short = `${container} ${bitrate}k`;
  }

  const quant = bits ? `${bits}-BIT ${container}` : codec;
  const dr = bitrate
    ? `${bitrate}k · ${channels}CH`
    : lossless
      ? `LOSSLESS · ${channels}CH`
      : `${channels}CH`;

  return { spec, short, quant, hz, dr, hires };
}

async function buildSongFromEntry({ file, relativePath }, albumArtCache) {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const { ext, fallbackArtist, fallbackTitle, fallbackAlbum } = parseFallbackPathInfo(normalizedPath, file.name);

  let metadata = null;
  try {
    metadata = await parseBlob(file, { duration: true, skipCovers: false });
  } catch {
    metadata = null;
  }

  const common = metadata?.common || {};
  const format = metadata?.format || {};

  const title = common.title?.trim() || fallbackTitle;
  const artist = common.artist?.trim() || common.albumartist?.trim() || fallbackArtist;
  const album = common.album?.trim() || fallbackAlbum;
  const albumArtist = common.albumartist?.trim() || artist;
  const year = common.year || (file.lastModified ? new Date(file.lastModified).getFullYear() : new Date().getFullYear());
  const genre = common.genre?.[0]?.trim() || 'Uncategorized';
  const track = common.track?.no || 0;
  const duration = Number.isFinite(format.duration) && format.duration > 0 ? format.duration : 0;

  const albumKey = `${album}|${albumArtist}`;
  let artInfo = albumArtCache.get(albumKey);
  if (!artInfo && common.picture?.[0]) {
    const picture = common.picture[0];
    const artType = picture.format || 'image/jpeg';
    const url = URL.createObjectURL(new Blob([picture.data], { type: artType }));
    activeObjectUrls.add(url);
    artInfo = { art: url, artType };
    albumArtCache.set(albumKey, artInfo);
  }

  const art = artInfo?.art || fallbackArt(albumKey);
  const artType = artInfo?.artType || 'image/svg+xml';
  const specs = formatSpecs(format, ext);

  return {
    id: normalizedPath,
    title,
    artist,
    album,
    albumArtist,
    year,
    genre,
    track,
    duration,
    art,
    artType,
    file,
    ...specs,
  };
}

async function collectHandleEntries(dirHandle, prefix = '', out = []) {
  for await (const [name, entry] of dirHandle.entries()) {
    if (name.startsWith('.')) continue;
    const relativePath = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === 'directory') {
      await collectHandleEntries(entry, relativePath, out);
    } else if (entry.kind === 'file' && AUDIO_EXTENSIONS.has(getExtension(name))) {
      out.push({ handle: entry, relativePath });
    }
  }
  return out;
}

async function parseEntries(entries, getFile, onProgress) {
  const albumArtCache = new Map();
  const songs = [];
  const total = entries.length;
  onProgress?.({ done: 0, total });

  const batchSize = 6;
  for (let index = 0; index < total; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    const results = await Promise.all(batch.map(async (entry) => {
      try {
        const file = await getFile(entry);
        return await buildSongFromEntry({ file, relativePath: entry.relativePath }, albumArtCache);
      } catch {
        return null;
      }
    }));
    results.forEach((song) => {
      if (song) songs.push(song);
    });
    onProgress?.({ done: Math.min(total, index + batch.length), total });
  }

  songs.sort((a, b) => (
    a.album.localeCompare(b.album)
    || (a.track || 9999) - (b.track || 9999)
    || a.title.localeCompare(b.title)
  ));

  return songs;
}

export async function scanDirectoryHandle(dirHandle, onProgress) {
  const entries = await collectHandleEntries(dirHandle);
  return parseEntries(entries, (entry) => entry.handle.getFile(), onProgress);
}

export async function scanFileList(fileList, onProgress) {
  const files = Array.from(fileList || []).filter((file) => {
    if (file.name.startsWith('.')) return false;
    return AUDIO_EXTENSIONS.has(getExtension(file.name));
  });
  const firstRel = files[0]?.webkitRelativePath || '';
  const folderName = firstRel.includes('/') ? firstRel.split('/')[0] : 'Local Folder';
  const entries = files.map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
  const songs = await parseEntries(entries, (entry) => entry.file, onProgress);
  return { folderName, songs };
}

export function indexLibrary(songs) {
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
    genres: [...new Set(songs.map((song) => song.genre))].sort((a, b) => a.localeCompare(b)),
  };
}
