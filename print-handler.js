/**
 * print-handler.js
 *
 * Universal print / "Save as PDF" handler shared by index.html, chalan.html
 * and quotation.html.
 *
 * - Inside Electron (Windows desktop build): uses the native
 *   webContents.printToPDF() pipeline via the `save-pdf-native` IPC handler
 *   exposed through preload.js as window.electronAPI.savePDF().
 * - Inside a normal browser or Capacitor/Android WebView: falls back to
 *   window.print() for printing, and to html2pdf.js for "Save as PDF"
 *   (since there is no native OS save dialog available there).
 *
 * Include this file with:
 *   <script src="print-handler.js"></script>
 * AFTER html2pdf.js (CDN) has been included, and after the page content
 * (or at least the printable container) exists in the DOM.
 */

(function (window, document) {
  'use strict';

  var PrintHandler = {
    /**
     * Detects whether we are running inside the Electron shell.
     * preload.js exposes window.electronAPI only inside Electron.
     */
    isElectron: function () {
      return !!(window.electronAPI && window.electronAPI.isElectron);
    },

    /**
     * Resolves the DOM element that should be treated as the printable
     * document. Looks for an element with id="printArea" or
     * data-print-area, and falls back to document.body.
     */
    getPrintElement: function () {
      return (
        document.getElementById('printArea') ||
        document.querySelector('[data-print-area]') ||
        document.body
      );
    },

    /**
     * Builds a sensible default file name from the page, e.g.
     * "Chalan-2026-08-20" or "Quotation-2026-08-20".
     */
    getDefaultFileName: function () {
      var explicit = document.body.getAttribute('data-doc-name');
      var base = explicit || document.title || 'Document';
      base = base.replace(/[\\/:*?"<>|]/g, '').trim().replace(/\s+/g, '-');

      var now = new Date();
      var pad = function (n) {
        return String(n).padStart(2, '0');
      };
      var dateStr =
        now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

      return base + '-' + dateStr;
    },

    /**
     * PRINT
     * Electron and browsers both support window.print(); Electron's
     * Chromium engine renders the same @media print CSS rules, so a single
     * code path covers desktop, browser, and Android/Capacitor (which also
     * supports window.print() through the system WebView on modern Android).
     */
    printDocument: function () {
      window.print();
    },

    /**
     * SAVE AS PDF
     * Routes to the native Electron pipeline when available; otherwise
     * falls back to html2pdf.js (browser/Android), and finally to
     * window.print() if neither is available.
     */
    saveAsPDF: function (options) {
      options = options || {};
      var fileName = options.fileName || PrintHandler.getDefaultFileName();

      if (PrintHandler.isElectron()) {
        return PrintHandler._saveAsPDFElectron(fileName, options);
      }
      return PrintHandler._saveAsPDFWeb(fileName, options);
    },

    _saveAsPDFElectron: function (fileName, options) {
      PrintHandler._setBusy(true);
      return window.electronAPI
        .savePDF({
          fileName: fileName,
          landscape: options.landscape || false,
          pageSize: options.pageSize || 'A4',
          printBackground: options.printBackground !== false
        })
        .then(function (result) {
          PrintHandler._setBusy(false);
          if (result && result.success) {
            PrintHandler._notify('Saved: ' + result.filePath);
          } else if (result && result.canceled) {
            // user cancelled the save dialog, nothing to do
          } else {
            PrintHandler._notify(
              'Could not save PDF: ' + (result && result.error ? result.error : 'Unknown error'),
              true
            );
          }
          return result;
        })
        .catch(function (err) {
          PrintHandler._setBusy(false);
          PrintHandler._notify('Could not save PDF: ' + err.message, true);
          throw err;
        });
    },

    _saveAsPDFWeb: function (fileName, options) {
      var element = PrintHandler.getPrintElement();

      if (typeof window.html2pdf === 'function') {
        PrintHandler._setBusy(true);
        var opt = {
          margin: 10,
          filename: fileName + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: {
            unit: 'mm',
            format: (options.pageSize || 'a4').toLowerCase(),
            orientation: options.landscape ? 'landscape' : 'portrait'
          }
        };

        return window
          .html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(function () {
            PrintHandler._setBusy(false);
          })
          .catch(function (err) {
            PrintHandler._setBusy(false);
            PrintHandler._notify('Could not generate PDF: ' + err.message, true);
            // last-resort fallback
            window.print();
          });
      }

      // No html2pdf.js available at all — fall back to the browser/OS print
      // dialog, where the user can choose "Save as PDF" as the destination.
      window.print();
      return Promise.resolve();
    },

    _setBusy: function (isBusy) {
      var buttons = document.querySelectorAll('[data-action="save-pdf"], [data-action="print"]');
      buttons.forEach(function (btn) {
        btn.disabled = isBusy;
        btn.classList.toggle('is-busy', isBusy);
      });
      document.body.classList.toggle('pdf-busy', isBusy);
    },

    _notify: function (message, isError) {
      // Minimal, dependency-free feedback. Replace with a toast/snackbar
      // if the project already has one.
      if (isError) {
        console.error('[print-handler]', message);
        window.alert(message);
      } else {
        console.log('[print-handler]', message);
      }
    },

    /**
     * Wires up any element carrying data-action="print" or
     * data-action="save-pdf" so pages don't need inline onclick handlers.
     */
    init: function () {
      document.addEventListener('click', function (event) {
        var printBtn = event.target.closest('[data-action="print"]');
        if (printBtn) {
          event.preventDefault();
          PrintHandler.printDocument();
          return;
        }

        var pdfBtn = event.target.closest('[data-action="save-pdf"]');
        if (pdfBtn) {
          event.preventDefault();
          PrintHandler.saveAsPDF({
            fileName: pdfBtn.getAttribute('data-filename') || undefined
          });
        }
      });
    }
  };

  window.PrintHandler = PrintHandler;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PrintHandler.init);
  } else {
    PrintHandler.init();
  }
})(window, document);
