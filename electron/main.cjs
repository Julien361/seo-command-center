const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const os = require('os');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let ptyProcess = null;
let isStarting = false;

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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (ptyProcess) {
      ptyProcess.kill();
    }
  });
}

// Start Claude Code in a PTY
function startClaude() {
  if (ptyProcess || isStarting) {
    console.log('[PTY] Already running or starting');
    return;
  }

  isStarting = true;

  try {
    // Dynamically require node-pty (native module)
    const pty = require('node-pty');
    console.log('[PTY] node-pty loaded successfully');

    // Use zsh with login shell to get proper PATH
    const shell = '/bin/zsh';
    const args = ['-l'];

    console.log('[PTY] Spawning:', shell, args);

    // Start in the SEO Command Center project directory
    const projectDir = path.join(__dirname, '..');
    console.log('[PTY] Starting in directory:', projectDir);

    ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: projectDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        LANG: 'en_US.UTF-8',
      },
    });

    console.log('[PTY] Process spawned with PID:', ptyProcess.pid);
    isStarting = false;

    ptyProcess.onData((data) => {
      if (mainWindow) {
        mainWindow.webContents.send('terminal-data', data);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log('[PTY] Process exited with code:', exitCode);
      if (mainWindow) {
        mainWindow.webContents.send('terminal-exit', exitCode);
      }
      ptyProcess = null;
      isStarting = false;
    });

    // Auto-launch claude after shell is ready
    setTimeout(() => {
      if (ptyProcess) {
        console.log('[PTY] Sending claude command');
        ptyProcess.write('claude\r');
      }
    }, 500);

  } catch (error) {
    console.error('[PTY] Error starting:', error);
    isStarting = false;
    if (mainWindow) {
      mainWindow.webContents.send('terminal-data', `\x1b[31mError: ${error.message}\x1b[0m\r\n`);
    }
  }
}

// IPC Handlers
ipcMain.handle('terminal-start', async () => {
  startClaude();
  return { success: true };
});

ipcMain.handle('terminal-write', async (event, data) => {
  console.log('[PTY] Write request, ptyProcess exists:', !!ptyProcess, 'data:', JSON.stringify(data));
  if (ptyProcess) {
    ptyProcess.write(data);
    return { success: true };
  }
  console.log('[PTY] No ptyProcess to write to!');
  return { success: false };
});

ipcMain.handle('terminal-resize', async (event, { cols, rows }) => {
  if (ptyProcess) {
    ptyProcess.resize(cols, rows);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('terminal-stop', async () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
  return { success: true };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // Check for updates (only in production)
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour disponible',
    message: `Version ${info.version} disponible. Télécharger maintenant ?`,
    buttons: ['Oui', 'Plus tard'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour prête',
    message: 'La mise à jour sera installée au redémarrage.',
    buttons: ['Redémarrer maintenant', 'Plus tard'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

app.on('window-all-closed', () => {
  if (ptyProcess) {
    ptyProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (ptyProcess) {
    ptyProcess.kill();
  }
});
