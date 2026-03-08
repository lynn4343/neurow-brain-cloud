import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { sendMessage, sendMessageAPI, sendMessageOpenAI, checkClaudeInstalled, checkChatAvailable, cleanupMCPClient, type UserContext, type ChatAvailableResult } from './claude';
import { createProfileDirect, updateProfileDirect, getProfileDirect, exportDataDirect, type SupabaseConfig } from './supabase';

// Load .env from desktop/ root (no dotenv dependency needed)
// __dirname at runtime is electron-dist/, so ../ is desktop/
const envPath = path.join(__dirname, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Strip surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && value) process.env[key] = value;
    }
  }
}

let mainWindow: BrowserWindow | null = null;
let brainCloudWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Supabase direct access — infrastructure ops only (no AI model in the loop).
// Anon key is publishable by design (same as every Supabase web app).
// RLS disabled for hackathon; would govern access in production.
const supabaseConfig: SupabaseConfig = {
  url: 'https://ymmmpkmxaqpnkubmlkiw.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbW1wa214YXFwbmt1Ym1sa2l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTI0NDUsImV4cCI6MjA4ODA4ODQ0NX0.bHtkeA6P3kHrAc97Jtq3JO4bE5lCvtnZ0x10a6bzF4E',
  timeoutMs: 10_000,
};

// BYOK config — bridged from renderer localStorage via IPC.
// .env key takes precedence (BK-D-001).
interface BYOKConfig {
  provider: string;
  endpoint: string;
  apiKey: string;
  model: string;
}
let byokConfig: BYOKConfig | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1050,
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
// Route based on API key presence: ANTHROPIC_API_KEY → direct API, else → Claude CLI
ipcMain.handle('send-message', async (_event, prompt: string, sessionId?: string, userContext?: UserContext) => {
  if (!mainWindow) throw new Error('No window');

  // Priority: .env key > BYOK > CLI (BK-D-001)
  if (process.env.ANTHROPIC_API_KEY) {
    return sendMessageAPI(mainWindow, prompt, sessionId, userContext);
  }

  if (byokConfig?.apiKey) {
    if (byokConfig.provider === 'anthropic') {
      return sendMessageAPI(mainWindow, prompt, sessionId, userContext, {
        apiKey: byokConfig.apiKey,
        model: byokConfig.model,
      });
    }
    if (byokConfig.provider === 'nvidia' || byokConfig.provider === 'custom') {
      return sendMessageOpenAI(mainWindow, prompt, sessionId, userContext, {
        apiKey: byokConfig.apiKey,
        model: byokConfig.model,
        endpoint: byokConfig.endpoint,
      });
    }
    // Unknown provider with valid API key — log warning and fallback to CLI
    console.warn(`Unknown BYOK provider '${byokConfig.provider}', falling back to CLI`);
  }

  return sendMessage(mainWindow, prompt, sessionId, userContext);
});

ipcMain.handle('check-claude-installed', async () => {
  return checkClaudeInstalled();
});

ipcMain.handle('check-chat-available', async () => {
  return checkChatAvailable(byokConfig?.apiKey);
});

ipcMain.handle('set-byok-config', async (_event, config: BYOKConfig | null) => {
  // Store in memory (BK-D-004). Never log the key (BK-D-007).
  byokConfig = config?.apiKey ? config : null;
  // Return updated availability (BK-D-005)
  return checkChatAvailable(byokConfig?.apiKey);
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

ipcMain.handle('get-profile', (_event, userId: string) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  return getProfileDirect(supabaseConfig, userId);
});

ipcMain.handle('export-data', (_event, userId: string) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  return exportDataDirect(supabaseConfig, userId);
});

// --- Brain Cloud Standalone Window ---

function openBrainCloudWindow(slug?: string) {
  if (brainCloudWindow && !brainCloudWindow.isDestroyed()) {
    brainCloudWindow.focus();
    return;
  }

  brainCloudWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: 'Brain Cloud',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const encodedSlug = slug ? encodeURIComponent(slug) : '';
  const hash = encodedSlug ? `#user=${encodedSlug}` : '';

  if (isDev) {
    brainCloudWindow.loadURL(`http://localhost:3000/brain-cloud${hash}`);
  } else {
    brainCloudWindow.loadFile(
      path.join(__dirname, '../out/brain-cloud/index.html'),
      { hash: encodedSlug ? `user=${encodedSlug}` : undefined },
    );
  }

  brainCloudWindow.on('closed', () => {
    brainCloudWindow = null;
  });
}

ipcMain.handle('open-brain-cloud', (_event, slug?: string) => {
  openBrainCloudWindow(slug);
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('CommandOrControl+Shift+B', openBrainCloudWindow);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  cleanupMCPClient(); // fire-and-forget — process exits anyway
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
