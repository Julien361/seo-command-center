const { contextBridge, ipcRenderer } = require('electron');

// Expose terminal methods to the renderer process
contextBridge.exposeInMainWorld('terminal', {
  // Start Claude Code terminal
  start: () => ipcRenderer.invoke('terminal-start'),

  // Write data to terminal
  write: (data) => ipcRenderer.invoke('terminal-write', data),

  // Resize terminal
  resize: (cols, rows) => ipcRenderer.invoke('terminal-resize', { cols, rows }),

  // Stop terminal
  stop: () => ipcRenderer.invoke('terminal-stop'),

  // Listen for terminal data
  onData: (callback) => {
    ipcRenderer.on('terminal-data', (event, data) => callback(data));
  },

  // Listen for terminal exit
  onExit: (callback) => {
    ipcRenderer.on('terminal-exit', (event, code) => callback(code));
  },

  // Remove listeners
  removeListeners: () => {
    ipcRenderer.removeAllListeners('terminal-data');
    ipcRenderer.removeAllListeners('terminal-exit');
  },
});

// Expose app info
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
