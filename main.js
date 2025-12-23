const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "GlyphForge",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // যদি অ্যাপটি বিল্ড করা থাকে তবে ফাইল লোড করবে, নাহলে লোকাল সার্ভার
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });