"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, useState, useCallback } from "react";

interface ScrollWheelPickerProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  height?: number;
}

export function ScrollWheelPicker({
  items,
  selectedIndex,
  onChange,
  height = 200,
}: ScrollWheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const itemHeight = 32;

  // Scroll to selected item on mount (instant) and when selectedIndex changes externally
  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      const scrollTop = selectedIndex * itemHeight;
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: isInitialMount ? "auto" : "smooth",
      });
      if (isInitialMount) {
        setIsInitialMount(false);
      }
    }
  }, [selectedIndex, itemHeight, isInitialMount, isScrolling]);

  // Snap to nearest item after scrolling stops
  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));

    if (clampedIndex !== selectedIndex) {
      onChange(clampedIndex);
    }

    const targetScroll = clampedIndex * itemHeight;
    if (Math.abs(scrollTop - targetScroll) > 1) {
      containerRef.current.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }

    setIsScrolling(false);
  }, [itemHeight, items.length, onChange, selectedIndex]);

  // Handle scroll events with debouncing
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      snapToNearest();
    }, 150);
  }, [snapToNearest]);

  // Handle direct item clicks
  const handleItemClick = useCallback(
    (index: number) => {
      if (!containerRef.current) return;

      setIsScrolling(true);
      onChange(index);

      containerRef.current.scrollTo({
        top: index * itemHeight,
        behavior: "smooth",
      });

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    },
    [itemHeight, onChange]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" style={{ height }}>
      {/* Scrollable container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide relative z-10"
        style={{
          paddingTop: (height - itemHeight) / 2,
          paddingBottom: (height - itemHeight) / 2,
          scrollSnapType: "y mandatory",
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => handleItemClick(index)}
            className={cn(
              "flex items-center justify-center cursor-pointer transition-all duration-200",
              "text-[12px] font-normal",
              index === selectedIndex
                ? "text-[#000000] font-bold"
                : "text-[#5F5E5B]"
            )}
            style={{
              height: itemHeight,
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Selection highlight (centered) */}
      <div
        className="absolute left-0 right-0 bg-[#F0EFED] rounded-[6px] pointer-events-none z-0"
        style={{
          top: (height - itemHeight) / 2,
          height: itemHeight,
        }}
      />

      {/* Fade overlays (top/bottom) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
    </div>
  );
}
