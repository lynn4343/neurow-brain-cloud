import { type SVGProps } from "react";

/**
 * Thin-line brain icon for Brain Cloud branding.
 * Custom SVG — not from Phosphor (their brain icon doesn't fit the aesthetic).
 */
export function BrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Left hemisphere */}
      <path d="M9.5 2a3.5 3.5 0 0 0-3.4 2.7A3 3 0 0 0 3 7.5a3 3 0 0 0 1.1 2.3A3.5 3.5 0 0 0 3 12.5a3.5 3.5 0 0 0 1.5 2.9A3.5 3.5 0 0 0 6 19a3.5 3.5 0 0 0 3.5 3h.5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
      {/* Right hemisphere */}
      <path d="M14.5 2a3.5 3.5 0 0 1 3.4 2.7A3 3 0 0 1 21 7.5a3 3 0 0 1-1.1 2.3A3.5 3.5 0 0 1 21 12.5a3.5 3.5 0 0 1-1.5 2.9A3.5 3.5 0 0 1 18 19a3.5 3.5 0 0 1-3.5 3H14a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      {/* Folds — left */}
      <path d="M3.5 9.5h5" />
      <path d="M4 14.5h4.5" />
      {/* Folds — right */}
      <path d="M15.5 9.5h5" />
      <path d="M15.5 14.5H20" />
    </svg>
  );
}
