import { type Message } from "@/components/chat/ChatMessage";
import type { GoalCascade } from "@/contexts/UserContext";

/**
 * Session type taxonomy:
 * - "clarity"       -> Clarity Session (onboarding, 9-turn structured)
 * - "morning_brief" -> Daily morning brief
 * - "weekly"        -> Weekly review session
 * - "import"        -> Data import processing session
 * - "chat"          -> General coaching conversation
 */
export type SessionType =
  | "clarity"
  | "morning_brief"
  | "weekly"
  | "import"
  | "chat";

export interface ChatSession {
  id: string;
  type: SessionType;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  personaId: string;
  workspaceId?: string;
  summary?: string;
  goalCascade?: GoalCascade;
}

/**
 * Workspace -- a user-created folder that organizes related chats.
 */
export interface Workspace {
  id: string;
  name: string;
  personaId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

export function isCoachingSession(session: ChatSession): boolean {
  return ["clarity", "morning_brief", "weekly"].includes(session.type);
}

export function isUnorganizedChat(session: ChatSession): boolean {
  return !isCoachingSession(session) && !session.workspaceId;
}

// ---------------------------------------------------------------------------
// Title generation
// ---------------------------------------------------------------------------

function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function generateSessionTitle(messages: Message[], type?: SessionType): string {
  if (type === "clarity") return "Clarity Session";
  if (type === "morning_brief") {
    const date = messages[0]?.timestamp;
    return date ? `Morning Brief \u2014 ${formatShortDate(date)}` : "Morning Brief";
  }
  if (type === "weekly") {
    const date = messages[0]?.timestamp;
    return date ? `Weekly Review \u2014 ${formatShortDate(date)}` : "Weekly Review";
  }
  if (type === "import") {
    const date = messages[0]?.timestamp;
    return date ? `Import \u2014 ${formatShortDate(date)}` : "Data Import";
  }

  // General chat: first user message, truncated
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    const text = firstUserMsg.content.trim();
    return text.length > 40 ? text.slice(0, 40) + "..." : text;
  }
  return "Chat";
}

// ---------------------------------------------------------------------------
// Type inference
// ---------------------------------------------------------------------------

const MORNING_BRIEF_PATTERNS = [
  "give me my morning brief",
  "morning brief",
];

const IMPORT_PATTERNS = [
  "import into my brain cloud",
  "data files to import",
  "process all of these records",
  "process these into my brain cloud",
];

export function inferSessionType(messages: Message[]): SessionType {
  const firstUserMsg = messages.find((m) => m.role === "user")?.content.toLowerCase() ?? "";

  if (MORNING_BRIEF_PATTERNS.some((p) => firstUserMsg.includes(p))) return "morning_brief";
  if (IMPORT_PATTERNS.some((p) => firstUserMsg.includes(p))) return "import";
  return "chat";
}

// ---------------------------------------------------------------------------
// Summary extraction
// ---------------------------------------------------------------------------

export function extractClaritySummary(messages: Message[]): string {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastAssistant) return "";

  const text = lastAssistant.content.replace(/\*\*/g, "").replace(/\n/g, " ").trim();
  return text.length > 120 ? text.slice(0, 120) + "..." : text;
}
