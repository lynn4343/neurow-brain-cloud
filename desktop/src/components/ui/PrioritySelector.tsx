"use client";

import { Check } from "@phosphor-icons/react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBars, type Priority } from "@/components/ui/PriorityBars";
import { cn } from "@/lib/utils";

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
  className?: string;
}

const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  labelClass: string;
}[] = [
  { value: "Urgent", label: "Urgent", labelClass: "text-red-600" },
  { value: "High", label: "High", labelClass: "text-red-700" },
  { value: "Medium", label: "Medium", labelClass: "text-amber-600" },
  { value: "Low", label: "Low", labelClass: "text-yellow-500" },
  { value: "None", label: "No priority", labelClass: "text-[#949494]" },
];

function PriorityRadioItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-pointer items-center gap-3 rounded-md py-2 px-3 text-sm font-medium outline-none select-none",
        "hover:bg-[#F0EFED] focus:bg-[#F0EFED]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <span className="ml-auto flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={16} weight="bold" className="text-[#1E1E1E]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.RadioItem>
  );
}

export function PrioritySelector({
  value,
  onChange,
  disabled,
  className,
}: PrioritySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "cursor-pointer rounded px-2 py-1 -mx-1 transition-colors",
            "hover:bg-gray-50 outline-none focus:outline-none",
            "min-h-[36px] flex items-center",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <PriorityBars priority={value} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="min-w-[160px] p-1 bg-white border-[#E6E5E3] shadow-lg"
      >
        <DropdownMenuPrimitive.RadioGroup
          value={value}
          onValueChange={(val) => {
            const validPriorities: Priority[] = [
              "Urgent",
              "High",
              "Medium",
              "Low",
              "None",
            ];
            if (validPriorities.includes(val as Priority)) {
              onChange(val as Priority);
            }
          }}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <PriorityRadioItem key={option.value} value={option.value}>
              <PriorityBars
                priority={option.value}
                className="flex-shrink-0"
              />
              <span className={cn("flex-1", option.labelClass)}>
                {option.label}
              </span>
            </PriorityRadioItem>
          ))}
        </DropdownMenuPrimitive.RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
