import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { sendMessage, checkClaudeInstalled, type UserContext } from './claude';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Neurow',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Load the static export — assetPrefix: './' ensures relative paths work
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC Handlers ---

// Args are positional through IPC: prompt, sessionId (may be undefined), userContext
ipcMain.handle('send-message', async (_event, prompt: string, sessionId?: string, userContext?: UserContext) => {
  if (!mainWindow) throw new Error('No window');
  return sendMessage(mainWindow, prompt, sessionId, userContext);
});

ipcMain.handle('check-claude-installed', async () => {
  return checkClaudeInstalled();
});

// --- App Lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
