const { app, BrowserWindow, protocol } = require('electron');
const path = require('node:path');
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    });

    win.loadFile('/index.html');
};

app.whenReady().then(() => {
    // Fix file urls from what vite needs to what electron needs to request files
    protocol.interceptFileProtocol('file', (request, callback) => {
        callback({ path: path.join(__dirname, request.url.replace('file:///C:/', '')) })
    }, (err) => {
        if (err) console.error('Failed to register protocol')
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
if (require('electron-squirrel-startup')) app.quit();

// TODO: main.js's onbeforeunload prevents the game from closing
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});