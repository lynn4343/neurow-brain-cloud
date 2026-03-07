"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { type Note, NOTES, TAG_COLORS, SOURCE_LABELS, getUserData } from "@/lib/demo-data";
import {
  MagnifyingGlass,
  Tag,
  Calendar,
  Circle,
} from "@phosphor-icons/react";

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
  const { activeUser } = useUser();
  const notes = getUserData(NOTES, activeUser?.slug);
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? "");

  // Reset selection when user switches (React pattern: adjust state during render)
  const [prevSlug, setPrevSlug] = useState(activeUser?.slug);
  if (activeUser?.slug !== prevSlug) {
    setPrevSlug(activeUser?.slug);
    setSelectedId(notes[0]?.id ?? "");
  }

  const selectedNote = notes.find((n) => n.id === selectedId) || notes[0];

  if (notes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#949494]">
        No notes yet
      </div>
    );
  }

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
            {notes.length} notes
          </span>
        </div>

        {/* Note list */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {notes.map((note) => (
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
