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
  const hash = hashString(key || 'muzik');
  const backgrounds = ['#0A0A0A', '#F2F1EC', '#D8D1C5', '#00921E', '#B5AAA0'];
  const accents = ['#F4D026', '#F25C2A', '#18B848', '#E892C4', '#2B7DE9'];
  const bg = backgrounds[hash % backgrounds.length];
  const ink = bg === '#0A0A0A' || bg === '#00921E' ? '#F2F1EC' : '#0A0A0A';
  const accent = accents[(hash >> 3) % accents.length];
  const motifs = [
    () => `<circle cx="150" cy="170" r="96" fill="${ink}"/><circle cx="150" cy="170" r="32" fill="${accent}"/>`,
    () => `<path d="M64 64 H248 V248 M242 70 L68 244" fill="none" stroke="${ink}" stroke-width="32" stroke-linecap="square"/><circle cx="92" cy="228" r="24" fill="${accent}"/>`,
    () => `<path d="M40 236 A120 120 0 0 1 280 236" fill="none" stroke="#F4D026" stroke-width="22"/><path d="M74 236 A86 86 0 0 1 246 236" fill="none" stroke="#18B848" stroke-width="20"/><path d="M108 236 A52 52 0 0 1 212 236" fill="none" stroke="#F25C2A" stroke-width="18"/>`,
    () => `<rect x="36" y="42" width="150" height="236" fill="${ink}"/><circle cx="218" cy="196" r="64" fill="${accent}"/>`,
    () => `<path d="M0 248 L160 144 L320 248" fill="none" stroke="${accent}" stroke-width="26"/><circle cx="160" cy="112" r="52" fill="${ink}"/><circle cx="160" cy="112" r="16" fill="${bg}"/>`,
  ];
  const motif = motifs[(hash >> 5) % motifs.length]();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="${bg}"/>
  <g>${motif}</g>
  <circle cx="276" cy="44" r="12" fill="${accent}"/>
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

function detectImageMime(bytes, declaredFormat = '') {
  if (!bytes || bytes.length < 32) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp';

  const normalized = String(declaredFormat || '').trim().toLowerCase();
  if (!normalized || normalized === '-->') return null;
  if (normalized === 'jpg' || normalized === 'jpeg' || normalized === 'image/jpg') return 'image/jpeg';
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  if (normalized.startsWith('image/') && !normalized.includes('url')) return normalized;
  return null;
}

async function extractValidArt(pictures) {
  if (!Array.isArray(pictures) || !pictures.length) return null;

  const ordered = [...pictures].sort((a, b) => {
    const aFront = /front|cover/i.test(a?.type || '') ? 0 : 1;
    const bFront = /front|cover/i.test(b?.type || '') ? 0 : 1;
    return aFront - bFront;
  });

  for (const picture of ordered) {
    const raw = picture?.data;
    if (!raw) continue;
    const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    const mime = detectImageMime(bytes, picture.format);
    if (!mime) continue;

    const blob = new Blob([bytes], { type: mime });
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(blob);
        bitmap.close?.();
      } catch {
        continue;
      }
    }

    const url = URL.createObjectURL(blob);
    activeObjectUrls.add(url);
    return { art: url, artType: mime };
  }

  return null;
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
  if (!artInfo && common.picture?.length) {
    artInfo = await extractValidArt(common.picture);
    if (artInfo) albumArtCache.set(albumKey, artInfo);
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
    const recent = [];
    results.forEach((song) => {
      if (song) {
        songs.push(song);
        recent.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          hires: song.hires,
        });
      }
    });
    onProgress?.({ done: Math.min(total, index + batch.length), total, recent });
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
