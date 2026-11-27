const { app, BrowserWindow, dialog, ipcMain, protocol, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const AUDIO_EXTENSIONS = new Set([
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

const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.webm': 'audio/webm',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
};

const allowedRoots = new Set();
let parseFileFn = null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'muzik-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function isPathAllowed(targetPath) {
  const resolved = path.resolve(targetPath);
  for (const root of allowedRoots) {
    const rel = path.relative(root, resolved);
    if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
      return true;
    }
  }
  return false;
}

async function listAudioRecursive(dirPath, rootPath, out = []) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await listAudioRecursive(fullPath, rootPath, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        const stat = await fs.promises.stat(fullPath).catch(() => null);
        out.push({
          filePath: fullPath,
          relativePath: path.relative(rootPath, fullPath).replace(/\\/g, '/'),
          name: entry.name,
          mtimeMs: stat?.mtimeMs || Date.now(),
        });
      }
    }
  }
  return out;
}

function registerMediaProtocol() {
  protocol.handle('muzik-media', async (request) => {
    try {
      const url = new URL(request.url);
      const rawPath = url.searchParams.get('path');
      if (!rawPath) return new Response('Missing path', { status: 400 });

      const resolved = path.resolve(rawPath);
      if (!isPathAllowed(resolved)) {
        return new Response('Forbidden', { status: 403 });
      }

      const stat = await fs.promises.stat(resolved).catch(() => null);
      if (!stat || !stat.isFile()) {
        return new Response('Not found', { status: 404 });
      }

      const ext = path.extname(resolved).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const total = stat.size;
      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
        if (!match) {
          return new Response('Invalid range', {
            status: 416,
            headers: { 'Content-Range': `bytes */${total}` },
          });
        }
        const start = Number(match[1]);
        const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
        if (start >= total || start > end) {
          return new Response('Range not satisfiable', {
            status: 416,
            headers: { 'Content-Range': `bytes */${total}` },
          });
        }

        const chunkSize = end - start + 1;
        const stream = fs.createReadStream(resolved, { start, end });
        return new Response(Readable.toWeb(stream), {
          status: 206,
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(chunkSize),
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      const stream = fs.createReadStream(resolved);
      return new Response(Readable.toWeb(stream), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(total),
          'Accept-Ranges': 'bytes',
        },
      });
    } catch {
      return new Response('Internal server error', { status: 500 });
    }
  });
}

function registerIpcHandlers() {
  ipcMain.handle('muzik:get-default-music-folder', async () => {
    try {
      const musicDir = path.resolve(app.getPath('music'));
      const stat = await fs.promises.stat(musicDir).catch(() => null);
      if (!stat || !stat.isDirectory()) return null;
      allowedRoots.add(musicDir);
      return {
        folderPath: musicDir,
        folderName: path.basename(musicDir) || 'Music',
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle('muzik:pick-folder', async () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Local Music Folder',
      properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return null;
    const folderPath = path.resolve(result.filePaths[0]);
    allowedRoots.add(folderPath);
    return {
      folderPath,
      folderName: path.basename(folderPath) || folderPath,
    };
  });

  ipcMain.handle('muzik:list-audio-files', async (_event, folderPath) => {
    if (!folderPath) return [];
    const resolved = path.resolve(folderPath);
    const stat = await fs.promises.stat(resolved).catch(() => null);
    if (!stat || !stat.isDirectory()) return [];
    allowedRoots.add(resolved);
    return listAudioRecursive(resolved, resolved, []);
  });

  ipcMain.handle('muzik:read-metadata', async (_event, filePath) => {
    if (!filePath) return null;
    const resolved = path.resolve(filePath);
    if (!isPathAllowed(resolved)) return null;

    if (!parseFileFn) {
      const mm = await import('music-metadata');
      parseFileFn = mm.parseFile;
    }

    try {
      const metadata = await parseFileFn(resolved, { duration: true, skipCovers: false });
      const common = metadata?.common || {};
      const format = metadata?.format || {};
      const pictures = Array.isArray(common.picture)
        ? common.picture.map((pic) => ({
            format: pic.format || '',
            type: pic.type || '',
            data: pic.data ? Uint8Array.from(pic.data) : null,
          }))
        : [];

      return {
        common: {
          title: common.title || '',
          artist: common.artist || '',
          album: common.album || '',
          albumartist: common.albumartist || '',
          year: common.year || 0,
          genre: Array.isArray(common.genre) ? common.genre : [],
          track: common.track || {},
          picture: pictures,
        },
        format: {
          duration: format.duration || 0,
          sampleRate: format.sampleRate || 0,
          bitsPerSample: format.bitsPerSample || 0,
          numberOfChannels: format.numberOfChannels || 2,
          bitrate: format.bitrate || 0,
          container: format.container || '',
          codec: format.codec || '',
          lossless: Boolean(format.lossless),
        },
      };
    } catch {
      return null;
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0A0A0A',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    title: 'MUZIK',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media' || permission === 'audioCapture' || permission === 'speaker-selection') {
      callback(true);
      return;
    }
    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => (
    permission === 'media' || permission === 'audioCapture' || permission === 'speaker-selection'
  ));

  registerMediaProtocol();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
