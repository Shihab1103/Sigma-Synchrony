// preload.js
// Runs in an isolated context with access to Node APIs, and exposes a
// safe, minimal bridge to the renderer (index.html / chalan.html / quotation.html).

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  /**
   * Triggers a native PDF save of the current page.
   * @param {Object} options
   * @param {string} [options.fileName]
   * @param {boolean} [options.landscape]
   * @param {string} [options.pageSize]
   * @param {boolean} [options.printBackground]
   * @returns {Promise<{success: boolean, filePath?: string, canceled?: boolean, error?: string}>}
   */
  savePDF: (options) => ipcRenderer.invoke('save-pdf-native', options)
});
