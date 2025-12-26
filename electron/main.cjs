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
      preload: app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.cjs')
        : path.join(__dirname, 'preload.cjs'),
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const appPath = app.getAppPath();
    mainWindow.loadFile(path.join(appPath, 'dist', 'index.html'));
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
    // Load node-pty from unpacked location in production
    let pty;
    if (app.isPackaged) {
      const ptyPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'node-pty');
      pty = require(ptyPath);
    } else {
      pty = require('node-pty');
    }
    console.log('[PTY] node-pty loaded successfully');

    // Use zsh with login shell to get proper PATH
    const shell = '/bin/zsh';
    const args = ['-l'];

    // Build PATH with common locations for homebrew and npm global binaries
    const homeDir = os.homedir();

    // Use seo-command-center project directory
    const cwd = path.join(homeDir, 'seo-command-center');
    console.log('[PTY] Spawning:', shell, args, 'in', cwd);
    const extraPaths = [
      '/opt/homebrew/bin',
      '/opt/homebrew/sbin',
      '/usr/local/bin',
      '/usr/local/sbin',
      `${homeDir}/.npm-global/bin`,
      `${homeDir}/.nvm/versions/node/*/bin`,
    ].join(':');

    const enhancedPath = `${extraPaths}:${process.env.PATH || '/usr/bin:/bin'}`;
    console.log('[PTY] Enhanced PATH includes homebrew locations');

    ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: cwd,
      env: {
        ...process.env,
        PATH: enhancedPath,
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
        console.log('[PTY] Sending claude command with permission mode');
        ptyProcess.write('claude --permission-mode bypassPermissions\r');
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
