"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  House,
  CalendarCheck,
  Cards,
  Note,
  BookOpen,
  Headphones,
  Question,
  PlusCircle,
  Chat,
  CaretRight,
  CaretDoubleLeft,
  SignOut,
  type IconProps,
} from "@phosphor-icons/react";

export type View = "home" | "daymap" | "chat" | "projects" | "notes";

interface NavItem {
  icon: React.ComponentType<IconProps> | (() => React.JSX.Element);
  label: string;
  viewId?: View;
}

const mainNavItems: NavItem[] = [
  { icon: House, label: "Neurow Center", viewId: "home" },
  { icon: CalendarCheck, label: "Calendar", viewId: "daymap" },
  { icon: Cards, label: "Projects", viewId: "projects" },
  { icon: Note, label: "Notes", viewId: "notes" },
  { icon: Chat, label: "Neurow Chat", viewId: "chat" },
];

const resourceNavItems: NavItem[] = [
  { icon: BookOpen, label: "Learn" },
  { icon: Headphones, label: "Neurow RX" },
  { icon: Question, label: "Help Center" },
];

interface MainNavSidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function MainNavSidebar({
  activeView,
  onViewChange,
  sidebarOpen,
  onToggleSidebar,
}: MainNavSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-6 bg-white transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[210px] px-4 pt-4 pb-6" : "w-[68px] px-4 pt-2 pb-4"
      )}
    >
      {/* Logo / Header */}
      <div
        className={cn(
          "flex items-center gap-2.5 transition-all duration-300",
          sidebarOpen ? "justify-between pl-[9px]" : "justify-center"
        )}
      >
        {sidebarOpen && (
          <button className="flex-1 cursor-pointer" onClick={onToggleSidebar}>
            <Image
              src="/logo_softblack.svg"
              alt="Neurow"
              width={102}
              height={28}
              className="h-7 w-auto transition-opacity duration-200 ml-1"
            />
          </button>
        )}

        {!sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleSidebar}
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/70 active:scale-95 mt-[8px]"
                aria-label="Expand main sidebar"
              >
                <svg
                  width="25"
                  height="36"
                  viewBox="0 0 25 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <path
                    d="M12.4942 30.3973C5.61033 30.4176 0.0449081 24.9304 0.000265716 18.0763C-0.0443766 11.2543 5.54188 5.67393 12.4465 5.64485C19.3423 5.61287 24.997 11.1699 25 17.9804C25.0029 24.8751 19.4643 30.3741 12.4942 30.3973ZM20.7006 22.1353C20.5964 17.9246 19.4942 14.604 16.9615 11.2409C15.2045 8.90799 13.8079 7.96157 11.8032 7.10322C9.20425 6.2239 6.46474 7.34335 5.18078 9.63426C3.89685 12.2753 4.05452 16.0609 4.88795 18.7459C6.71247 23.7859 8.26672 25.3076 8.91996 26.1629C9.94376 27.5035 12.0284 28.716 13.4024 29.1781C15.7 29.6623 17.457 29.2662 19.0112 27.5495C19.8125 26.6645 20.4303 25.5687 20.7006 22.1353Z"
                    fill="black"
                  />
                  <path
                    d="M12.312 35.9917L12.3177 36C13.1152 35.489 13.8986 34.9559 14.6565 34.3786C15.0354 34.0885 15.4059 33.7903 15.7707 33.4836C16.1327 33.1715 16.4834 32.8483 16.8256 32.5086C17.5043 31.829 18.1406 31.086 18.6384 30.2325C18.8872 29.8071 19.1022 29.3541 19.2605 28.8763C19.3425 28.6387 19.4048 28.3929 19.4557 28.1443C19.5066 27.8956 19.5405 27.6443 19.5575 27.3902C19.6338 26.3902 19.4811 25.3765 19.17 24.4346C18.8561 23.4899 18.3923 22.6087 17.8578 21.7967C17.3177 20.9846 16.7125 20.2305 16.079 19.5095C15.4455 18.7914 14.7866 18.1036 14.1248 17.4296C12.8012 16.0844 11.4523 14.7862 10.2787 13.3885C9.69325 12.6897 9.1644 11.9604 8.72041 11.2036C8.27925 10.4467 7.92857 9.65393 7.74756 8.82527C7.65425 8.41094 7.61185 7.98558 7.61463 7.55743C7.61746 7.12653 7.66553 6.69563 7.76451 6.27021C7.81542 6.05756 7.87483 5.84762 7.95119 5.64045C8.02755 5.43329 8.11519 5.22888 8.21417 5.03C8.40935 4.62672 8.65539 4.24553 8.9297 3.88368C9.48396 3.15998 10.1599 2.51638 10.8867 1.93632C11.4043 1.52198 11.9501 1.1408 12.51 0.778944L22.1592 13.0211L22.8323 12.5156L13.0275 0.0635311L12.9823 0C12.1904 0.516535 11.3957 1.03583 10.6321 1.60485C9.86859 2.17387 9.13611 2.79813 8.49133 3.52183C8.17177 3.88644 7.87199 4.27316 7.60618 4.68749C7.34314 5.10458 7.11973 5.5493 6.94155 6.01888C6.76338 6.48846 6.64178 6.98015 6.57676 7.48287C6.51173 7.98558 6.5089 8.49933 6.55981 9.01039C6.67007 10.0296 7.02925 11.0047 7.51003 11.8748C7.99076 12.7504 8.59031 13.5321 9.21531 14.2696C9.84314 15.0072 10.5021 15.6977 11.1752 16.3689C11.8482 17.0401 12.5241 17.6948 13.1944 18.3467C13.8646 18.9985 14.5235 19.656 15.1485 20.3327C15.7735 21.0095 16.3618 21.7111 16.8765 22.4513C17.3968 23.1861 17.8409 23.965 18.1434 24.7882C18.2961 25.1997 18.4121 25.6196 18.4857 26.0477C18.5592 26.4759 18.5902 26.9096 18.579 27.3432C18.5733 27.5559 18.5535 27.7714 18.5196 27.9813C18.4857 28.194 18.4432 28.4039 18.381 28.6111C18.2651 29.0282 18.0925 29.4342 17.8889 29.8265C17.4704 30.6109 16.9245 31.3484 16.3109 32.0307C15.6972 32.7158 15.0213 33.3566 14.32 33.9726C13.8222 34.4062 13.3075 34.8233 12.7871 35.2321L3.13785 22.9872L2.46478 23.4927L12.312 35.9917Z"
                    fill="black"
                  />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}

        {sidebarOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleSidebar}
                className="flex size-9 items-center justify-center rounded-lg transition-all duration-200 hover:bg-white active:scale-95"
                aria-label="Collapse main sidebar"
              >
                <CaretDoubleLeft
                  className="size-[14px]"
                  weight="bold"
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Collapse sidebar</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-5">
        {/* New Button */}
        {sidebarOpen ? (
          <button className="flex h-[36px] items-center gap-2 rounded-lg bg-[#2D2D2D] px-3 text-sm font-medium text-white hover:bg-[#3A3A3A] active:scale-95 transition-all duration-200">
            <PlusCircle className="size-4 text-white" weight="fill" />
            <span>New</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex size-9 items-center justify-center rounded-lg bg-[#2D2D2D] hover:bg-[#3A3A3A] active:scale-95 transition-all duration-200">
                <PlusCircle className="size-4 text-white" weight="fill" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="h-px bg-[#E6E5E3]" />

        {/* Main Navigation */}
        <nav className="flex flex-col gap-0">
          {mainNavItems.map((item) => (
            <NavItemButton
              key={item.label}
              icon={item.icon}
              label={item.label}
              viewId={item.viewId}
              active={item.viewId ? activeView === item.viewId : false}
              expanded={sidebarOpen}
              onViewChange={onViewChange}
            />
          ))}
        </nav>

        <div className="h-px bg-[#E6E5E3] mt-[17px]" />

        {/* Resources */}
        <nav className="flex flex-col gap-0">
          {resourceNavItems.map((item) => (
            <NavItemButton
              key={item.label}
              icon={item.icon}
              label={item.label}
              viewId={item.viewId}
              active={false}
              expanded={sidebarOpen}
              onViewChange={onViewChange}
            />
          ))}
        </nav>
      </div>

      {/* Spacer to push sign out to bottom */}
      <div className="flex-1" />

      {/* Sign Out */}
      <div className="border-t border-[#E6E5E3] pt-4">
        <NavItemButton
          icon={SignOut}
          label="Sign Out"
          expanded={sidebarOpen}
          onClick={() => {
            console.log("Sign out clicked (no-op in desktop)");
          }}
        />
      </div>
    </aside>
  );
}

interface NavItemButtonProps {
  icon: React.ComponentType<IconProps> | (() => React.JSX.Element);
  label: string;
  viewId?: View;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
  onViewChange?: (view: View) => void;
}

function NavItemButton({
  icon: Icon,
  label,
  viewId,
  active = false,
  expanded,
  onClick,
  onViewChange,
}: NavItemButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (viewId && onViewChange) {
      onViewChange(viewId);
    }
  };

  const buttonContent = (
    <button
      onClick={handleClick}
      className={cn(
        "flex h-[44px] items-center gap-2 relative",
        expanded
          ? "px-1.5 text-sm font-medium leading-5"
          : "justify-center rounded-lg",
        active && expanded
          ? "bg-[#F4F1F1] text-[#1E1E1E] rounded-l-lg -mr-4 pr-[calc(1.5rem+16px)] shadow-md after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-[#F4F1F1]"
          : active && !expanded
          ? "bg-[#F4F1F1] text-[#1E1E1E] -ml-2 pl-2 pr-4 -mr-4 rounded-l-lg rounded-r-none shadow-md after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[16px] after:bg-[#F4F1F1]"
          : expanded
          ? "text-[#1E1E1E] hover:bg-[#EBE7E7] hover:rounded-l-lg hover:-mr-4 hover:pr-[calc(1.5rem+16px)] hover:shadow-md active:scale-95"
          : "text-[#1E1E1E] hover:bg-[#EBE7E7] hover:shadow-md active:scale-95 rounded-lg"
      )}
    >
      <div className="flex size-7 items-center justify-center rounded-lg p-1 transition-transform duration-200">
        {typeof Icon === "function" && Icon.length === 0 ? (
          <Icon />
        ) : (
          <Icon className="size-7" weight="fill" />
        )}
      </div>
      {expanded && (
        <span className="flex-1 truncate text-left transition-opacity duration-150 delay-150 opacity-100">
          {label}
        </span>
      )}
    </button>
  );

  if (expanded) {
    return buttonContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
