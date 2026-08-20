// Universal Print & PDF Handler for Signmaging Counter

function triggerPrint() {
  window.print();
}

async function saveDocumentAsPDF(elementId = 'printSheet', defaultFileName = 'Document.pdf') {
  // 1. Windows Desktop App (Electron Native PDF Export)
  if (typeof window !== 'undefined' && window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('save-pdf-native');
      return;
    } catch (e) {
      console.warn("Electron native PDF failed, falling back to browser dialog.", e);
    }
  }

  // 2. Android / Web Export via html2pdf
  const element = document.getElementById(elementId);
  if (element && typeof html2pdf !== 'undefined') {
    const options = {
      margin: 0,
      filename: defaultFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
  } else {
    // Standard system print dialog (includes native "Save as PDF")
    window.print();
  }
}

// Automatically override generatePDF() when the page loads
window.addEventListener('DOMContentLoaded', () => {
  window.generatePDF = function() {
    const cleanTitle = (document.title || 'Document').replace(/[^\w\s-]/gi, '_');
    saveDocumentAsPDF('printSheet', `${cleanTitle}.pdf`);
  };
});
