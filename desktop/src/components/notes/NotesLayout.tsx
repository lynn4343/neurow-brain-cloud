"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MagnifyingGlass,
  Tag,
  Calendar,
  Circle,
} from "@phosphor-icons/react";

// --- Demo data (static — replaced with brain_recall when MCP is wired) ---

interface Note {
  id: string;
  title: string;
  preview: string;
  content: string;
  tags: string[];
  date: string;
  source: "coaching" | "reflection" | "capture";
}

const DEMO_NOTES: Note[] = [
  {
    id: "1",
    title: "Weekly intentions — Feb 24",
    preview:
      "This week I want to focus on three things: finish the cafe rebrand deck...",
    content: `This week I want to focus on three things:

1. **Finish the cafe rebrand deck** — the client presentation is Thursday. Stop second-guessing the color palette. Pick one and commit. The longer I tweak, the less confident I look.

2. **No new projects until the invoice backlog is clear** — I have three outstanding invoices from January. That's $2,400 sitting in other people's pockets. Send the follow-ups Monday morning.

3. **One hour of motion design practice every day** — not "when I have time." Blocked on the calendar. This is how freelance becomes full-time. Skills compound.

The theme this week is *finish things*. I have too many 80%-done projects. None of them are paying me until they're 100%.`,
    tags: ["reflection", "weekly"],
    date: "Feb 24, 2026",
    source: "coaching",
  },
  {
    id: "2",
    title: "The pricing pattern",
    preview:
      "Neurow flagged something today that I already knew but keep ignoring: I underprice every project...",
    content: `Neurow flagged something today that I already knew but keep ignoring: I underprice every single project, then resent the work halfway through.

**The pattern:**
- Client asks for a quote → I lowball because I'm afraid they'll say no
- I get the project → I scope-creep myself adding extras they didn't ask for
- I finish exhausted → I calculate my hourly rate and it's under $15

Neurow pulled this across my last four client projects. Same pattern every time. The *fear of losing the client* costs me more than losing the client would.

**What's underneath:** I don't actually believe my work is worth what the market says it is. The portfolio says $75/hr. My gut says "but what if they find someone cheaper?"

**The commitment:** Next proposal goes out at full rate. No discount. No "first project special." If they say no, that's data — not rejection.`,
    tags: ["growth", "patterns"],
    date: "Feb 23, 2026",
    source: "coaching",
  },
  {
    id: "3",
    title: "Client debrief — cafe rebrand",
    preview:
      "Just wrapped the discovery call with the East Austin cafe. Three things I noticed about how...",
    content: `Just wrapped the discovery call with the East Austin cafe. Three things I noticed about how I showed up:

**What worked:**
- Asked "what feeling do you want someone to have when they walk in?" instead of jumping to fonts and colors
- Showed my portfolio on the iPad instead of just sending a link — they could see me walk through the thinking
- Named my price without apologizing. First time. Heart was pounding but I just said the number and stopped talking.

**What didn't:**
- Got nervous and started talking too fast when they asked about timeline
- Forgot to ask about their budget range before quoting — got lucky it aligned
- Didn't bring a printed leave-behind. Would have been more professional.

**Insight from Neurow:** I tend to over-prepare on the creative side and under-prepare on the business side. The design thinking is strong. The client management needs reps.

**Next:** Build a standard discovery call checklist so I don't have to wing the business parts.`,
    tags: ["freelance", "debrief"],
    date: "Feb 22, 2026",
    source: "coaching",
  },
  {
    id: "4",
    title: "ADHD focus experiments",
    preview:
      "Tracked my focus blocks for two weeks. The data is pretty clear: I do my best design work...",
    content: `Tracked my focus blocks for two weeks. The data is pretty clear: I do my best design work between 10 AM - 1 PM, but only if I don't start with email or social media.

**What's working:**
- Body doubling at the coffee shop — even when I'm not on shift, being around people helps
- The "ugly first draft" rule — giving myself permission to make bad designs for 15 minutes breaks the perfectionism freeze
- Music without lyrics. Finally accepted this about myself.

**What's not working:**
- Trying to do client work and personal projects in the same block — context switching kills me
- Phone on the desk. Period. It goes in the backpack now.
- Skipping lunch and trying to push through — I crash at 2 PM every time

**Adjustment:** Morning = coffee shop + client work (billable hours). Afternoon = home + learning/personal projects. Phone in backpack until first focus block is done. Eat lunch at actual lunchtime.`,
    tags: ["health", "routine"],
    date: "Feb 21, 2026",
    source: "reflection",
  },
  {
    id: "5",
    title: "What I actually want",
    preview:
      "Came up in tonight's session and I want to hold onto it before the feeling fades...",
    content: `Came up in tonight's session and I want to hold onto it before the feeling fades.

I keep saying I want to "make freelancing full-time" but what I actually want is something bigger than that. I want to build a design practice that people seek out. Not just "Theo does logos." I want to be the person small businesses in Austin call when they want their brand to feel like *them*.

The barista job isn't the problem. The problem is I've been treating freelance like a side hustle with main-character energy. Half-committing. Taking any project that pays. Not building toward anything specific.

What would it look like to actually take this seriously? A real portfolio site, not a Notion page. A niche — maybe restaurants and cafes, since that's where all my best work is. Raising my rate to $75/hr and only taking projects I'm proud of. Saying no to the $200 logo jobs that eat my week.

Neurow asked me: "What would you do if you weren't afraid of it not working?" And the answer is exactly this. Go all in. Specialize. Charge what I'm worth. Build something real.

Scary. But I think that's the point.`,
    tags: ["personal", "vision"],
    date: "Feb 20, 2026",
    source: "coaching",
  },
];

const TAG_COLORS: Record<string, string> = {
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

const SOURCE_LABELS: Record<Note["source"], string> = {
  coaching: "From coaching session",
  reflection: "Personal reflection",
  capture: "Quick capture",
};

// --- Components ---

function NoteListItem({
  note,
  isSelected,
  onClick,
}: {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 transition-all duration-150",
        isSelected
          ? "bg-white shadow-sm"
          : "hover:bg-white/60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-[13px] font-medium text-[#1E1E1E] leading-tight line-clamp-1">
          {note.title}
        </h3>
      </div>
      <p className="text-[12px] text-[#80807d] leading-relaxed line-clamp-2 mb-2">
        {note.preview}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#A0A09D]">{note.date}</span>
        <div className="flex gap-1">
          {note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                TAG_COLORS[tag] || "bg-gray-100 text-gray-600"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function NoteContent({ note }: { note: Note }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Note header */}
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-xl font-semibold text-[#1E1E1E] mb-3">
          {note.title}
        </h1>
        <div className="flex items-center gap-4 text-[12px] text-[#80807d]">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" weight="regular" />
            {note.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="size-2" weight="fill" />
            {SOURCE_LABELS[note.source]}
          </span>
        </div>
        <div className="flex gap-1.5 mt-3">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                TAG_COLORS[tag] || "bg-gray-100 text-gray-600"
              )}
            >
              <Tag className="size-3" weight="regular" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-8 h-px bg-[#E6E5E3]" />

      {/* Note body */}
      <ScrollArea className="flex-1">
        <div className="px-8 py-6 max-w-[640px]">
          <div className="prose prose-sm prose-neutral">
            {note.content.split("\n\n").map((paragraph, i) => {
              // Handle markdown-style bold
              const formatted = paragraph.replace(
                /\*\*(.*?)\*\*/g,
                '<strong>$1</strong>'
              ).replace(
                /\*(.*?)\*/g,
                '<em>$1</em>'
              );

              // Detect list items
              if (paragraph.match(/^[-\d]/m)) {
                const items = paragraph.split("\n");
                return (
                  <div key={i} className="mb-4">
                    {items.map((item, j) => {
                      const cleaned = item.replace(/^[-\d.]\s*/, "");
                      const formattedItem = cleaned.replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong>$1</strong>'
                      ).replace(
                        /\*(.*?)\*/g,
                        '<em>$1</em>'
                      );
                      return (
                        <p
                          key={j}
                          className="text-[13px] leading-relaxed text-[#3A3A3A] pl-4 mb-1"
                          dangerouslySetInnerHTML={{ __html: formattedItem }}
                        />
                      );
                    })}
                  </div>
                );
              }

              return (
                <p
                  key={i}
                  className="text-[13px] leading-relaxed text-[#3A3A3A] mb-4"
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function NotesLayout() {
  const [selectedId, setSelectedId] = useState(DEMO_NOTES[0].id);
  const selectedNote = DEMO_NOTES.find((n) => n.id === selectedId) || DEMO_NOTES[0];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel — note list */}
      <div className="w-[280px] flex flex-col bg-[#F4F1F1] border-r border-[#E6E5E3]">
        {/* Search bar */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 border border-[#E6E5E3]">
            <MagnifyingGlass className="size-3.5 text-[#80807d]" weight="regular" />
            <span className="text-[12px] text-[#A0A09D]">Search notes...</span>
          </div>
        </div>

        {/* Note count */}
        <div className="px-4 py-2">
          <span className="text-[11px] font-medium text-[#80807d] uppercase tracking-wider">
            {DEMO_NOTES.length} notes
          </span>
        </div>

        {/* Note list */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {DEMO_NOTES.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedId}
                onClick={() => setSelectedId(note.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel — note content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <NoteContent note={selectedNote} />
      </div>
    </div>
  );
}
