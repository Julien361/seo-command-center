const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('claude', {
  // Send a message to Claude Code
  send: (message) => ipcRenderer.invoke('claude-send', message),

  // Start Claude Code process
  start: () => ipcRenderer.invoke('claude-start'),

  // Stop Claude Code process
  stop: () => ipcRenderer.invoke('claude-stop'),

  // Get Claude Code status
  status: () => ipcRenderer.invoke('claude-status'),

  // Listen for Claude output
  onOutput: (callback) => {
    ipcRenderer.on('claude-output', (event, data) => callback(data));
  },

  // Remove output listener
  removeOutputListener: () => {
    ipcRenderer.removeAllListeners('claude-output');
  },
});

// Expose app info
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
