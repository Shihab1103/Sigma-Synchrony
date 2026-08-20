const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Loads your main entry file
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Native Windows PDF Generator Handler
ipcMain.handle('save-pdf-native', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const pdfData = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4'
  });

  const { filePath } = await dialog.showSaveDialog({
    title: 'Save PDF File',
    defaultPath: 'Document.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, pdfData);
    return true;
  }
  return false;
});
