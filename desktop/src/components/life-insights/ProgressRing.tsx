"use client";

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function ProgressRing({ completed, total, size = 40 }: ProgressRingProps) {
  const radius = (size / 2) - 4;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const dashArray = `${progress * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E6E5E3"
          strokeWidth="3"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6579EE"
          strokeWidth="3"
          strokeDasharray={dashArray}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="text-[11px] font-medium text-[#5F5E5B]">
        {completed}/{total}
      </span>
    </div>
  );
}
