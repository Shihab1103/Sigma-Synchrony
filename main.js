// main.js
// Electron main process for Signmaging Counter (Windows desktop build)

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open external links (if any) in the system browser instead of a new Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPC handler: save-pdf-native
 * Renders the calling page's current content to a PDF buffer using
 * webContents.printToPDF(), then lets the user pick a save location
 * via the native Windows Save dialog.
 *
 * options (all optional):
 *   - fileName: string   suggested file name (without extension)
 *   - landscape: boolean
 *   - marginsType: 0 (default), 1 (none), 2 (minimum)
 *   - pageSize: 'A4' | 'Letter' | 'Legal' etc.
 *   - printBackground: boolean (default true, so colors/backgrounds print)
 */
ipcMain.handle('save-pdf-native', async (event, options = {}) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow) {
    return { success: false, error: 'No active window found.' };
  }

  const suggestedName = (options.fileName || 'document').replace(/[\\/:*?"<>|]/g, '_');

  try {
    const pdfOptions = {
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      pageSize: options.pageSize || 'A4',
      margins: {
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4
      },
      preferCSSPageSize: true
    };

    // Render the current page contents to a PDF buffer (native Chromium engine)
    const pdfBuffer = await senderWindow.webContents.printToPDF(pdfOptions);

    // Ask the user where to save it
    const { canceled, filePath } = await dialog.showSaveDialog(senderWindow, {
      title: 'Save PDF',
      defaultPath: path.join(app.getPath('documents'), `${suggestedName}.pdf`),
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, pdfBuffer);

    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
});

// Simple handler so renderer code can detect it's running inside Electron
ipcMain.handle('is-electron', () => true);
