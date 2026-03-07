/**
 * Per-user static demo data for hackathon.
 *
 * Keyed by user slug ("theo", etc.) with "default" fallback for new users.
 * Production path: replace with live Brain Cloud queries via MCP.
 *
 * Decisions: W5-1A-D-004 (tasks), D-005 (targets), D-006 (notes), D-007 (architecture)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Priority = "Urgent" | "High" | "Medium" | "Low" | "None";

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
function todayFormatted(): string {
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
    { id: "e12", title: "School of Motion Module 4 exercises", date: "2026-03-11", startTime: "19:00", endTime: "20:30", durationMin: 90, category: "Learning" },

    // Thu Mar 12
    { id: "e13", title: "Coaching session", date: "2026-03-12", startTime: "10:00", endTime: "11:00", durationMin: 60, category: "Coaching" },
    { id: "e14", title: "Meridian \u2014 client presentation (Round 2)", date: "2026-03-12", startTime: "14:00", endTime: "15:00", durationMin: 60, category: "Freelance" },

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
  ],
  default: [
    { id: "new-e01", title: "Welcome coaching session", date: todayISO(), startTime: "10:00", endTime: "10:30", durationMin: 30, category: "Coaching" },
  ],
};
