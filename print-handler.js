// System Print Dialog
function triggerPrint() {
  window.print();
}

// PDF Export Function
async function saveDocumentAsPDF(elementId, defaultFileName = 'Document.pdf') {
  // Check if running inside Electron (Windows)
  if (typeof window !== 'undefined' && window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('save-pdf-native');
      return;
    } catch (e) {
      console.warn("Electron native PDF failed, falling back to browser export.", e);
    }
  }

  // Fallback for Web/Android using html2pdf
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Print container element not found.");
    return;
  }

  const options = {
    margin: 8,
    filename: defaultFileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(options).from(element).save();
}
