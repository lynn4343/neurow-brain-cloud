import { cn } from "@/lib/utils";
import { formatEventTime } from "@/lib/event-layout";
import type { EventPosition } from "@/lib/event-layout";
import type { CalendarEvent } from "@/lib/demo-data";
import { EVENT_CATEGORY_COLORS, DEFAULT_EVENT_COLOR } from "@/lib/demo-data";

interface EventBlockProps {
  event: CalendarEvent;
  position: EventPosition;
  compact?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export function EventBlock({ event, position, compact, onEventClick }: EventBlockProps) {
  const colors = EVENT_CATEGORY_COLORS[event.category] ?? DEFAULT_EVENT_COLOR;

  return (
    <div
      role="article"
      aria-label={`${event.title}, ${formatEventTime(event.startTime)} to ${formatEventTime(event.endTime)}`}
      title={event.title}
      tabIndex={0}
      onClick={() => onEventClick?.(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEventClick?.(event);
        }
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute pointer-events-auto overflow-hidden rounded-r-md cursor-pointer transition-colors",
        compact ? "px-1 py-0.5" : "px-1.5 py-1",
        colors.bg,
        colors.accent,
        colors.hover,
      )}
      style={{
        top: `${position.top}px`,
        height: `${position.height}px`,
        left: `${(position.column / position.totalColumns) * 100}%`,
        width: `${(1 / position.totalColumns) * 100}%`,
        borderLeftWidth: "3px",
      }}
    >
      <p
        className={cn(
          "truncate font-medium leading-tight",
          compact ? "text-[10px]" : "text-[11px]",
          colors.text,
        )}
      >
        {event.title}
      </p>
      {!compact && position.height >= 36 && (
        <p className={cn("truncate text-[10px] opacity-70", colors.text)}>
          {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
          {event.location && ` · ${event.location}`}
        </p>
      )}
    </div>
  );
}
