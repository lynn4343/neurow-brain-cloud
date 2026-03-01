"use client";

export interface ActivityItem {
  tool_name: string;
  summary: string;
}

interface ActivityIndicatorProps {
  activities: ActivityItem[];
}

export function ActivityIndicator({ activities }: ActivityIndicatorProps) {
  if (activities.length === 0) return null;

  return (
    <div className="flex justify-start">
      <div className="px-4 py-2 space-y-1 text-muted-foreground">
        {activities.map((activity, i) => {
          const isLatest = i === activities.length - 1;
          return (
            <div key={`${activity.tool_name}-${i}`} className="flex items-center gap-2 text-sm">
              {isLatest ? (
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current opacity-40" />
              )}
              <span className={isLatest ? "" : "opacity-50"}>
                {activity.summary}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
