import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { sendMessage, checkClaudeInstalled, type UserContext } from './claude';
import { createProfileDirect, updateProfileDirect, exportDataDirect, type SupabaseConfig } from './supabase';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Supabase direct access — infrastructure ops only (no AI model in the loop).
// Anon key is publishable by design (same as every Supabase web app).
// RLS disabled for hackathon; would govern access in production.
const supabaseConfig: SupabaseConfig = {
  url: 'https://ymmmpkmxaqpnkubmlkiw.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbW1wa214YXFwbmt1Ym1sa2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTI0NDUsImV4cCI6MjA4ODA4ODQ0NX0.bHtkeA6P3kHrAc97Jtq3JO4bE5lCvtnZ0x10a6bzF4E',
  timeoutMs: 10_000,
};

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

// --- Direct Data API (model-agnostic, no AI in the loop) ---

ipcMain.handle('create-profile', (_event, displayName: string) => {
  if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
    throw new Error('displayName is required and must be a non-empty string');
  }
  return createProfileDirect(supabaseConfig, displayName.trim());
});

ipcMain.handle('update-profile', (_event, userId: string, profileData: Record<string, unknown>) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  if (!profileData || typeof profileData !== 'object') {
    throw new Error('profileData is required and must be an object');
  }
  return updateProfileDirect(supabaseConfig, userId, profileData);
});

ipcMain.handle('export-data', (_event, userId: string) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  return exportDataDirect(supabaseConfig, userId);
});

// --- App Lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
