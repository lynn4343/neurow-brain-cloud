"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Cube,
  ClockCounterClockwise,
  CaretLeft,
  CaretDoubleLeft,
  CaretDown,
  CaretRight,
  Plus,
  FolderSimple,
  type IconProps,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSessions } from "@/contexts/SessionContext";
import { useChat } from "@/contexts/ChatContext";
import type { ChatSession, Workspace } from "@/types/sessions";
import { formatRelativeDate } from "@/lib/session-store";

// ---------------------------------------------------------------------------
// ChatSidebar
// ---------------------------------------------------------------------------

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ open, onToggle }: ChatSidebarProps) {
  // Section expand/collapse
  const [coachingOpen, setCoachingOpen] = useState(true);
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);

  // Per-workspace expand/collapse
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());

  // Inline workspace creation
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  // Data from contexts
  const {
    coachingSessions,
    workspaces,
    yourChats,
    getWorkspaceChats,
    createWorkspace,
    activeSessionId,
    setActiveSessionId,
  } = useSessions();
  const { loadMessages } = useChat();

  // --- Handlers ---

  const handleLoadSession = (session: ChatSession) => {
    loadMessages(session.messages);
    setActiveSessionId(session.id);
  };

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  const handleCreateWorkspace = () => {
    const name = newWorkspaceName.trim();
    if (!name) {
      setIsCreatingWorkspace(false);
      setNewWorkspaceName("");
      return;
    }
    const ws = createWorkspace(name);
    setNewWorkspaceName("");
    setIsCreatingWorkspace(false);
    if (ws) {
      setExpandedWorkspaces((prev) => new Set(prev).add(ws.id));
    }
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-[11px] bg-[#F4F1F1] transition-all duration-300 ease-in-out",
        open ? "w-[210px] px-2 pt-2 pb-6" : "w-[68px] p-4 hover:bg-[#EBE8E8]"
      )}
    >
      {/* Header / Toggle Button */}
      {open && (
        <div className="flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/70 active:scale-95"
                aria-label="Collapse chat sidebar"
              >
                <CaretDoubleLeft className="size-[14px]" weight="bold" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Collapse sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      {!open && (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/70 active:scale-95 mt-[8px]"
                aria-label="Expand chat sidebar"
              >
                <CaretLeft
                  className="size-[18px] transition-transform duration-300 rotate-180"
                  weight="bold"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {/* ======================= Coaching Sessions ======================= */}
        <SectionHeader
          icon={() => (
            <svg
              width="20"
              height="20"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
            >
              <path
                d="M12.8959 3.28778C13.1937 3.69962 13.5368 4.10117 13.8204 4.5233C13.8838 4.617 14.0328 4.78791 13.9935 4.88264L7.03147 13L0 4.82292L2.61881 1.20901L2.86631 1H11.1433C11.257 1.02265 11.3686 1.17091 11.4411 1.25946C11.9411 1.87413 12.424 2.63604 12.8959 3.28778ZM6.05256 1.76808H3.16713L1.25961 4.33489L1.31092 4.43682H3.66917L6.00427 1.95033L6.05256 1.76808ZM12.7249 4.43785L12.6987 4.23399L10.8435 1.76912H7.95809L8.01339 1.94312L10.3414 4.43785H12.7249ZM4.79798 4.43785H9.21365C9.22773 4.35754 9.20564 4.31944 9.16637 4.25561C9.09893 4.14956 8.75492 3.79743 8.63818 3.66668C8.11201 3.08392 7.55866 2.51249 6.98821 1.9771L4.84627 4.25458L4.79798 4.43682V4.43785ZM3.51825 5.15651H1.41052L1.33507 5.28418L5.62397 10.2386L3.51724 5.15651H3.51825ZM9.4893 5.15651H4.52231C4.37845 5.15651 4.50219 5.45098 4.52332 5.51481C5.16319 7.4237 6.22862 9.33258 6.89565 11.2497L7.05562 11.4186L9.56078 5.24094L9.4893 5.15651ZM12.6001 5.15651H10.4924L8.36051 10.2376C8.38866 10.2726 8.67839 9.97197 8.70763 9.93904C9.938 8.55624 11.3315 6.98509 12.4733 5.53952C12.5418 5.45304 12.594 5.35419 12.6535 5.2605L12.6001 5.15548V5.15651Z"
                fill="currentColor"
              />
            </svg>
          )}
          label="Coaching Sessions"
          expanded={open}
          isOpen={coachingOpen}
          onToggle={() => setCoachingOpen((p) => !p)}
        />
        {coachingOpen && open && (
          <div className="flex flex-col">
            {coachingSessions.length === 0 ? (
              <div className="px-[34px] py-1 text-xs text-[#949494]">No sessions yet</div>
            ) : (
              coachingSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onClick={() => handleLoadSession(session)}
                />
              ))
            )}
          </div>
        )}

        {/* ======================= Workspaces ======================= */}
        <SectionHeader
          icon={Cube}
          label="Workspaces"
          expanded={open}
          isOpen={workspacesOpen}
          onToggle={() => setWorkspacesOpen((p) => !p)}
        />
        {workspacesOpen && open && (
          <div className="flex flex-col">
            {/* New workspace action */}
            <button
              type="button"
              onClick={() => setIsCreatingWorkspace(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg py-0.5 text-sm text-[#949494] hover:text-[#1E1E1E] hover:bg-white/50 transition-all"
              style={{ padding: "2px 8px 2px 34px" }}
            >
              <Plus className="size-3.5" weight="regular" />
              <span>New workspace</span>
            </button>

            {/* Inline workspace name input */}
            {isCreatingWorkspace && (
              <div className="px-[34px] py-1">
                <input
                  autoFocus
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateWorkspace();
                    if (e.key === "Escape") {
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName("");
                    }
                  }}
                  onBlur={handleCreateWorkspace}
                  placeholder="Workspace name..."
                  className="w-full text-sm bg-white rounded px-2 py-1 border border-[#E6E5E3] outline-none focus:border-[#1E1E1E] transition-colors"
                />
              </div>
            )}

            {/* Workspace folders */}
            {workspaces.map((ws) => {
              const isExpanded = expandedWorkspaces.has(ws.id);
              const chats = getWorkspaceChats(ws.id);
              return (
                <div key={ws.id}>
                  <WorkspaceFolder
                    workspace={ws}
                    isExpanded={isExpanded}
                    chatCount={chats.length}
                    onClick={() => toggleWorkspace(ws.id)}
                  />
                  {isExpanded &&
                    chats.map((chat) => (
                      <SessionItem
                        key={chat.id}
                        session={chat}
                        isActive={activeSessionId === chat.id}
                        onClick={() => handleLoadSession(chat)}
                        indent={2}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ======================= Your Chats ======================= */}
        <SectionHeader
          icon={ClockCounterClockwise}
          label="Your Chats"
          expanded={open}
          isOpen={chatsOpen}
          onToggle={() => setChatsOpen((p) => !p)}
        />
        {chatsOpen && open && (
          <div className="flex flex-col">
            {yourChats.length === 0 ? (
              <div className="px-[34px] py-1 text-xs text-[#949494]">No chats yet</div>
            ) : (
              yourChats.slice(0, 10).map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onClick={() => handleLoadSession(session)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// SectionHeader — clickable expand/collapse header with caret
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  icon: React.ComponentType<IconProps> | (() => React.JSX.Element);
  label: string;
  expanded: boolean; // sidebar expanded
  isOpen: boolean; // section expanded
  onToggle: () => void;
}

function SectionHeader({ icon: Icon, label, expanded, isOpen, onToggle }: SectionHeaderProps) {
  const content = (
    <>
      <div className="flex w-[28px] items-center justify-center rounded-md p-1 transition-transform duration-200">
        {typeof Icon === "function" && Icon.length === 0 ? (
          <Icon />
        ) : (
          <Icon className="size-4" weight="regular" />
        )}
      </div>
      {expanded && (
        <>
          <span className="flex-1 text-left transition-opacity duration-150 delay-150 opacity-100 truncate overflow-hidden whitespace-nowrap">
            {label}
          </span>
          {isOpen ? (
            <CaretDown className="size-3 flex-shrink-0 text-[#949494]" weight="bold" />
          ) : (
            <CaretRight className="size-3 flex-shrink-0 text-[#949494]" weight="bold" />
          )}
        </>
      )}
    </>
  );

  const className = cn(
    "flex items-center gap-2 rounded-lg transition-all duration-200 min-w-0 h-9 font-medium",
    expanded
      ? "px-1.5 text-sm leading-5 text-[#1E1E1E] hover:bg-white/70 hover:shadow-sm active:scale-95 cursor-pointer"
      : "justify-center text-[#1E1E1E]"
  );

  if (expanded) {
    return (
      <button type="button" onClick={onToggle} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className} role="heading" aria-level={2}>
          {content}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// SessionItem — single session row (coaching session or chat)
// ---------------------------------------------------------------------------

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  indent?: 1 | 2;
}

function SessionItem({ session, isActive, onClick, indent = 1 }: SessionItemProps) {
  const paddingLeft = indent === 2 ? "46px" : "34px";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-full items-center rounded-lg py-0.5 transition-all duration-200 active:scale-95",
        isActive ? "bg-white shadow-sm" : "hover:bg-white/70"
      )}
    >
      <div
        className="flex h-[34px] flex-1 items-center gap-1.5 min-w-0"
        style={{ paddingLeft, paddingRight: "8px" }}
      >
        <span className="flex-1 truncate text-left text-sm font-normal leading-5 text-[#1E1E1E]">
          {session.title}
        </span>
        <span className="flex-shrink-0 text-[10px] text-[#949494]">
          {formatRelativeDate(session.createdAt)}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// WorkspaceFolder — folder row with expand/collapse
// ---------------------------------------------------------------------------

interface WorkspaceFolderProps {
  workspace: Workspace;
  isExpanded: boolean;
  chatCount: number;
  onClick: () => void;
}

function WorkspaceFolder({ workspace, isExpanded, chatCount, onClick }: WorkspaceFolderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full items-center gap-0 rounded-lg py-0.5 transition-all duration-200 hover:bg-white/70 active:scale-95"
    >
      {/* Tree connector */}
      <div className="relative flex h-7 w-6 items-center justify-end pl-[10px]">
        <div className="absolute left-[20px] top-[-2px] h-8 w-px bg-[#E6E5E3]" />
      </div>
      <div
        className="flex h-[34px] flex-1 items-center gap-1.5 min-w-0"
        style={{ paddingLeft: "6px", paddingRight: "8px" }}
      >
        <FolderSimple className="size-3.5 flex-shrink-0" weight="regular" />
        <span className="flex-1 truncate text-left text-sm font-normal leading-5 text-[#1E1E1E]">
          {workspace.name}
        </span>
        {chatCount > 0 && (
          <span className="flex-shrink-0 text-[10px] text-[#949494] mr-1">
            {chatCount}
          </span>
        )}
        {chatCount > 0 &&
          (isExpanded ? (
            <CaretDown className="size-3 flex-shrink-0 text-[#949494]" weight="bold" />
          ) : (
            <CaretRight className="size-3 flex-shrink-0 text-[#949494]" weight="bold" />
          ))}
      </div>
    </button>
  );
}
