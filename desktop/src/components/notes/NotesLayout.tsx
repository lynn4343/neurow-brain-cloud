"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import {
  type Note,
  NOTES,
  TAG_COLORS,
  SOURCE_LABELS,
  getUserData,
  todayFormatted,
} from "@/lib/demo-data";
import {
  MagnifyingGlass,
  Tag,
  Calendar,
  Circle,
  Plus,
  PencilSimple,
  Check,
  X,
  Trash,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// NoteListItem — left panel list entry
// ---------------------------------------------------------------------------

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
        isSelected ? "bg-white shadow-sm" : "hover:bg-white/60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-[13px] font-medium text-[#1E1E1E] leading-tight line-clamp-1">
          {note.title || "Untitled note"}
        </h3>
      </div>
      <p className="text-[12px] text-[#80807d] leading-relaxed line-clamp-2 mb-2">
        {note.preview || "New note..."}
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

// ---------------------------------------------------------------------------
// Safe text formatter — renders bold/italic via React elements (no innerHTML)
// ---------------------------------------------------------------------------

function renderFormattedText(text: string): React.ReactNode {
  // Split on **bold** and *italic* markers, return React elements
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match **bold** first (greedy)
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    // Match *italic*
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/);

    // Find whichever comes first
    const boldIdx = boldMatch?.index ?? Infinity;
    const italicIdx = italicMatch?.index ?? Infinity;

    if (boldIdx === Infinity && italicIdx === Infinity) {
      // No more markers
      parts.push(remaining);
      break;
    }

    if (boldIdx <= italicIdx && boldMatch) {
      // Add text before the match
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx));
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    } else if (italicMatch) {
      if (italicIdx > 0) parts.push(remaining.slice(0, italicIdx));
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicIdx + italicMatch[0].length);
    }
  }

  return parts;
}

// ---------------------------------------------------------------------------
// NoteContent — right panel read/edit view
// ---------------------------------------------------------------------------

interface NoteContentProps {
  note: Note;
  isEditing: boolean;
  editTitle: string;
  editContent: string;
  onEditTitleChange: (value: string) => void;
  onEditContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function NoteContent({
  note,
  isEditing,
  editTitle,
  editContent,
  onEditTitleChange,
  onEditContentChange,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}: NoteContentProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus title input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Small delay for render to settle
      const t = setTimeout(() => titleRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = contentRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing) autoResize();
  }, [isEditing, editContent, autoResize]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Note header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          {isEditing ? (
            <input
              ref={titleRef}
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Untitled note"
              className="flex-1 text-xl font-semibold text-[#1E1E1E] bg-transparent outline-none placeholder:text-[#C8C7C5]"
            />
          ) : (
            <h1 className="flex-1 text-xl font-semibold text-[#1E1E1E]">
              {note.title}
            </h1>
          )}

          {/* Action buttons */}
          {isEditing ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onDelete}
                className="flex items-center justify-center size-8 rounded-lg text-[#A0A09D] hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete note"
              >
                <Trash className="size-4" weight="regular" />
              </button>
              <button
                onClick={onCancel}
                className="flex items-center justify-center size-8 rounded-lg text-[#80807d] hover:text-[#1E1E1E] hover:bg-[#F4F1F1] transition-colors"
                aria-label="Cancel editing"
              >
                <X className="size-4" weight="bold" />
              </button>
              <button
                onClick={onSave}
                className="flex items-center justify-center size-8 rounded-lg text-[#4f5bb3] hover:text-white hover:bg-[#4f5bb3] transition-colors"
                aria-label="Save note"
              >
                <Check className="size-4" weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#80807d] hover:text-[#1E1E1E] hover:bg-[#F4F1F1] transition-colors flex-shrink-0"
              aria-label="Edit note"
            >
              <PencilSimple className="size-3.5" weight="regular" />
              Edit
            </button>
          )}
        </div>

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
        {note.tags.length > 0 && (
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
        )}
      </div>

      {/* Divider */}
      <div className="mx-8 h-px bg-[#E6E5E3]" />

      {/* Note body */}
      <ScrollArea className="flex-1">
        <div className="px-8 py-6 max-w-[640px]">
          {isEditing ? (
            <textarea
              ref={contentRef}
              value={editContent}
              onChange={(e) => {
                onEditContentChange(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Start writing..."
              className="w-full min-h-[200px] text-[13px] leading-relaxed text-[#3A3A3A] bg-transparent outline-none resize-none placeholder:text-[#C8C7C5]"
            />
          ) : (
            <div className="prose prose-sm prose-neutral">
              {note.content.split("\n\n").map((paragraph, i) => {
                if (paragraph.match(/^[-\d]/m)) {
                  const items = paragraph.split("\n");
                  return (
                    <div key={i} className="mb-4">
                      {items.map((item, j) => {
                        const cleaned = item.replace(/^[-\d.]\s*/, "");
                        return (
                          <p
                            key={j}
                            className="text-[13px] leading-relaxed text-[#3A3A3A] pl-4 mb-1"
                          >
                            {renderFormattedText(cleaned)}
                          </p>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <p
                    key={i}
                    className="text-[13px] leading-relaxed text-[#3A3A3A] mb-4"
                  >
                    {renderFormattedText(paragraph)}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Keyboard hint when editing */}
      {isEditing && (
        <div className="px-8 py-2 border-t border-[#E6E5E3] flex items-center gap-4 text-[11px] text-[#A0A09D]">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[#F4F1F1] text-[10px] font-mono">
              {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Enter
            </kbd>{" "}
            to save
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[#F4F1F1] text-[10px] font-mono">
              Esc
            </kbd>{" "}
            to cancel
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotesLayout — main component
// ---------------------------------------------------------------------------

export function NotesLayout() {
  const { activeUser } = useUser();

  // Mutable notes state (initialized from demo data)
  const [notes, setNotes] = useState<Note[]>(() =>
    getUserData(NOTES, activeUser?.slug)
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    notes[0]?.id ?? null
  );

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Reset when user switches
  const [prevSlug, setPrevSlug] = useState(activeUser?.slug);
  if (activeUser?.slug !== prevSlug) {
    setPrevSlug(activeUser?.slug);
    const freshNotes = getUserData(NOTES, activeUser?.slug);
    setNotes(freshNotes);
    setSelectedId(freshNotes[0]?.id ?? null);
    setIsEditing(false);
    setSearchQuery("");
  }

  // Derived state
  const filteredNotes = searchQuery.trim()
    ? notes.filter((n) => {
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
        );
      })
    : notes;

  const selectedNote = notes.find((n) => n.id === selectedId) || null;

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleNewNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "",
      preview: "",
      content: "",
      tags: [],
      date: todayFormatted(),
      source: "capture",
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
    setEditTitle("");
    setEditContent("");
    setIsEditing(true);
    setSearchQuery("");
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setIsEditing(true);
  }, [selectedNote]);

  const handleSave = useCallback(() => {
    if (!selectedId) return;
    const trimmedTitle = editTitle.trim();
    const trimmedContent = editContent.trim();

    if (!trimmedTitle && !trimmedContent) {
      // Empty note — delete it
      const remaining = notes.filter((n) => n.id !== selectedId);
      setNotes(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? {
                ...n,
                title: trimmedTitle || "Untitled note",
                content: trimmedContent,
                preview:
                  trimmedContent
                    .slice(0, 120)
                    .replace(/\n/g, " ")
                    .replace(/\*\*/g, "")
                    .replace(/\*/g, "") +
                  (trimmedContent.length > 120 ? "..." : ""),
              }
            : n
        )
      );
    }
    setIsEditing(false);
  }, [selectedId, editTitle, editContent, notes]);

  const handleCancel = useCallback(() => {
    if (!selectedId) return;
    const note = notes.find((n) => n.id === selectedId);
    // If the note was just created and is still empty, remove it
    if (note && !note.title && !note.content) {
      const remaining = notes.filter((n) => n.id !== selectedId);
      setNotes(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    }
    setIsEditing(false);
  }, [selectedId, notes]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const remaining = notes.filter((n) => n.id !== selectedId);
    setNotes(remaining);
    setSelectedId(remaining[0]?.id ?? null);
    setIsEditing(false);
  }, [selectedId, notes]);

  // When selecting a different note, exit edit mode
  const handleSelectNote = useCallback(
    (id: string) => {
      if (id !== selectedId && isEditing) {
        // Auto-save if there's content, otherwise discard
        const trimmedTitle = editTitle.trim();
        const trimmedContent = editContent.trim();
        if (selectedId && (trimmedTitle || trimmedContent)) {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === selectedId
                ? {
                    ...n,
                    title: trimmedTitle || "Untitled note",
                    content: trimmedContent,
                    preview:
                      trimmedContent
                        .slice(0, 120)
                        .replace(/\n/g, " ")
                        .replace(/\*\*/g, "")
                        .replace(/\*/g, "") +
                      (trimmedContent.length > 120 ? "..." : ""),
                  }
                : n
            )
          );
        } else if (selectedId) {
          // Empty new note — remove it
          const current = notes.find((n) => n.id === selectedId);
          if (current && !current.title && !current.content) {
            setNotes((prev) => prev.filter((n) => n.id !== selectedId));
          }
        }
        setIsEditing(false);
      }
      setSelectedId(id);
    },
    [selectedId, isEditing, editTitle, editContent, notes]
  );

  // Listen for external "new note" event (from sidebar dropdown)
  useEffect(() => {
    const handler = () => handleNewNote();
    window.addEventListener("neurow-create-note", handler);
    return () => window.removeEventListener("neurow-create-note", handler);
  }, [handleNewNote]);

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  if (notes.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#949494]">No notes yet</p>
        <button
          onClick={handleNewNote}
          className="flex items-center gap-1.5 rounded-lg bg-[#2D2D2D] px-4 py-2 text-sm font-medium text-white hover:bg-[#3A3A3A] active:scale-95 transition-all duration-200"
        >
          <Plus className="size-4" weight="bold" />
          Create your first note
        </button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel — note list */}
      <div className="w-[280px] flex flex-col bg-[#F4F1F1] border-r border-[#E6E5E3]">
        {/* Search bar */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 border border-[#E6E5E3] focus-within:border-[#4f5bb3] transition-colors">
            <MagnifyingGlass
              className="size-3.5 text-[#80807d]"
              weight="regular"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-[12px] text-[#1E1E1E] placeholder:text-[#A0A09D] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#A0A09D] hover:text-[#1E1E1E] transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3" weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* New note button + count */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] font-medium text-[#80807d] uppercase tracking-wider">
            {filteredNotes.length}{" "}
            {filteredNotes.length === 1 ? "note" : "notes"}
          </span>
          <button
            onClick={handleNewNote}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#80807d] hover:text-[#1E1E1E] hover:bg-white/60 transition-colors"
            aria-label="New note"
          >
            <Plus className="size-3" weight="bold" />
            New
          </button>
        </div>

        {/* Note list */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filteredNotes.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-[#A0A09D]">
                  No notes matching &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedId}
                  onClick={() => handleSelectNote(note.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel — note content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedNote ? (
          <NoteContent
            note={selectedNote}
            isEditing={isEditing}
            editTitle={editTitle}
            editContent={editContent}
            onEditTitleChange={setEditTitle}
            onEditContentChange={setEditContent}
            onSave={handleSave}
            onCancel={handleCancel}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[#949494]">
            Select a note to view
          </div>
        )}
      </div>
    </div>
  );
}
