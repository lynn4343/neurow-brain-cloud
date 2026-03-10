/**
 * Per-user static demo data for hackathon.
 *
 * Keyed by user slug ("theo", etc.) with "default" fallback for new users.
 * Production path: replace with live Brain Cloud queries via MCP.
 *
 * Decisions: W5-1A-D-004 (tasks), D-005 (targets), D-006 (notes), D-007 (architecture)
 */

import type { ChatSession, Workspace } from "@/types/sessions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Priority = "Urgent" | "High" | "Medium" | "Low" | "None";

// Life Insights Dashboard types
export type DomainDirection = "growth" | "steady" | "needs_attention" | "baseline";

export interface DomainHealth {
  id: string;
  name: string;
  icon: string;
  direction: DomainDirection;
  observation: string;
}

export interface Milestone {
  text: string;
  completed: boolean;
}

export interface QuarterlyGoal {
  id: string;
  title: string;
  why: string;
  milestones: Milestone[];
  nextMilestone: string;
  nextMilestoneDue: string;
  celebration: string | null;
}

export interface PulseMetricData {
  value: number | null; // null = no data yet (shows "—")
  trend: number;
  unit: string;
  isPercentage?: boolean;
}

export interface PulseMetrics {
  coachingStreak: PulseMetricData;
  top3Completion: PulseMetricData;
  sessionsThisWeek: PulseMetricData;
  winsCaptured: PulseMetricData;
}

export interface InsightData {
  type: "insight" | "welcome";
  text: string;
  domains?: string[];
  lastUpdated?: string;
}

export interface Task {
  name: string;
  priority: Priority;
  due: string;
  project: string;
}

export interface TopPriority extends Task {
  timeEstimate?: string; // "~2 hrs", "~45 min"
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  content: string;
  tags: string[];
  date: string;
  source: "coaching" | "reflection" | "capture";
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // "2026-03-09" ISO date
  startTime: string; // "11:30" 24h format for positioning
  endTime: string; // "12:15" 24h format
  durationMin: number; // for block height calc
  category: string; // "Freelance" | "Personal" | "Admin" | "Learning" | "Coaching" | "Work" | "Social"
  location?: string;
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

export const PROJECT_COLORS: Record<string, string> = {
  Freelance: "bg-blue-100 text-blue-700 border-blue-200",
  Admin: "bg-teal-100 text-teal-700 border-teal-200",
  Learning: "bg-purple-100 text-purple-700 border-purple-200",
  Personal: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Getting Started": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Priority Goal": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Home: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const DEFAULT_PROJECT_COLOR =
  "bg-gray-100 text-gray-700 border-gray-200";

export const TAG_COLORS: Record<string, string> = {
  reflection: "bg-purple-100 text-purple-700",
  weekly: "bg-blue-100 text-blue-700",
  growth: "bg-emerald-100 text-emerald-700",
  patterns: "bg-teal-100 text-teal-700",
  freelance: "bg-amber-100 text-amber-700",
  debrief: "bg-orange-100 text-orange-700",
  health: "bg-rose-100 text-rose-700",
  routine: "bg-pink-100 text-pink-700",
  personal: "bg-indigo-100 text-indigo-700",
  vision: "bg-cyan-100 text-cyan-700",
};

export const SOURCE_LABELS: Record<Note["source"], string> = {
  coaching: "From coaching session",
  reflection: "Personal reflection",
  capture: "Quick capture",
};

export const EVENT_CATEGORY_COLORS: Record<string, {
  bg: string;
  accent: string;
  text: string;
  hover: string;
  dot: string;
}> = {
  Freelance: { bg: "bg-blue-50",    accent: "border-l-blue-500",    text: "text-blue-900",    hover: "hover:bg-blue-100",   dot: "bg-blue-500" },
  Admin:     { bg: "bg-teal-50",    accent: "border-l-teal-500",    text: "text-teal-900",    hover: "hover:bg-teal-100",   dot: "bg-teal-500" },
  Learning:  { bg: "bg-purple-50",  accent: "border-l-purple-500",  text: "text-purple-900",  hover: "hover:bg-purple-100", dot: "bg-purple-500" },
  Personal:  { bg: "bg-amber-50",   accent: "border-l-amber-500",   text: "text-amber-900",   hover: "hover:bg-amber-100",  dot: "bg-amber-500" },
  Coaching:  { bg: "bg-rose-50",    accent: "border-l-rose-500",    text: "text-rose-900",    hover: "hover:bg-rose-100",   dot: "bg-rose-500" },
  Work:      { bg: "bg-gray-50",    accent: "border-l-gray-500",    text: "text-gray-900",    hover: "hover:bg-gray-100",   dot: "bg-gray-500" },
  Social:    { bg: "bg-indigo-50",  accent: "border-l-indigo-500",  text: "text-indigo-900",  hover: "hover:bg-indigo-100", dot: "bg-indigo-500" },
};

export const DEFAULT_EVENT_COLOR = {
  bg: "bg-gray-50", accent: "border-l-gray-400", text: "text-gray-800", hover: "hover:bg-gray-100", dot: "bg-gray-400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up per-user data with "default" fallback. */
export function getUserData<T>(
  data: Record<string, T>,
  slug: string | undefined,
): T {
  const result = data[slug ?? "default"] ?? data["default"];
  if (result === undefined) {
    throw new Error(`No data found for slug "${slug}" and no default fallback`);
  }
  return result;
}

/** Today's date as ISO string (YYYY-MM-DD) for dynamic demo events. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's date formatted for notes (e.g. "Mar 6, 2026"). */
export function todayFormatted(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Tasks (D-004)
// ---------------------------------------------------------------------------

export const TASKS: Record<string, Task[]> = {
  theo: [
    { name: "Reply to referral email from Jake", priority: "High", due: "Today", project: "Freelance" },
    { name: "Water the plants", priority: "Medium", due: "Today", project: "Home" },
    { name: "Download Module 4 project files", priority: "Medium", due: "Mar 10", project: "Learning" },
    { name: "Pick up skateboard grip tape", priority: "Low", due: "Mar 10", project: "Personal" },
    { name: "Update portfolio site with new case study", priority: "Medium", due: "Mar 12", project: "Freelance" },
    { name: "Renew Adobe CC subscription", priority: "Low", due: "Mar 14", project: "Admin" },
  ],
  default: [
    { name: "Set your top 3 priorities", priority: "High", due: "Today", project: "Getting Started" },
    { name: "Try a coaching check-in in Chat", priority: "Medium", due: "Today", project: "Getting Started" },
    { name: "Set your weekly targets", priority: "Low", due: "Today", project: "Getting Started" },
  ],
};

// ---------------------------------------------------------------------------
// Top 3 Priorities
// ---------------------------------------------------------------------------

export const TOP_PRIORITIES: Record<string, TopPriority[]> = {
  theo: [
    { name: "Send Meridian brand guide revisions", priority: "High", due: "Mar 12", project: "Freelance", timeEstimate: "2 hrs" },
    { name: "Prep questions for discovery call", priority: "High", due: "Today", project: "Freelance", timeEstimate: "45 min" },
    { name: "Send invoice follow-up — StartupCo", priority: "High", due: "Today", project: "Admin", timeEstimate: "20 min" },
  ],
  default: [],
};

// ---------------------------------------------------------------------------
// Weekly / Monthly Targets (D-005)
// ---------------------------------------------------------------------------

export const WEEKLY_TARGETS: Record<string, string[]> = {
  theo: [
    "+1 $100/hr quote",
    "SoM Mod 4",
    "Follow up invoices",
  ],
  default: [],
};

export const MONTHLY_TARGETS: Record<string, string[]> = {
  theo: [
    "Land 3rd project",
    "SoM thru Mod 6",
    "Extra CC payment",
  ],
  default: [],
};

// ---------------------------------------------------------------------------
// Notes (D-006)
// ---------------------------------------------------------------------------

export const NOTES: Record<string, Note[]> = {
  theo: [
    {
      id: "1",
      title: "Weekly intentions \u2014 Mar 3",
      preview:
        "This week I want to focus on three things: finish the Meridian brand guide revisions...",
      content: `This week I want to focus on three things:

1. **Finish the Meridian brand guide revisions** \u2014 the client presentation is Thursday. Stop second-guessing the color palette. Pick one and commit. The longer I tweak, the less confident I look.

2. **No new projects until the invoice backlog is clear** \u2014 I have three outstanding invoices from January. That\u2019s $2,400 sitting in other people\u2019s pockets. Send the follow-ups Monday morning.

3. **One hour of motion design practice every day** \u2014 not "when I have time." Blocked on the calendar. This is how freelance becomes full-time. Skills compound.

The theme this week is *finish things*. I have too many 80%-done projects. None of them are paying me until they\u2019re 100%.`,
      tags: ["reflection", "weekly"],
      date: "Mar 3, 2026",
      source: "coaching",
    },
    {
      id: "2",
      title: "Client debrief \u2014 Meridian",
      preview:
        "Just wrapped the discovery call with Meridian. Three things I noticed about how...",
      content: `Just wrapped the discovery call with Meridian. Three things I noticed about how I showed up:

**What worked:**
- Asked "what feeling do you want someone to have when they see your brand?" instead of jumping to fonts and colors
- Showed my portfolio on the iPad instead of just sending a link \u2014 they could see me walk through the thinking
- Named my price without apologizing. First time. Heart was pounding but I just said the number and stopped talking.

**What didn\u2019t:**
- Got nervous and started talking too fast when they asked about timeline
- Forgot to ask about their budget range before quoting \u2014 got lucky it aligned
- Didn\u2019t bring a printed leave-behind. Would have been more professional.

**Insight from Neurow:** I tend to over-prepare on the creative side and under-prepare on the business side. The design thinking is strong. The client management needs reps.

**Next:** Build a standard discovery call checklist so I don\u2019t have to wing the business parts.`,
      tags: ["freelance", "debrief"],
      date: "Feb 25, 2026",
      source: "coaching",
    },
    {
      id: "3",
      title: "ADHD focus experiments",
      preview:
        "Tracked my focus blocks for two weeks. The data is pretty clear: I do my best design work...",
      content: `Tracked my focus blocks for two weeks. The data is pretty clear: I do my best design work between 10 AM - 1 PM, but only if I don\u2019t start with email or social media.

**What\u2019s working:**
- Body doubling at the coffee shop \u2014 even when I\u2019m not on shift, being around people helps
- The "ugly first draft" rule \u2014 giving myself permission to make bad designs for 15 minutes breaks the perfectionism freeze
- Music without lyrics. Finally accepted this about myself.

**What\u2019s not working:**
- Trying to do client work and personal projects in the same block \u2014 context switching kills me
- Phone on the desk. Period. It goes in the backpack now.
- Skipping lunch and trying to push through \u2014 I crash at 2 PM every time

**Adjustment:** Morning = coffee shop + client work (billable hours). Afternoon = home + learning/personal projects. Phone in backpack until first focus block is done. Eat lunch at actual lunchtime.`,
      tags: ["health", "routine"],
      date: "Feb 21, 2026",
      source: "reflection",
    },
    {
      id: "4",
      title: "The pricing pattern",
      preview:
        "Neurow flagged something today that I already knew but keep ignoring: I underprice every project...",
      content: `Neurow flagged something today that I already knew but keep ignoring: I underprice every single project, then resent the work halfway through.

**The pattern:**
- Client asks for a quote \u2192 I lowball because I\u2019m afraid they\u2019ll say no
- I get the project \u2192 I scope-creep myself adding extras they didn\u2019t ask for
- I finish exhausted \u2192 I calculate my hourly rate and it\u2019s under $15

Neurow pulled this across my last four client projects. Same pattern every time. The *fear of losing the client* costs me more than losing the client would.

**What\u2019s underneath:** I don\u2019t actually believe my work is worth what the market says it is. The portfolio says $75/hr. My gut says "but what if they find someone cheaper?"

**The commitment:** Next proposal goes out at full rate. No discount. No "first project special." If they say no, that\u2019s data \u2014 not rejection.`,
      tags: ["growth", "patterns"],
      date: "Feb 17, 2026",
      source: "coaching",
    },
    {
      id: "5",
      title: "What I actually want",
      preview:
        "Came up in tonight\u2019s session and I want to hold onto it before the feeling fades...",
      content: `Came up in tonight\u2019s session and I want to hold onto it before the feeling fades.

I keep saying I want to "make freelancing full-time" but what I actually want is something bigger than that. I want to build a design practice that people seek out. Not just "Theo does logos." I want to be the person small businesses in Austin call when they want their brand to feel like *them*.

The barista job isn\u2019t the problem. The problem is I\u2019ve been treating freelance like a side hustle with main-character energy. Half-committing. Taking any project that pays. Not building toward anything specific.

What would it look like to actually take this seriously? A real portfolio site, not a Notion page. A niche \u2014 maybe restaurants and cafes, since that\u2019s where all my best work is. Raising my rate to $75/hr and only taking projects I\u2019m proud of. Saying no to the $200 logo jobs that eat my week.

Neurow asked me: "What would you do if you weren\u2019t afraid of it not working?" And the answer is exactly this. Go all in. Specialize. Charge what I\u2019m worth. Build something real.

Scary. But I think that\u2019s the point.`,
      tags: ["personal", "vision"],
      date: "Feb 13, 2026",
      source: "coaching",
    },
  ],
  default: [
    {
      id: "new-1",
      title: "Welcome to Neurow",
      preview:
        "Neurow is your personal coaching system — an AI that learns from your life, connects patterns...",
      content: `Neurow is your personal coaching system — an AI that learns from your life, connects patterns across domains, and helps you make better decisions.

**Your Brain Cloud** is where your knowledge lives. Every coaching session, note, and insight gets stored in your personal knowledge graph. It's yours — you can export it anytime, and it works with any AI provider.

**Getting started:**
- Chat with Neurow to start your first coaching session
- Set your priorities and weekly targets on the Day Map
- Import data from other AI tools to give Neurow more context

The more context Neurow has, the better it coaches. Start with what matters most to you right now.`,
      tags: ["personal"],
      date: todayFormatted(),
      source: "coaching" as const,
    },
    {
      id: "new-2",
      title: "How coaching works",
      preview:
        "Neurow coaching is different from a chatbot. It remembers. Every conversation builds on the last one...",
      content: `Neurow coaching is different from a chatbot. It remembers.

Every conversation builds on the last one. When you share a goal, a frustration, or a win — Neurow stores it in your Brain Cloud and connects it to everything else it knows about you.

**What to expect:**
- Neurow will ask you questions, not just give answers
- It tracks your patterns over time — what you commit to, what you follow through on, where you get stuck
- It surfaces connections you might miss — like how a work habit affects a personal goal

**Tips:**
- Be honest. Coaching works best when you share what's actually happening, not what you think you should say.
- Check in regularly. Even a 5-minute daily check-in compounds over weeks.
- Use the Day Map to track your priorities. Neurow will reference them in coaching sessions.`,
      tags: ["personal"],
      date: todayFormatted(),
      source: "coaching" as const,
    },
  ],
};

// ---------------------------------------------------------------------------
// Calendar Events (D-002)
// ---------------------------------------------------------------------------

export const CALENDAR_EVENTS: Record<string, CalendarEvent[]> = {
  theo: [
    // --- Demo week: Mar 8-14 ---

    // Sun Mar 8
    { id: "e01", title: "Weekly review + reflect session", date: "2026-03-08", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e02", title: "Skate session \u2014 East Austin", date: "2026-03-08", startTime: "16:00", endTime: "17:30", durationMin: 90, category: "Personal" },

    // Mon Mar 9 (demo day — first event at 11:30 AM)
    { id: "e03", title: "Discovery call \u2014 new client lead", date: "2026-03-09", startTime: "11:30", endTime: "12:15", durationMin: 45, category: "Freelance", location: "Zoom" },
    { id: "e04", title: "Lunch with Dev", date: "2026-03-09", startTime: "13:00", endTime: "14:00", durationMin: 60, category: "Personal" },
    { id: "e05", title: "Admin block \u2014 invoicing + follow-ups", date: "2026-03-09", startTime: "14:30", endTime: "16:00", durationMin: 90, category: "Admin" },
    { id: "e06", title: "School of Motion Module 4", date: "2026-03-09", startTime: "16:30", endTime: "18:00", durationMin: 90, category: "Learning", location: "Home studio" },
    { id: "e07", title: "Jog \u2014 Town Lake", date: "2026-03-09", startTime: "18:30", endTime: "19:15", durationMin: 45, category: "Personal" },

    // Tue Mar 10
    { id: "e08", title: "Cafe Rowan shift", date: "2026-03-10", startTime: "07:00", endTime: "12:00", durationMin: 300, category: "Work" },
    { id: "e09", title: "Meridian \u2014 brand guide revisions", date: "2026-03-10", startTime: "14:00", endTime: "16:00", durationMin: 120, category: "Freelance" },
    { id: "e10", title: "Jog \u2014 Town Lake", date: "2026-03-10", startTime: "18:00", endTime: "18:45", durationMin: 45, category: "Personal" },

    // Wed Mar 11
    { id: "e11", title: "Portfolio shoot \u2014 case study photos", date: "2026-03-11", startTime: "10:00", endTime: "12:00", durationMin: 120, category: "Freelance" },
    { id: "e57", title: "Admin block \u2014 invoicing + follow-ups", date: "2026-03-11", startTime: "14:00", endTime: "15:30", durationMin: 90, category: "Admin" },
    { id: "e12", title: "School of Motion Module 4 exercises", date: "2026-03-11", startTime: "19:00", endTime: "20:30", durationMin: 90, category: "Learning" },

    // Thu Mar 12
    { id: "e13", title: "Coaching session", date: "2026-03-12", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e14", title: "Meridian \u2014 client presentation (Round 2)", date: "2026-03-12", startTime: "14:00", endTime: "15:00", durationMin: 60, category: "Freelance" },

    { id: "e58", title: "Admin block \u2014 send invoices", date: "2026-03-12", startTime: "16:00", endTime: "17:00", durationMin: 60, category: "Admin" },

    // Fri Mar 13
    { id: "e15", title: "Lunch \u2014 Austin Creatives meetup", date: "2026-03-13", startTime: "12:00", endTime: "13:30", durationMin: 90, category: "Social" },
    { id: "e16", title: "Jog \u2014 Town Lake", date: "2026-03-13", startTime: "18:30", endTime: "19:15", durationMin: 45, category: "Personal" },

    // Sat Mar 14
    { id: "e17", title: "Cafe Rowan shift", date: "2026-03-14", startTime: "08:00", endTime: "13:00", durationMin: 300, category: "Work" },
    { id: "e18", title: "Figma + Blender learning session", date: "2026-03-14", startTime: "15:00", endTime: "17:00", durationMin: 120, category: "Learning" },

    // --- Rest of coaching month (3-5 events per week, speckled) ---

    // Week of Feb 9-15
    { id: "e19", title: "Coaching session", date: "2026-02-12", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e20", title: "Client onboarding call", date: "2026-02-10", startTime: "14:00", endTime: "14:45", durationMin: 45, category: "Freelance", location: "Zoom" },
    { id: "e21", title: "Cafe Rowan shift", date: "2026-02-11", startTime: "07:00", endTime: "13:00", durationMin: 360, category: "Work" },
    { id: "e22", title: "School of Motion Module 1", date: "2026-02-12", startTime: "19:00", endTime: "21:00", durationMin: 120, category: "Learning" },

    // Week of Feb 16-22
    { id: "e23", title: "Admin block \u2014 invoicing", date: "2026-02-17", startTime: "14:00", endTime: "15:30", durationMin: 90, category: "Admin" },
    { id: "e24", title: "Coaching session", date: "2026-02-19", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e25", title: "School of Motion Module 2", date: "2026-02-18", startTime: "19:00", endTime: "21:00", durationMin: 120, category: "Learning" },
    { id: "e26", title: "Skate session \u2014 East Austin", date: "2026-02-22", startTime: "15:00", endTime: "16:30", durationMin: 90, category: "Personal" },

    // Week of Feb 23-Mar 1
    { id: "e27", title: "Discovery call \u2014 Meridian", date: "2026-02-24", startTime: "11:00", endTime: "11:45", durationMin: 45, category: "Freelance", location: "Zoom" },
    { id: "e28", title: "Coaching session", date: "2026-02-26", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e29", title: "Cafe Rowan shift", date: "2026-02-28", startTime: "08:00", endTime: "14:00", durationMin: 360, category: "Work" },
    { id: "e30", title: "School of Motion Module 3", date: "2026-02-25", startTime: "19:00", endTime: "21:00", durationMin: 120, category: "Learning" },
    { id: "e31", title: "Jog \u2014 Town Lake", date: "2026-02-23", startTime: "18:00", endTime: "18:45", durationMin: 45, category: "Personal" },

    // Week of Mar 1-7
    { id: "e32", title: "Meridian \u2014 brand concepts review", date: "2026-03-03", startTime: "14:00", endTime: "15:30", durationMin: 90, category: "Freelance", location: "Zoom" },
    { id: "e33", title: "Admin block \u2014 taxes + bookkeeping", date: "2026-03-02", startTime: "14:00", endTime: "16:00", durationMin: 120, category: "Admin" },
    { id: "e34", title: "Coaching session", date: "2026-03-05", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e35", title: "School of Motion Module 3 exercises", date: "2026-03-04", startTime: "19:00", endTime: "20:30", durationMin: 90, category: "Learning" },
    { id: "e36", title: "Lunch \u2014 Austin Creatives meetup", date: "2026-03-01", startTime: "12:00", endTime: "13:30", durationMin: 90, category: "Social" },
    { id: "e37", title: "Monthly review session", date: "2026-03-07", startTime: "10:00", endTime: "11:30", durationMin: 90, category: "Coaching" },

    // Week of Mar 15-21
    { id: "e38", title: "Cafe Rowan shift", date: "2026-03-15", startTime: "07:00", endTime: "12:00", durationMin: 300, category: "Work" },
    { id: "e39", title: "Meridian — final deliverables", date: "2026-03-16", startTime: "10:00", endTime: "12:30", durationMin: 150, category: "Freelance" },
    { id: "e40", title: "Admin block — invoicing", date: "2026-03-16", startTime: "14:00", endTime: "15:30", durationMin: 90, category: "Admin" },
    { id: "e41", title: "Jog — Town Lake", date: "2026-03-17", startTime: "18:00", endTime: "18:45", durationMin: 45, category: "Personal" },
    { id: "e42", title: "School of Motion Module 5", date: "2026-03-18", startTime: "19:00", endTime: "21:00", durationMin: 120, category: "Learning" },
    { id: "e43", title: "Coaching session", date: "2026-03-19", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e44", title: "New client intro — Varo Studio", date: "2026-03-19", startTime: "14:00", endTime: "14:45", durationMin: 45, category: "Freelance", location: "Zoom" },
    { id: "e45", title: "Skate session — East Austin", date: "2026-03-21", startTime: "15:00", endTime: "16:30", durationMin: 90, category: "Personal" },

    // Week of Mar 22-28
    { id: "e46", title: "Varo Studio — brand discovery workshop", date: "2026-03-23", startTime: "10:00", endTime: "12:00", durationMin: 120, category: "Freelance", location: "Their studio" },
    { id: "e47", title: "Cafe Rowan shift", date: "2026-03-24", startTime: "07:00", endTime: "12:00", durationMin: 300, category: "Work" },
    { id: "e48", title: "School of Motion Module 5 exercises", date: "2026-03-25", startTime: "19:00", endTime: "20:30", durationMin: 90, category: "Learning" },
    { id: "e49", title: "Coaching session", date: "2026-03-26", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e50", title: "Jog — Town Lake", date: "2026-03-26", startTime: "18:30", endTime: "19:15", durationMin: 45, category: "Personal" },
    { id: "e51", title: "Lunch — Dev + Jake", date: "2026-03-27", startTime: "12:00", endTime: "13:00", durationMin: 60, category: "Social" },
    { id: "e52", title: "Cafe Rowan shift", date: "2026-03-28", startTime: "08:00", endTime: "13:00", durationMin: 300, category: "Work" },

    // Week of Mar 29-31
    { id: "e53", title: "Varo Studio — mood boards review", date: "2026-03-30", startTime: "14:00", endTime: "15:30", durationMin: 90, category: "Freelance", location: "Zoom" },
    { id: "e54", title: "School of Motion Module 6", date: "2026-03-30", startTime: "19:00", endTime: "21:00", durationMin: 120, category: "Learning" },
    { id: "e55", title: "Admin block — quarterly bookkeeping", date: "2026-03-31", startTime: "10:00", endTime: "12:00", durationMin: 120, category: "Admin" },
    { id: "e56", title: "Jog — Town Lake", date: "2026-03-31", startTime: "18:00", endTime: "18:45", durationMin: 45, category: "Personal" },
  ],
  default: [
    { id: "new-e01", title: "Welcome coaching session", date: todayISO(), startTime: "10:00", endTime: "10:30", durationMin: 30, category: "Coaching" },
  ],
};

// ---------------------------------------------------------------------------
// Workspaces (W5-4B)
// ---------------------------------------------------------------------------

export const WORKSPACES: Record<string, Workspace[]> = {
  theo: [
    { id: "ws-theo-business",      name: "Business",      personaId: "theo", createdAt: "2026-02-10T10:00:00-06:00" },
    { id: "ws-theo-freelance",     name: "Freelance",     personaId: "theo", createdAt: "2026-02-10T10:00:00-06:00" },
    { id: "ws-theo-home",          name: "Home",          personaId: "theo", createdAt: "2026-02-10T10:00:00-06:00" },
    { id: "ws-theo-health",        name: "Health",        personaId: "theo", createdAt: "2026-02-10T10:00:00-06:00" },
    { id: "ws-theo-relationships", name: "Relationships", personaId: "theo", createdAt: "2026-02-10T10:00:00-06:00" },
  ],
  default: [],
};

// ---------------------------------------------------------------------------
// Chat Sessions (W5-4B)
// ---------------------------------------------------------------------------

export const SESSIONS: Record<string, ChatSession[]> = {
  theo: [
    // --- Coaching: Clarity Session (8-turn spec: Welcome + Vision + Goal + Why + Milestone + Action + Identity + Release + Close) ---
    {
      id: "clarity-theo-demo",
      type: "clarity",
      title: "Clarity Session",
      createdAt: "2026-02-06T10:00:00-06:00",
      updatedAt: "2026-02-06T10:25:00-06:00",
      personaId: "theo",
      summary: "Vision: self-sustaining creative practice. Goal: $100/hr, 3 projects, School of Motion. Next action: update rate sheet.",
      goalCascade: {
        context_line: "Theo is a 23-year-old freelance graphic designer in East Austin, growing his creative practice.",
        vision: "Self-sustaining creative practice \u2014 brand identity + motion design, debt cleared, recognized in Austin creative community",
        quarterly_goal: "$100/hour for new clients, 3 concurrent projects, School of Motion modules 1-6",
        quarterly_goal_headline: "Hit $100/hr, 3 active projects, start School of Motion",
        goal_why: "I'm tired of the feast-or-famine cycle",
        identity_traits: [
          "bold with pricing",
          "disciplined with the unsexy stuff",
          "someone who finishes what he starts",
        ],
        release_items: [
          "saying yes to underpriced projects",
          "the barista survival story",
          "putting off systems until later",
        ],
        next_action_step: "Update my rate sheet and send to my next inquiry",
        next_action_due: "2026-02-13",
        focus_area: "career-business",
        declared_challenges: [
          "inconsistent income",
          "pricing and knowing my worth",
          "following through on plans",
          "managing finances",
        ],
      },
      messages: [
        // Welcome message
        {
          id: "clarity-demo-1",
          role: "assistant",
          content: "Hey Theo.\n\nThe freelance life has its own unique challenges \u2014 I see you.\n\nAs a **freelancer and side hustler** focused on **career and professional growth**, it makes total sense that **inconsistent income** keeps getting in the way.\n\nYou don\u2019t need to work harder or hustle more.\n\nYou need focus on the work that matters most, and boundaries that protect your energy.\n\n**That\u2019s what we\u2019re building together.**\n\nBy the end of this session, you\u2019ll know exactly what to focus on \u2014 and how to actually make it happen.\n\nSound good?",
          timestamp: "2026-02-06T10:00:00-06:00",
        },
        // User consent
        {
          id: "clarity-demo-2",
          role: "user",
          content: "Yeah, let\u2019s do it.",
          timestamp: "2026-02-06T10:01:15-06:00",
        },
        // Turn 1: Vision question
        {
          id: "clarity-demo-3",
          role: "assistant",
          content: "Good. Before we map anything out, I want to understand where you\u2019re actually headed \u2014 not the safe answer, the real one.\n\nIf you could look ahead one year from today \u2014 February 2027 \u2014 and things had gone really well, what does your life look like? Your work, your creative practice, how you spend your days. Don\u2019t edit yourself.",
          timestamp: "2026-02-06T10:01:45-06:00",
        },
        // Turn 1: Theo's vision
        {
          id: "clarity-demo-4",
          role: "user",
          content: "I want to be fully freelance \u2014 no more barista shifts to make rent. Running my own design practice, doing brand identity and starting to mix in motion work. Making enough that I\u2019m not checking my credit card balance with dread every month. And honestly? Being someone the Austin creative scene knows \u2014 not famous, just respected. Like, \u201coh yeah, Theo does great work.\u201d",
          timestamp: "2026-02-06T10:04:30-06:00",
        },
        // Turn 2: Vision reflection + Quarterly Goal question
        {
          id: "clarity-demo-5",
          role: "assistant",
          content: "So if I\u2019m hearing you right: running a self-sustaining creative practice \u2014 brand identity plus motion design \u2014 on freelance income alone. Financially stable, debt cleared, savings building. Recognized in Austin\u2019s creative community for excellent work.\n\nYou\u2019re not talking about a side hustle anymore. You\u2019re talking about building a practice.\n\nLet\u2019s make this concrete. Looking at the next 90 days \u2014 what\u2019s the one goal that would make the biggest dent in getting there?",
          timestamp: "2026-02-06T10:05:00-06:00",
        },
        // Turn 2: Theo's quarterly goal
        {
          id: "clarity-demo-6",
          role: "user",
          content: "Okay, 90 days... I think the biggest move is raising my rate to $100/hour for new clients and actually keeping it there \u2014 no caving when someone pushes back. And having like 3 brand identity projects going at once so the income isn\u2019t all feast-or-famine. And I really want to get through at least the first half of School of Motion \u2014 I keep starting and stopping.",
          timestamp: "2026-02-06T10:08:00-06:00",
        },
        // Turn 3: Goal reflection + Why question
        {
          id: "clarity-demo-7",
          role: "assistant",
          content: "So this quarter: establish $100/hour for new clients, maintain 3 concurrent projects, and complete School of Motion modules 1 through 6. Those are specific \u2014 good.\n\nNow the harder question: why does this matter to you right now? Not why it makes logical sense. Why does it matter *to you*, personally, at this point in your life?",
          timestamp: "2026-02-06T10:08:30-06:00",
        },
        // Turn 3: Theo's goal why
        {
          id: "clarity-demo-8",
          role: "user",
          content: "Because every time I raise my rate and the client says yes, I feel a little less like I\u2019m faking it. And the motion design thing \u2014 that\u2019s where the industry\u2019s going. Brand identity is my bread and butter but if I can add motion, I\u2019m not just another logo guy on Fiverr. I\u2019m building something that\u2019s actually mine. And honestly, the money part \u2014 I\u2019m tired of the anxiety. I just want to look at my bank account and feel okay.",
          timestamp: "2026-02-06T10:11:30-06:00",
        },
        // Turn 4: Why reception + Halfway Milestone question
        {
          id: "clarity-demo-9",
          role: "assistant",
          content: "\u201cI\u2019m building something that\u2019s actually mine.\u201d That\u2019s real. Thank you for that.\n\nOkay \u2014 we\u2019re about halfway through the quarter. If you\u2019re on track for $100/hour, 3 projects, and School of Motion through Module 6 \u2014 what would you see at the midpoint? What would be different by week 6?",
          timestamp: "2026-02-06T10:12:00-06:00",
        },
        // Turn 4: Theo's halfway milestone
        {
          id: "clarity-demo-10",
          role: "user",
          content: "Halfway... I think by week 6 I\u2019d want to have quoted $100/hour on at least 2 new inquiries \u2014 and had at least one say yes. My revision policy sent to every new client before the first call, not after the fourth round of changes. And through Module 3 of School of Motion with something I can actually put in my portfolio.",
          timestamp: "2026-02-06T10:15:00-06:00",
        },
        // Turn 5: Milestone reflection + Next Action question
        {
          id: "clarity-demo-11",
          role: "assistant",
          content: "Two quotes out, one accepted, revision policy leading instead of following, and a portfolio piece from Module 3. That\u2019s a solid marker. We\u2019ll check in on that.\n\nNow \u2014 what\u2019s the one thing you could do *this week* that would start the momentum? Not a category of things. The actual move.",
          timestamp: "2026-02-06T10:15:30-06:00",
        },
        // Turn 5: Theo's next action
        {
          id: "clarity-demo-12",
          role: "user",
          content: "Update my rate sheet and send to my next inquiry.",
          timestamp: "2026-02-06T10:17:00-06:00",
        },
        // Turn 6: Action confirmation + Identity Traits question
        {
          id: "clarity-demo-13",
          role: "assistant",
          content: "So this week: \u201cupdate my rate sheet and send to my next inquiry.\u201d That\u2019s the move.\n\nNow I want to ask something different. You\u2019ve got a clear goal and a first step. To be the person who actually hits $100/hour with 3 projects and motion design in the mix \u2014 who do you need to become? Not what you need to *do*. What qualities does that version of you have?",
          timestamp: "2026-02-06T10:17:30-06:00",
        },
        // Turn 6: Theo's identity traits
        {
          id: "clarity-demo-14",
          role: "user",
          content: "Bold with my pricing \u2014 not apologetic, not hedging, just stating the number. Disciplined with the unsexy stuff \u2014 invoicing, follow-ups, admin, not just the creative work. And honestly, someone who finishes what he starts \u2014 modules, policies, projects through to delivery.",
          timestamp: "2026-02-06T10:20:30-06:00",
        },
        // Turn 7: Identity reflection + Release question
        {
          id: "clarity-demo-15",
          role: "assistant",
          content: "Bold with pricing. Disciplined with the unsexy stuff. Someone who finishes what he starts. Those are real, Theo.\n\nNow the flip side: what do you need to let go of to become that person? What habits, stories, or patterns are you carrying that don\u2019t serve the version of you who charges $100/hour and runs three projects?",
          timestamp: "2026-02-06T10:21:00-06:00",
        },
        // Turn 7: Theo's release items
        {
          id: "clarity-demo-16",
          role: "user",
          content: "Saying yes to projects I know are underpriced \u2014 the people-pleasing rate discount. The story that I still need the coffee shop to survive \u2014 my income data says otherwise but the narrative hasn\u2019t caught up. And putting off systems until \u201clater\u201d \u2014 the revision policy, the invoicing template. Later never comes.",
          timestamp: "2026-02-06T10:24:00-06:00",
        },
        // Turn 8: Release reception + Milton Model close
        {
          id: "clarity-demo-17",
          role: "assistant",
          content: "Those are real. And notice something \u2014 they\u2019re all connected. The underpriced yes, the barista safety net, the systems you keep pushing to \u201clater\u201d \u2014 they\u2019re all ways of staying in survival mode instead of building the practice you just described.\n\nHere\u2019s what I want you to sit with, Theo. You walked in here talking about wanting to be fully freelance, and somewhere in the last twenty minutes you stopped talking about wanting it and started describing it \u2014 the $100/hour rate, the three projects, the motion work, the Austin creative community knowing your name. That shift matters. You\u2019re not dreaming about someone else\u2019s life. You\u2019re describing yours. And the person who gets there \u2014 bold with pricing, disciplined with the unsexy stuff, someone who finishes what he starts \u2014 that\u2019s not a costume you put on. You already showed me that person in how you talked about your work today. What\u2019s changing is you\u2019re deciding to stop apologizing for him.\n\nThe underpriced yeses, the coffee shop story, the \u201clater\u201d that never comes \u2014 you already know those aren\u2019t protecting you anymore. They\u2019re just familiar. And as you start letting them go, something you said is going to keep coming back: \u201cI\u2019m building something that\u2019s actually mine.\u201d That\u2019s the thread. Every time you quote your real rate, every time you send the invoice instead of putting it off, every time you sit down for School of Motion when you\u2019d rather scroll \u2014 you\u2019re building it.\n\nThat\u2019s your Clarity Session. Your first move this week: \u201cUpdate my rate sheet and send to my next inquiry.\u201d I\u2019ll check in on it.",
          timestamp: "2026-02-06T10:24:30-06:00",
        },
      ],
    },

    // --- Coaching: Morning Brief ---
    {
      id: "morning-theo-demo",
      type: "morning_brief",
      title: "Morning Brief \u2014 Mar 7",
      createdAt: "2026-03-07T08:30:00-06:00",
      updatedAt: "2026-03-07T08:40:00-06:00",
      personaId: "theo",
      summary: "Three priorities locked for the day. Discovery call prep is the high-leverage item.",
      messages: [
        {
          id: "mb-demo-1",
          role: "user",
          content: "Give me my morning brief",
          timestamp: "2026-03-07T08:30:00-06:00",
        },
        {
          id: "mb-demo-2",
          role: "assistant",
          content: "Morning, Theo. Here\u2019s your day.\n\n**Today\u2019s calendar:**\n- 10:00 \u2014 Monthly review session (90 min)\n- Open afternoon\n\n**Top 3 priorities:**\n1. Prep questions for discovery call (due today, ~45 min)\n2. Send invoice follow-up \u2014 StartupCo (due today, ~20 min)\n3. Send Meridian brand guide revisions (due Mar 12, ~2 hrs)\n\n**Pattern I\u2019m noticing:** You\u2019ve got two revenue actions due today. The discovery call prep is the high-leverage item \u2014 that\u2019s a potential new $100/hr client. I\u2019d front-load it before the monthly review so your head is clear.\n\n**Open loop from last week:** You committed to no new projects until the invoice backlog is clear. StartupCo follow-up is the last one. Close that loop today.\n\nWhat do you want to tackle first?",
          timestamp: "2026-03-07T08:30:30-06:00",
        },
        {
          id: "mb-demo-3",
          role: "user",
          content: "Discovery call prep first. What should I make sure to cover?",
          timestamp: "2026-03-07T08:33:00-06:00",
        },
        {
          id: "mb-demo-4",
          role: "assistant",
          content: "Based on your Meridian debrief, three things to nail:\n\n1. **Ask about their budget range before quoting** \u2014 you flagged this as a miss last time. Simple question: \u201cWhat range are you working with for this project?\u201d\n2. **Lead with the feeling question** \u2014 \u201cWhat do you want someone to feel when they see your brand?\u201d worked well with Meridian.\n3. **Bring a printed leave-behind** \u2014 you noted this would have been more professional.\n\nAnd the big one: **quote at $100/hour.** No discount. No \u201cfirst project special.\u201d You committed to this in your Clarity Session. If they say no, that\u2019s data, not rejection.\n\nYou\u2019ve got this.",
          timestamp: "2026-03-07T08:33:30-06:00",
        },
      ],
    },

    // --- Coaching: Weekly Review ---
    {
      id: "weekly-theo-demo",
      type: "weekly",
      title: "Weekly Review \u2014 Mar 2",
      createdAt: "2026-03-02T10:00:00-06:00",
      updatedAt: "2026-03-02T10:30:00-06:00",
      personaId: "theo",
      summary: "2 of 3 weekly targets hit. Invoicing still open. New target: close invoice backlog.",
      messages: [
        {
          id: "wr-demo-1",
          role: "user",
          content: "Let\u2019s do my weekly review",
          timestamp: "2026-03-02T10:00:00-06:00",
        },
        {
          id: "wr-demo-2",
          role: "assistant",
          content: "Let\u2019s see how the week landed.\n\n**Your 3 targets were:**\n1. +1 $100/hr quote \u2014 **Done.** Meridian discovery call, quoted at full rate, they accepted.\n2. SoM Module 4 \u2014 **In progress.** You downloaded the files but haven\u2019t started the exercises.\n3. Follow up invoices \u2014 **Not done.** Three still outstanding ($2,400 total).\n\n**Score: 1.5 / 3.** The Meridian win is significant \u2014 that\u2019s the first time you quoted $100/hr and held it. That\u2019s identity-level.\n\nThe invoice follow-ups keep sliding. This is the third week they\u2019ve been on your list. **What\u2019s actually blocking you?**",
          timestamp: "2026-03-02T10:00:30-06:00",
        },
        {
          id: "wr-demo-3",
          role: "user",
          content: "I hate chasing people for money. It feels weird. Like I\u2019m being pushy.",
          timestamp: "2026-03-02T10:05:00-06:00",
        },
        {
          id: "wr-demo-4",
          role: "assistant",
          content: "That tracks with the pricing pattern. The same part of you that underprices projects is the part that won\u2019t follow up on invoices. It\u2019s the same story: *asking for what you\u2019re owed feels like too much*.\n\nBut here\u2019s the reality: you did the work. They owe you $2,400. Following up isn\u2019t pushy \u2014 it\u2019s professional. Every freelancer you admire sends invoice reminders. It\u2019s not personal.\n\n**For next week:**\n1. Close the invoice backlog (all 3 follow-ups, Monday morning)\n2. SoM Module 4 exercises\n3. Prep for Meridian Round 2 presentation\n\nThe invoice follow-ups go first because they\u2019re the easiest to keep dodging. Get them out of your head Monday morning. 20 minutes and it\u2019s done.",
          timestamp: "2026-03-02T10:05:30-06:00",
        },
      ],
    },

    // --- Workspace: Freelance chats ---
    {
      id: "chat-theo-freelance-1",
      type: "chat",
      title: "Meridian brand strategy",
      workspaceId: "ws-theo-freelance",
      createdAt: "2026-03-01T14:00:00-06:00",
      updatedAt: "2026-03-01T14:30:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "fl-1-1",
          role: "user",
          content: "I\u2019m prepping for the Meridian brand concepts review on Tuesday. They\u2019re a coffee roastery that wants to feel premium but approachable. I\u2019ve got three directions \u2014 can you help me think through which one to lead with?",
          timestamp: "2026-03-01T14:00:00-06:00",
        },
        {
          id: "fl-1-2",
          role: "assistant",
          content: "Let\u2019s think about this from Meridian\u2019s perspective. They said \u201cpremium but approachable\u201d \u2014 which usually means they\u2019re afraid of looking pretentious but also don\u2019t want to look cheap.\n\n**Lead with the direction that resolves that tension best.** Which of your three does that?\n\nAlso \u2014 remember your discovery call debrief: *lead with feeling, not features*. When you present, don\u2019t start with the logo. Start with: \u201cHere\u2019s how someone should feel when they walk into your shop and see this brand.\u201d\n\nWhich direction are you leaning toward?",
          timestamp: "2026-03-01T14:00:30-06:00",
        },
        {
          id: "fl-1-3",
          role: "user",
          content: "Direction B \u2014 warm earth tones, hand-drawn type, feels like a neighborhood spot but with craft quality. The other two are either too corporate or too hipster.",
          timestamp: "2026-03-01T14:05:00-06:00",
        },
        {
          id: "fl-1-4",
          role: "assistant",
          content: "Direction B sounds right for their brief. \u201cNeighborhood spot with craft quality\u201d *is* \u201cpremium but approachable\u201d translated into design language.\n\n**For the presentation:**\n1. Lead with B. Show it in context \u2014 on a cup, on the door, on their Instagram grid\n2. Show A and C as contrast options, not equals. \u201cHere\u2019s how we could go more minimal\u201d and \u201chere\u2019s how we could go more playful\u201d \u2014 but frame B as the recommendation\n3. Have a clear next step ready: \u201cIf this direction feels right, here\u2019s what the next phase looks like\u201d\n\nPresenting a recommendation shows confidence. Presenting three equal options signals you\u2019re not sure. You\u2019re the expert here \u2014 act like it.",
          timestamp: "2026-03-01T14:05:30-06:00",
        },
      ],
    },
    {
      id: "chat-theo-freelance-2",
      type: "chat",
      title: "Pricing for new clients",
      workspaceId: "ws-theo-freelance",
      createdAt: "2026-02-24T11:00:00-06:00",
      updatedAt: "2026-02-24T11:20:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "fl-2-1",
          role: "user",
          content: "Got a DM from someone who wants a logo. They asked \u201cwhat\u2019s your rate?\u201d and I froze. My old rate was $40/hr but I committed to $100. What do I actually say?",
          timestamp: "2026-02-24T11:00:00-06:00",
        },
        {
          id: "fl-2-2",
          role: "assistant",
          content: "First: don\u2019t quote hourly for logo work. Quote project-based.\n\nHourly rates invite negotiation (\u201ccan you do it for less hours?\u201d). Project pricing frames the value differently: they\u2019re paying for *the outcome*, not your time.\n\n**A simple response:**\n\u201cThanks for reaching out! My brand identity packages start at $1,500 for logo + brand guidelines. Happy to hop on a quick call to learn more about your project and see if it\u2019s a fit.\u201d\n\nNotice: you named a number, didn\u2019t apologize, and offered a next step. If they ghost, that\u2019s data \u2014 they weren\u2019t your client. If they respond, you\u2019ve set the anchor at $1,500, not $40/hr.\n\nHow does that feel?",
          timestamp: "2026-02-24T11:00:30-06:00",
        },
        {
          id: "fl-2-3",
          role: "user",
          content: "Terrifying but right. I\u2019m going to send it before I talk myself out of it.",
          timestamp: "2026-02-24T11:05:00-06:00",
        },
        {
          id: "fl-2-4",
          role: "assistant",
          content: "Send it. Then close the app and go do something else. Don\u2019t refresh your DMs every 30 seconds.\n\nThis is the identity shift in action: *bold with pricing*. The old Theo would have said $300 and resented the work. This Theo names a real number and lets the client decide.\n\nLet me know how it goes.",
          timestamp: "2026-02-24T11:05:30-06:00",
        },
      ],
    },

    // --- Workspace: Health chats ---
    {
      id: "chat-theo-health-1",
      type: "chat",
      title: "ADHD focus strategies",
      workspaceId: "ws-theo-health",
      createdAt: "2026-02-20T09:00:00-06:00",
      updatedAt: "2026-02-20T09:25:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "hl-1-1",
          role: "user",
          content: "I\u2019ve been tracking my focus blocks and I can\u2019t get more than 45 minutes before I\u2019m checking my phone. It\u2019s killing my output.",
          timestamp: "2026-02-20T09:00:00-06:00",
        },
        {
          id: "hl-1-2",
          role: "assistant",
          content: "45 minutes is actually solid for ADHD \u2014 that\u2019s not the problem. The problem is what happens *after* you check your phone: you don\u2019t come back for another 20-30 minutes.\n\nTwo adjustments based on what\u2019s been working for you:\n\n1. **Phone in the backpack.** Not on the desk, not face-down \u2014 in the backpack, zipped. You identified this yourself in your focus experiments note. The data is clear.\n\n2. **Work in 45-minute blocks with intentional breaks.** Don\u2019t fight your attention span \u2014 design around it. 45 on, 10 off, repeat. During the 10, go outside. Not your phone.\n\nYour best work happens at the coffee shop between 10 AM and 1 PM. Three 45-minute blocks in that window = 2.25 hours of actual focused design time. That\u2019s more than most people get in an 8-hour day.\n\nStop trying to focus for 3 hours straight. You\u2019re not built for it, and you don\u2019t need to be.",
          timestamp: "2026-02-20T09:00:30-06:00",
        },
        {
          id: "hl-1-3",
          role: "user",
          content: "That reframe actually helps. I keep comparing myself to people who can grind for hours.",
          timestamp: "2026-02-20T09:10:00-06:00",
        },
        {
          id: "hl-1-4",
          role: "assistant",
          content: "Comparison is the wrong metric. Output is the right one. You finished the Meridian brand concepts in two focused sessions at the coffee shop. That\u2019s real work that\u2019s earning real money.\n\nThe question isn\u2019t \u201chow long can I focus?\u201d It\u2019s \u201cam I protecting my best hours for my best work?\u201d\n\nMorning = coffee shop + client work. Phone in the backpack. That\u2019s the system. Trust it.",
          timestamp: "2026-02-20T09:10:30-06:00",
        },
      ],
    },

    // --- Workspace: Business chat ---
    {
      id: "chat-theo-business-1",
      type: "chat",
      title: "Q1 revenue planning",
      workspaceId: "ws-theo-business",
      createdAt: "2026-02-15T14:00:00-06:00",
      updatedAt: "2026-02-15T14:20:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "bz-1-1",
          role: "user",
          content: "I want to figure out if $100/hr is realistic for Q1. Right now I\u2019m averaging maybe $50/hr when I factor in all the unbillable time.",
          timestamp: "2026-02-15T14:00:00-06:00",
        },
        {
          id: "bz-1-2",
          role: "assistant",
          content: "Let\u2019s do the math.\n\n**Current reality:** ~$50/hr effective rate, maybe 15 billable hours/week (rest is admin, prospecting, unpaid revisions). That\u2019s ~$3,000/month.\n\n**Target:** $100/hr, 3 concurrent projects. If each project averages 15-20 hours, that\u2019s $4,500-6,000/month from design work alone.\n\n**The gap isn\u2019t the rate \u2014 it\u2019s the unbillable time.** You\u2019re losing hours to:\n- Scope creep (adding extras they didn\u2019t ask for)\n- Invoice chasing (because you don\u2019t follow up promptly)\n- Prospecting inefficiently (saying yes to everything instead of targeting)\n\n**Three levers:**\n1. Quote project-based, not hourly \u2014 protects your margin on scope creep\n2. Send invoices the day you deliver, follow up at 7 and 14 days \u2014 systemize it\n3. Say no to sub-$1,000 projects \u2014 they eat the same admin time as $3,000 ones\n\n$100/hr is realistic. But it requires saying no to the work that keeps you at $50.",
          timestamp: "2026-02-15T14:00:30-06:00",
        },
      ],
    },

    // --- Workspace: Relationships chat ---
    {
      id: "chat-theo-relationships-1",
      type: "chat",
      title: "Setting boundaries with family",
      workspaceId: "ws-theo-relationships",
      createdAt: "2026-02-18T19:00:00-06:00",
      updatedAt: "2026-02-18T19:15:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "rel-1-1",
          role: "user",
          content: "My mom keeps asking when I\u2019m going to get a \u201creal job.\u201d I know she means well but it\u2019s draining. How do I handle this without blowing up?",
          timestamp: "2026-02-18T19:00:00-06:00",
        },
        {
          id: "rel-1-2",
          role: "assistant",
          content: "She\u2019s asking because she\u2019s worried, not because she doesn\u2019t believe in you. The barista shifts + inconsistent income look risky from a parent\u2019s perspective. She doesn\u2019t see the Meridian project or the $100/hr quote \u2014 she sees her kid hustling.\n\n**What might actually work:**\n- Share a win. Next time she asks, tell her about Meridian. \u201cI just landed a brand identity project for a coffee roastery. They\u2019re paying me $100/hour.\u201d Concrete beats abstract.\n- Set a boundary with warmth: \u201cI know you worry, and I appreciate that. But I need you to trust that I\u2019m building something real. Can I update you monthly instead of defending myself every dinner?\u201d\n\nYou don\u2019t need her permission. But you\u2019d probably like her support. Giving her evidence of progress is the fastest way to earn it.",
          timestamp: "2026-02-18T19:00:30-06:00",
        },
      ],
    },

    // --- Workspace: Home chat ---
    {
      id: "chat-theo-home-1",
      type: "chat",
      title: "Studio setup on a budget",
      workspaceId: "ws-theo-home",
      createdAt: "2026-02-22T16:00:00-06:00",
      updatedAt: "2026-02-22T16:15:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "hm-1-1",
          role: "user",
          content: "I want to set up a proper home studio for design work but I\u2019m on a tight budget. What\u2019s actually essential vs nice to have?",
          timestamp: "2026-02-22T16:00:00-06:00",
        },
        {
          id: "hm-1-2",
          role: "assistant",
          content: "You already have the most important thing \u2014 a laptop that runs your tools. Everything else is optimization.\n\n**Essential (invest now):**\n- External monitor \u2014 even a used 24\" 1080p ($80-120 on marketplace). Design on a 13\" screen is slow. This pays for itself in the first week.\n- Decent chair. Your back is a business asset. Check estate sales.\n\n**Nice to have (invest when revenue allows):**\n- Drawing tablet (Wacom Intuos, ~$80)\n- Ring light for client video calls ($25)\n- Cable management (makes the space feel professional, helps focus)\n\n**Skip for now:**\n- Standing desk (use a stack of books)\n- Second monitor (one external is enough)\n- Acoustic panels (you\u2019re doing design, not podcasting)\n\nThe goal isn\u2019t a showroom. It\u2019s a space where you can sit down and *start working* without friction. External monitor + good chair. That\u2019s it for now.",
          timestamp: "2026-02-22T16:00:30-06:00",
        },
      ],
    },

    // --- Your Chats: unorganized ---
    {
      id: "chat-theo-unorg-1",
      type: "chat",
      title: "Help me brainstorm portfolio ideas",
      createdAt: "2026-03-06T15:00:00-06:00",
      updatedAt: "2026-03-06T15:15:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "uo-1-1",
          role: "user",
          content: "I need to update my portfolio site. Right now it\u2019s just a Notion page. What should I actually include?",
          timestamp: "2026-03-06T15:00:00-06:00",
        },
        {
          id: "uo-1-2",
          role: "assistant",
          content: "For where you are right now \u2014 transitioning from side hustle to real practice \u2014 your portfolio needs to do one thing: **prove you can solve a client\u2019s problem, not just make pretty things.**\n\n**Must-haves:**\n1. 3-4 case studies (not just images \u2014 show the brief, your process, the result)\n2. Clear services page: what you do, who it\u2019s for, how to start\n3. One testimonial (even from Meridian if they\u2019re happy)\n4. Contact form or booking link\n\n**The case study format that works:**\n- Client + their challenge (1 sentence)\n- What you did (2-3 sentences)\n- The result (screenshot + 1 sentence)\n\nKeep it tight. Clients spend 30 seconds on a portfolio. Make those 30 seconds count.",
          timestamp: "2026-03-06T15:00:30-06:00",
        },
      ],
    },
    {
      id: "chat-theo-unorg-2",
      type: "chat",
      title: "What\u2019s my schedule look like tomorrow?",
      createdAt: "2026-03-05T20:00:00-06:00",
      updatedAt: "2026-03-05T20:10:00-06:00",
      personaId: "theo",
      messages: [
        {
          id: "uo-2-1",
          role: "user",
          content: "What\u2019s my schedule look like tomorrow?",
          timestamp: "2026-03-05T20:00:00-06:00",
        },
        {
          id: "uo-2-2",
          role: "assistant",
          content: "Tomorrow (Thursday, Mar 6) looks open \u2014 no scheduled events on your calendar.\n\nThat\u2019s a deep work day. Based on your priorities:\n\n1. **Morning (10-1 PM at coffee shop):** Meridian brand guide revisions \u2014 this is your top priority, due Mar 12\n2. **Afternoon:** School of Motion Module 4 exercises\n3. **Evening:** Jog at Town Lake if the weather\u2019s good\n\nNo meetings to break up your focus blocks. Use it.",
          timestamp: "2026-03-05T20:00:30-06:00",
        },
      ],
    },
  ],

  // --- Jordan Lee (p01) ---
  p01: [
    {
      id: "import-p01-demo",
      type: "import",
      title: "Calendar Import",
      createdAt: "2026-03-06T14:00:00-06:00",
      updatedAt: "2026-03-06T14:15:00-06:00",
      personaId: "p01",
      summary: "Calendar data imported \u2014 130 facts extracted across all four memory stores.",
      messages: [
        {
          id: "imp-p01-1",
          role: "user",
          content: "I have 1 data file to import into my Brain Cloud (42 records: calendar_export.jsonl):\n\n--- File: calendar_export.jsonl (42 records) ---\nMeeting notes, appointments, and scheduled events from the past 3 months.\n\nPlease process all of these records into my Brain Cloud.",
          timestamp: "2026-03-06T14:00:00-06:00",
        },
        {
          id: "imp-p01-2",
          role: "assistant",
          content: "I\u2019m processing your calendar data now. Here\u2019s what I found across 42 records:\n\n**Stored to Brain Cloud:**\n- 130 facts extracted and stored across all four memory stores\n- 18 calendar events mapped to your schedule\n- 12 relationship connections identified (people you meet with regularly)\n- 8 recurring patterns detected (weekly standups, monthly reviews)\n\n**Key insights:**\n- You have a consistent Thursday coaching cadence\n- Most of your creative meetings happen Tuesday/Wednesday\n- Your calendar shows a shift toward more client-facing time in the last month\n\nAll data is now searchable in your Brain Cloud and will inform future coaching sessions. You can export it anytime via `brain_export`.",
          timestamp: "2026-03-06T14:05:00-06:00",
        },
      ],
    },
  ],

  default: [],
};

// ---------------------------------------------------------------------------
// Life Insights: Domain Health
// ---------------------------------------------------------------------------

const BASELINE_DOMAINS: DomainHealth[] = [
  { id: "health", name: "Health & Vitality", icon: "Heartbeat", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "mental", name: "Mental Wellness", icon: "Brain", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "relationships", name: "Relationships", icon: "UsersThree", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "career", name: "Career & Mission", icon: "Briefcase", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "financial", name: "Financial", icon: "CurrencyCircleDollar", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "learning", name: "Growth & Learning", icon: "BookOpenText", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "environment", name: "Environment", icon: "House", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "fun", name: "Fun & Joy", icon: "SmileyWink", direction: "baseline", observation: "Tracking begins after your first week." },
  { id: "spirituality", name: "Spirituality", icon: "Sparkle", direction: "baseline", observation: "Tracking begins after your first week." },
];

export const DOMAIN_HEALTH: Record<string, DomainHealth[]> = {
  theo: [
    { id: "health", name: "Health & Vitality", icon: "Heartbeat", direction: "growth", observation: "Running 3x/week at Town Lake \u2014 best consistency in 6 weeks." },
    { id: "mental", name: "Mental Wellness", icon: "Brain", direction: "steady", observation: "ADHD focus strategies stabilizing. Phone-in-backpack habit holding." },
    { id: "relationships", name: "Relationships", icon: "UsersThree", direction: "steady", observation: "Regular lunches with Dev. Mom boundary conversation still open." },
    { id: "career", name: "Career & Mission", icon: "Briefcase", direction: "growth", observation: "First $100/hr quote accepted. Meridian project on track." },
    { id: "financial", name: "Financial", icon: "CurrencyCircleDollar", direction: "needs_attention", observation: "$2,400 in outstanding invoices \u2014 3 weeks overdue." },
    { id: "learning", name: "Growth & Learning", icon: "BookOpenText", direction: "growth", observation: "School of Motion Module 4. On pace for Module 6 by quarter end." },
    { id: "environment", name: "Environment", icon: "House", direction: "steady", observation: "Home studio functional. External monitor making a difference." },
    { id: "fun", name: "Fun & Joy", icon: "SmileyWink", direction: "growth", observation: "Skating every Saturday. Austin Creatives meetup becoming regular." },
    { id: "spirituality", name: "Spirituality", icon: "Sparkle", direction: "needs_attention", observation: "No reflection practice this month. Journaling dropped off." },
  ],
  default: BASELINE_DOMAINS,
};

// ---------------------------------------------------------------------------
// Life Insights: Quarterly Goals
// ---------------------------------------------------------------------------

export const QUARTERLY_GOALS: Record<string, QuarterlyGoal[]> = {
  theo: [
    {
      id: "goal-1",
      title: "$100/hr for new clients",
      why: "I\u2019m tired of the feast-or-famine cycle",
      milestones: [
        { text: "Quoted $100/hr to first prospect", completed: true },
        { text: "Meridian accepted at full rate", completed: true },
        { text: "Land 3rd concurrent project", completed: false },
        { text: "Close all outstanding invoices", completed: false },
        { text: "Drop barista shifts to 2x/week", completed: false },
      ],
      nextMilestone: "Land 3rd concurrent project",
      nextMilestoneDue: "Mar 31",
      celebration: "First $100/hr client accepted!",
    },
    {
      id: "goal-2",
      title: "School of Motion through Module 6",
      why: "Motion design opens a new revenue stream",
      milestones: [
        { text: "Complete Modules 1-2", completed: true },
        { text: "Complete Module 3", completed: true },
        { text: "Complete Module 4 exercises", completed: false },
        { text: "Complete Module 5", completed: false },
        { text: "Complete Module 6 + portfolio piece", completed: false },
      ],
      nextMilestone: "Complete Module 4 exercises",
      nextMilestoneDue: "Mar 14",
      celebration: null,
    },
    {
      id: "goal-3",
      title: "3 concurrent design projects",
      why: "Stability means I can stop saying yes to survival gigs",
      milestones: [
        { text: "Meridian brand identity (active)", completed: true },
        { text: "Discovery call pipeline established", completed: true },
        { text: "Land 2nd concurrent project", completed: false },
        { text: "Land 3rd concurrent project", completed: false },
      ],
      nextMilestone: "Land 2nd concurrent project",
      nextMilestoneDue: "Mar 21",
      celebration: null,
    },
  ],
  default: [],
};

// ---------------------------------------------------------------------------
// Life Insights: Weekly Pulse
// ---------------------------------------------------------------------------

export const WEEKLY_PULSE: Record<string, PulseMetrics> = {
  theo: {
    coachingStreak: { value: 18, trend: 5, unit: "days" },
    top3Completion: { value: 72, trend: 8, unit: "%", isPercentage: true },
    sessionsThisWeek: { value: 4, trend: 0, unit: "sessions" },
    winsCaptured: { value: 6, trend: 2, unit: "wins" },
  },
  default: {
    coachingStreak: { value: null, trend: 0, unit: "days" },
    top3Completion: { value: null, trend: 0, unit: "%", isPercentage: true },
    sessionsThisWeek: { value: null, trend: 0, unit: "sessions" },
    winsCaptured: { value: null, trend: 0, unit: "wins" },
  },
};

// ---------------------------------------------------------------------------
// Life Insights: Cross-Domain Insight
// ---------------------------------------------------------------------------

export const CROSS_DOMAIN_INSIGHT: Record<string, InsightData> = {
  theo: {
    type: "insight",
    text: "Your pricing confidence is up significantly since February \u2014 you quoted $100/hr and held it. But your invoice follow-through hasn\u2019t matched. The same part of you that got bold enough to name your price is avoiding the follow-up conversation. The courage you\u2019re building in Career is exactly the courage you need in Financial. They\u2019re the same muscle.",
    domains: ["Career & Mission", "Financial"],
    lastUpdated: "Monday",
  },
  default: {
    type: "welcome",
    text: "Welcome to your Life Insights. As you complete your first week in Neurow, I\u2019ll start surfacing patterns across your life domains that you might not see on your own. Every session adds depth to your personal picture.",
  },
};
