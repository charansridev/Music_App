const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('muzikDesktop', {
  isElectron: true,
  getDefaultMusicFolder: () => ipcRenderer.invoke('muzik:get-default-music-folder'),
  pickFolder: () => ipcRenderer.invoke('muzik:pick-folder'),
  listAudioFiles: (folderPath) => ipcRenderer.invoke('muzik:list-audio-files', folderPath),
  readMetadata: (filePath) => ipcRenderer.invoke('muzik:read-metadata', filePath),
  toMediaUrl: (filePath) => `muzik-media://local?path=${encodeURIComponent(filePath)}`,
});
