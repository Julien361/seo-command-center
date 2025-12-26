const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const os = require('os');
const http = require('http');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = require('electron').app;

// Log all auto-updater events
autoUpdater.logger = {
  info: (msg) => console.log('[AutoUpdater]', msg),
  warn: (msg) => console.warn('[AutoUpdater]', msg),
  error: (msg) => console.error('[AutoUpdater]', msg),
};

let mainWindow;
let updateAvailable = null;
let updateDownloaded = false;
let isInstallingUpdate = false;
let ptyProcess = null;
let isStarting = false;
let oauthServer = null;

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

// Auto-updater IPC handlers
ipcMain.handle('updater-check', async () => {
  console.log('[AutoUpdater] Manual check requested');
  if (!app.isPackaged) {
    console.log('[AutoUpdater] Skipping check - not packaged');
    return { available: false, reason: 'dev-mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    console.log('[AutoUpdater] Check result:', result);
    return { available: !!result?.updateInfo, info: result?.updateInfo };
  } catch (error) {
    console.error('[AutoUpdater] Check error:', error);
    return { available: false, error: error.message };
  }
});

ipcMain.handle('updater-download', async () => {
  console.log('[AutoUpdater] Download requested');
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('[AutoUpdater] Download error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('updater-install', async () => {
  console.log('[AutoUpdater] Install requested');
  isInstallingUpdate = true;
  // Kill PTY process before quitting
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
  // Small delay to ensure PTY is fully closed
  setTimeout(() => {
    console.log('[AutoUpdater] Calling quitAndInstall...');
    autoUpdater.quitAndInstall(false, true);
  }, 500);
  return { success: true };
});

ipcMain.handle('updater-get-status', async () => {
  return {
    updateAvailable,
    currentVersion: app.getVersion(),
    isPackaged: app.isPackaged,
  };
});

// WordPress API proxy (bypasses CORS)
ipcMain.handle('wp-fetch', async (event, { url, options = {} }) => {
  console.log('[WP-Fetch] Request to:', url);
  try {
    // Node.js 18+ has native fetch
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'User-Agent': 'SEO-Command-Center/1.0',
      },
    });

    const data = await response.text();
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers,
      data,
    };
  } catch (error) {
    console.error('[WP-Fetch] Error:', error);
    return { ok: false, error: error.message };
  }
});

// Google OAuth handlers
ipcMain.handle('google-auth-start', async (event, authUrl) => {
  console.log('[OAuth] Starting Google auth flow');

  return new Promise((resolve, reject) => {
    // Start local server to capture OAuth callback
    if (oauthServer) {
      oauthServer.close();
    }

    oauthServer = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:8085');

      if (url.pathname === '/oauth/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        // Send response to browser
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (code) {
          res.end(`
            <html>
              <head><title>Connexion réussie</title></head>
              <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white;">
                <h1 style="color: #22c55e;">Connexion Google réussie !</h1>
                <p>Vous pouvez fermer cette fenêtre et retourner à l'application.</p>
                <script>window.close();</script>
              </body>
            </html>
          `);

          // Send code to renderer
          if (mainWindow) {
            mainWindow.webContents.send('google-auth-code', { code });
          }
          resolve({ success: true, code });
        } else {
          res.end(`
            <html>
              <head><title>Erreur</title></head>
              <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white;">
                <h1 style="color: #ef4444;">Erreur de connexion</h1>
                <p>${error || 'Une erreur est survenue'}</p>
              </body>
            </html>
          `);
          reject({ success: false, error: error || 'Unknown error' });
        }

        // Close server after response
        setTimeout(() => {
          if (oauthServer) {
            oauthServer.close();
            oauthServer = null;
          }
        }, 1000);
      }
    });

    oauthServer.listen(8085, () => {
      console.log('[OAuth] Server listening on port 8085');
      // Open browser with auth URL
      shell.openExternal(authUrl);
    });

    oauthServer.on('error', (err) => {
      console.error('[OAuth] Server error:', err);
      reject({ success: false, error: err.message });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      if (oauthServer) {
        oauthServer.close();
        oauthServer = null;
        reject({ success: false, error: 'Timeout' });
      }
    }, 300000);
  });
});

ipcMain.handle('google-auth-stop', async () => {
  if (oauthServer) {
    oauthServer.close();
    oauthServer = null;
  }
  return { success: true };
});

// App lifecycle
app.whenReady().then(() => {
  console.log('[App] Starting SEO Command Center v' + app.getVersion());
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
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Update available:', info.version);
  updateAvailable = info;
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', { status: 'available', info });
  }
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

autoUpdater.on('update-not-available', (info) => {
  console.log('[AutoUpdater] No update available, current version is latest');
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', { status: 'not-available', info });
  }
});

autoUpdater.on('download-progress', (progress) => {
  console.log('[AutoUpdater] Download progress:', Math.round(progress.percent) + '%');
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', { status: 'downloading', progress });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdater] Update downloaded:', info.version);
  updateDownloaded = true;
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', { status: 'downloaded', info });
  }
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour prête',
    message: `Version ${info.version} téléchargée. Redémarrer pour installer ?`,
    buttons: ['Redémarrer maintenant', 'Plus tard'],
  }).then((result) => {
    if (result.response === 0) {
      console.log('[AutoUpdater] User chose to restart now');
      isInstallingUpdate = true;
      // Kill PTY process before quitting
      if (ptyProcess) {
        ptyProcess.kill();
        ptyProcess = null;
      }
      // Small delay to ensure everything is cleaned up
      setTimeout(() => {
        console.log('[AutoUpdater] Calling quitAndInstall...');
        autoUpdater.quitAndInstall(false, true);
      }, 500);
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('[AutoUpdater] Error:', error);
  if (mainWindow) {
    mainWindow.webContents.send('updater-status', { status: 'error', error: error.message });
  }
});

app.on('window-all-closed', () => {
  if (ptyProcess) {
    ptyProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  console.log('[App] before-quit event, isInstallingUpdate:', isInstallingUpdate);
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
  // Don't interfere if we're already installing an update
  if (isInstallingUpdate) {
    console.log('[App] Update installation in progress, allowing quit');
    return;
  }
  // Force install update if downloaded but not yet installing
  if (updateDownloaded) {
    console.log('[AutoUpdater] Installing update before quit...');
    event.preventDefault();
    isInstallingUpdate = true;
    updateDownloaded = false; // Prevent infinite loop
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true);
    }, 100);
  }
});
