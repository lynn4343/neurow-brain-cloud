"use client";

import { cn } from "@/lib/utils";
import {
  Cube,
  Briefcase,
  House,
  Heartbeat,
  Users,
  Laptop,
  ClockCounterClockwise,
  CaretLeft,
  CaretDoubleLeft,
  type IconProps,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatWorkspace {
  icon: React.ComponentType<IconProps>;
  label: string;
}

const chatWorkspaces: ChatWorkspace[] = [
  { icon: Briefcase, label: "Business" },
  { icon: Laptop, label: "Freelance" },
  { icon: House, label: "Home" },
  { icon: Heartbeat, label: "Health" },
  { icon: Users, label: "Relationships" },
];

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ open, onToggle }: ChatSidebarProps) {
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
      <div className="flex flex-col gap-0.5">
        {/* Neurow Sessions - PROTECTED HEADER */}
        <ChatNavItem
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
          isHeader
        />

        {/* Chat Workspaces - PROTECTED HEADER */}
        {open ? (
          <div className="flex flex-col gap-0">
            <ChatNavItem
              icon={Cube}
              label="Chat Workspaces"
              expanded={open}
              isHeader
            />

            {/* Workspace Items */}
            <div className="flex flex-col pt-0">
              {chatWorkspaces.map((workspace) => (
                <WorkspaceItem
                  key={workspace.label}
                  icon={workspace.icon}
                  label={workspace.label}
                />
              ))}
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-lg py-0.5 text-sm font-normal leading-5 text-[#80807d] hover:bg-white/50 min-w-0"
                style={{ padding: "2px 8px 2px 34px" }}
              >
                <span className="flex-1 truncate text-left">See all</span>
              </button>
            </div>
          </div>
        ) : (
          <ChatNavItem
            icon={Cube}
            label="Chat Workspaces"
            expanded={open}
            isHeader
          />
        )}

        {/* History - PROTECTED HEADER */}
        <ChatNavItem
          icon={ClockCounterClockwise}
          label="History"
          expanded={open}
          isHeader
        />
      </div>
    </aside>
  );
}

interface ChatNavItemProps {
  icon: React.ComponentType<IconProps> | (() => React.JSX.Element);
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isHeader?: boolean;
  height?: string;
}

function ChatNavItem({
  icon: Icon,
  label,
  active = false,
  expanded,
  isHeader = false,
  height = "h-9",
  onClick,
  disabled = false,
}: ChatNavItemProps) {
  const interactive = typeof onClick === "function" && !disabled;

  const content = (
    <>
      <div
        className={cn(
          "flex items-center justify-center rounded-md p-1 transition-transform duration-200",
          label === "New Chat"
            ? "w-[34px]"
            : isHeader
            ? "w-[28px]"
            : "w-[24px] size-6"
        )}
      >
        {typeof Icon === "function" && Icon.length === 0 ? (
          <Icon />
        ) : (
          <Icon
            className={isHeader ? "size-4" : "size-3.5"}
            weight="regular"
          />
        )}
      </div>
      {expanded && (
        <span className="flex-1 text-left transition-opacity duration-150 delay-150 opacity-100 truncate overflow-hidden whitespace-nowrap">
          {label}
        </span>
      )}
    </>
  );

  const baseClassName = cn(
    "flex items-center gap-2 rounded-lg transition-all duration-200 min-w-0",
    height,
    label === "New Chat"
      ? "mt-[10px]"
      : label === "Neurow Sessions"
      ? "mt-[12px]"
      : "",
    expanded
      ? label === "New Chat"
        ? "w-full pl-[6px] pr-6 text-sm leading-5"
        : "px-1.5 text-sm leading-5"
      : "justify-center",
    expanded && (active || label === "New Chat")
      ? "font-medium"
      : expanded && isHeader
      ? "font-medium"
      : expanded
      ? "font-normal"
      : "",
    disabled
      ? "opacity-50 cursor-not-allowed text-[#7F7F7F]"
      : active
      ? "bg-white text-[#1E1E1E] shadow-sm"
      : "text-[#1E1E1E] hover:bg-white/70 hover:shadow-sm active:scale-95"
  );

  const element = interactive ? (
    <button type="button" onClick={onClick} className={baseClassName}>
      {content}
    </button>
  ) : (
    <div
      className={baseClassName}
      role={isHeader ? "heading" : "presentation"}
    >
      {content}
    </div>
  );

  if (expanded) {
    return element;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface WorkspaceItemProps {
  icon: React.ComponentType<IconProps>;
  label: string;
}

function WorkspaceItem({ icon: Icon, label }: WorkspaceItemProps) {
  return (
    <button
      type="button"
      className="flex h-8 items-center gap-0 rounded-lg py-0.5 transition-all duration-200 hover:bg-white/70 active:scale-95"
    >
      <div className="relative flex h-7 w-6 items-center justify-end pl-[10px]">
        <div className="absolute left-[20px] top-[-2px] h-8 w-px bg-[#E6E5E3]" />
      </div>
      <div
        className="flex h-[34px] flex-1 items-center gap-1.5 min-w-0"
        style={{ paddingLeft: "6px", paddingRight: "8px" }}
      >
        <div className="flex size-6 items-center justify-center rounded-md p-1 transition-transform duration-200 -ml-[1px]">
          <Icon className="size-3.5" weight="regular" />
        </div>
        <span className="flex-1 truncate text-left text-sm font-normal leading-5 text-[#1E1E1E]">
          {label}
        </span>
      </div>
    </button>
  );
}
