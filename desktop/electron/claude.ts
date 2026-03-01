import { BrowserWindow } from 'electron';
import { spawn, execSync } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';

// --- Types (match claude.rs exactly) ---

interface ClaudeStreamMessage {
  type: string;
  subtype?: string;
  session_id?: string;
  message?: {
    role: string;
    content: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
  };
  cost_usd?: number;
  duration_ms?: number;
}

// --- Tool Activity Helpers (port of summarize_tool_use from claude.rs) ---

function summarizeToolUse(name: string, input?: Record<string, unknown>): string {
  switch (name) {
    case 'Read': {
      const filePath = input?.file_path as string | undefined;
      if (filePath) return `Reading ${path.basename(filePath)}`;
      return 'Reading file...';
    }
    case 'Edit':
    case 'Write': {
      const filePath = input?.file_path as string | undefined;
      if (filePath) return `Editing ${path.basename(filePath)}`;
      return 'Editing file...';
    }
    case 'Glob':
      return 'Searching files...';
    case 'Grep': {
      const pattern = input?.pattern as string | undefined;
      if (pattern) return `Searching for "${pattern}"`;
      return 'Searching code...';
    }
    case 'Bash': {
      const cmd = input?.command as string | undefined;
      if (cmd) {
        const short = cmd.length > 40 ? cmd.substring(0, 40) + '...' : cmd;
        return `Running: ${short}`;
      }
      return 'Running command...';
    }
    case 'Task':
      return 'Running subagent...';
    case 'WebSearch':
      return 'Searching the web...';
    case 'WebFetch':
      return 'Fetching web page...';
    default:
      if (name.startsWith('mcp__google-calendar__')) return 'Checking calendar...';
      if (name.startsWith('mcp__mem0__')) return 'Searching memory...';
      if (name.startsWith('mcp__google-docs__')) return 'Accessing Google Docs...';
      if (name.startsWith('mcp__firecrawl__')) return 'Fetching web content...';
      if (name.startsWith('mcp__supabase__')) return 'Querying database...';
      return `Using ${name}...`;
  }
}

// --- Auto-Context Loading (port of build_system_prompt from claude.rs) ---

function buildSystemPrompt(userDataPath: string): string {
  const parts: string[] = [];

  // Load user profile files if they exist in the data directory
  for (const filename of ['profile.md', 'preferences.md']) {
    const filePath = path.join(userDataPath, filename);
    if (existsSync(filePath)) {
      try {
        parts.push(readFileSync(filePath, 'utf-8'));
      } catch {
        // Skip if unreadable
      }
    }
  }

  const now = new Date();
  parts.push(`Current time: ${now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short'
  })}`);

  parts.push('You are Neurow, an AI coaching partner running inside Neurow Desktop. You help the user with productivity, decision-making, and personal growth through coaching conversations.');

  return parts.join('\n\n');
}

// --- Find Claude Binary (port of find_claude_binary from claude.rs) ---

function findClaudeBinary(): string {
  try {
    const result = execSync('which claude', { encoding: 'utf-8' }).trim();
    if (result) return result;
  } catch {
    // Not in PATH
  }

  const home = os.homedir();
  const candidates = [
    path.join(home, '.npm-global/bin/claude'),
    path.join(home, '.nvm/versions/node/default/bin/claude'),
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return 'claude';
}

// --- Main Function (port of send_message from claude.rs) ---

export function sendMessage(
  window: BrowserWindow,
  prompt: string,
  sessionId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // User data directory — configurable per user. Defaults to ~/Neurow.
    const userDataPath = process.env.NEUROW_DATA_DIR || path.join(os.homedir(), 'Neurow');
    const claudeBin = findClaudeBinary();

    const args: string[] = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--permission-mode', 'acceptEdits',
    ];

    if (sessionId) {
      args.push('--resume', sessionId);
    } else {
      const systemPrompt = buildSystemPrompt(userDataPath);
      if (systemPrompt) {
        args.push('--append-system-prompt', systemPrompt);
      }
    }

    const child = spawn(claudeBin, args, {
      cwd: userDataPath,
      // stdin MUST be 'ignore' — Claude CLI blocks on an open stdin pipe
      stdio: ['ignore', 'pipe', 'pipe'],
      env: (() => {
        const env = { ...process.env };
        // Remove Claude Code session vars so spawned CLI doesn't think it's nested
        delete env.CLAUDECODE;
        delete env.CLAUDE_CODE_ENTRYPOINT;
        // Ensure PATH includes common node/claude locations — Finder launches
        // have a minimal PATH that misses /usr/local/bin, npm global, etc.
        const extraPaths = [
          '/usr/local/bin',
          path.join(os.homedir(), '.npm-global/bin'),
          path.join(os.homedir(), '.local/bin'),
          '/opt/homebrew/bin',
        ];
        const currentPath = env.PATH || '/usr/bin:/bin';
        env.PATH = [...extraPaths, ...currentPath.split(':')].filter((v, i, a) => a.indexOf(v) === i).join(':');
        return env;
      })(),
    });

    let finalSessionId = sessionId || '';
    let lastContent = '';
    const seenToolIds = new Set<string>();

    const rl = createInterface({ input: child.stdout! });

    rl.on('line', (line: string) => {
      if (!line.trim()) return;

      let msg: ClaudeStreamMessage;
      try {
        msg = JSON.parse(line);
      } catch (e) {
        console.warn('Failed to parse NDJSON line:', e);
        return;
      }

      if (msg.session_id) {
        finalSessionId = msg.session_id;
      }

      switch (msg.type) {
        case 'system':
          break;

        case 'assistant': {
          if (!msg.message) break;

          for (const block of msg.message.content) {
            if (block.type === 'tool_use' && block.id) {
              if (!seenToolIds.has(block.id)) {
                seenToolIds.add(block.id);
                const toolName = block.name || 'unknown';
                const summary = summarizeToolUse(toolName, block.input as Record<string, unknown>);
                window.webContents.send('chat_activity', {
                  session_id: finalSessionId,
                  tool_name: toolName,
                  summary,
                });
              }
            }
          }

          const content = msg.message.content
            .filter((b: { type: string; text?: string }) => b.type === 'text' && b.text)
            .map((b: { text?: string }) => b.text!)
            .join('');

          const hasVisibleText = content.trim().length > 0;
          if (hasVisibleText && content !== lastContent) {
            lastContent = content;
            window.webContents.send('chat_stream', {
              session_id: finalSessionId,
              content,
              is_partial: true,
            });
          }
          break;
        }

        case 'result':
          window.webContents.send('chat_complete', {
            session_id: finalSessionId,
            cost_usd: msg.cost_usd || 0,
            duration_ms: msg.duration_ms || 0,
          });
          rl.close();
          break;
      }
    });

    if (child.stderr) {
      const errRl = createInterface({ input: child.stderr });
      errRl.on('line', (line: string) => {
        console.warn('claude stderr:', line);
      });
    }

    child.on('close', (code) => {
      if (finalSessionId) {
        resolve(finalSessionId);
      } else if (code !== 0) {
        reject(new Error('Claude process exited with error'));
      } else {
        resolve('');
      }
    });

    child.on('error', (err) => {
      window.webContents.send('chat_error', {
        session_id: finalSessionId,
        error: err.message,
      });
      reject(err);
    });
  });
}

// --- Check Claude Installed (port of check_claude_installed from claude.rs) ---

export async function checkClaudeInstalled(): Promise<boolean> {
  const bin = findClaudeBinary();
  if (bin !== 'claude') return true;
  try {
    execSync('which claude', { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}
