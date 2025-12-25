const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let claudeProcess = null;

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (claudeProcess) {
      claudeProcess.kill();
    }
  });
}

// Claude Code process management
function startClaudeProcess() {
  if (claudeProcess) {
    return;
  }

  // Find claude command
  const claudePath = process.platform === 'darwin'
    ? '/usr/local/bin/claude'
    : 'claude';

  claudeProcess = spawn(claudePath, ['--dangerously-skip-permissions'], {
    cwd: process.env.HOME,
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: true,
  });

  claudeProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (mainWindow) {
      mainWindow.webContents.send('claude-output', { type: 'stdout', data: output });
    }
  });

  claudeProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (mainWindow) {
      mainWindow.webContents.send('claude-output', { type: 'stderr', data: output });
    }
  });

  claudeProcess.on('close', (code) => {
    if (mainWindow) {
      mainWindow.webContents.send('claude-output', { type: 'exit', code });
    }
    claudeProcess = null;
  });

  claudeProcess.on('error', (error) => {
    if (mainWindow) {
      mainWindow.webContents.send('claude-output', { type: 'error', data: error.message });
    }
  });
}

// IPC Handlers
ipcMain.handle('claude-send', async (event, message) => {
  if (!claudeProcess) {
    startClaudeProcess();
    // Wait for process to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (claudeProcess && claudeProcess.stdin) {
    claudeProcess.stdin.write(message + '\n');
    return { success: true };
  }

  return { success: false, error: 'Claude process not running' };
});

ipcMain.handle('claude-start', async () => {
  startClaudeProcess();
  return { success: true };
});

ipcMain.handle('claude-stop', async () => {
  if (claudeProcess) {
    claudeProcess.kill();
    claudeProcess = null;
  }
  return { success: true };
});

ipcMain.handle('claude-status', async () => {
  return { running: claudeProcess !== null };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (claudeProcess) {
    claudeProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (claudeProcess) {
    claudeProcess.kill();
  }
});
