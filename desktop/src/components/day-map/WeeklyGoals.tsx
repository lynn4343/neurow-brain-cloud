"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { WEEKLY_TARGETS, MONTHLY_TARGETS, getUserData } from "@/lib/demo-data";

const SLOT_COUNT = 3;

function EditableTarget({
  index,
  value,
  placeholder,
  onChange,
}: {
  index: number;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const cancelledRef = useRef(false);

  const commit = useCallback(() => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    setEditing(false);
    onChange(draft.trim());
  }, [draft, onChange]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setEditing(false);
    setDraft(value);
  }, [value]);

  const isEmpty = !value;

  if (editing) {
    return (
      <div className="flex items-baseline gap-2 text-xs">
        <span className="font-medium text-[#949494]">{index + 1}.</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-xs text-[#1E1E1E] outline-none border-b border-[#E6E5E3] focus:border-[#949494] py-0.5 transition-colors"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-baseline gap-2 text-xs cursor-text rounded px-0.5 -mx-0.5 hover:bg-[#FAF8F8] transition-colors"
      onDoubleClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      <span className="font-medium text-[#949494]">{index + 1}.</span>
      <span className={isEmpty ? "text-[#949494]" : "text-[#1E1E1E]"}>
        {isEmpty ? placeholder : value}
      </span>
    </div>
  );
}

export function WeeklyGoals() {
  const { activeUser } = useUser();
  const initialWeekly = getUserData(WEEKLY_TARGETS, activeUser?.slug);
  const initialMonthly = getUserData(MONTHLY_TARGETS, activeUser?.slug);

  // Pad to SLOT_COUNT so empty profiles get editable placeholder rows
  const pad = (arr: string[]) => {
    const copy = [...arr];
    while (copy.length < SLOT_COUNT) copy.push("");
    return copy;
  };

  const [weekly, setWeekly] = useState(() => pad(initialWeekly));
  const [monthly, setMonthly] = useState(() => pad(initialMonthly));

  // Reset when user switches (React pattern: adjust state during render)
  const [prevSlug, setPrevSlug] = useState(activeUser?.slug);
  if (activeUser?.slug !== prevSlug) {
    setPrevSlug(activeUser?.slug);
    setWeekly(pad(getUserData(WEEKLY_TARGETS, activeUser?.slug)));
    setMonthly(pad(getUserData(MONTHLY_TARGETS, activeUser?.slug)));
  }

  const updateWeekly = (i: number, val: string) =>
    setWeekly((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  const updateMonthly = (i: number, val: string) =>
    setMonthly((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  return (
    <div className="space-y-4">
      {/* Weekly Targets */}
      <div className="rounded-lg border border-[#E6E5E3] bg-white p-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494] mb-2">
          Weekly Targets
        </h3>
        <div className="space-y-1.5">
          {weekly.map((target, i) => (
            <EditableTarget
              key={i}
              index={i}
              value={target}
              placeholder="Set your targets"
              onChange={(val) => updateWeekly(i, val)}
            />
          ))}
        </div>
      </div>

      {/* Monthly Targets */}
      <div className="rounded-lg border border-[#E6E5E3] bg-white p-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#949494] mb-2">
          Monthly Targets
        </h3>
        <div className="space-y-1.5">
          {monthly.map((target, i) => (
            <EditableTarget
              key={i}
              index={i}
              value={target}
              placeholder="Set your targets"
              onChange={(val) => updateMonthly(i, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
