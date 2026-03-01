"use client";

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollWheelPicker } from "./ScrollWheelPicker";
import { useState } from "react";
import { format, startOfToday } from "date-fns";

interface MonthYearPickerModalProps {
  currentMonth: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthYearPickerModal({ currentMonth, onSelect, onClose }: MonthYearPickerModalProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const clampedYear = Math.max(minYear, Math.min(maxYear, currentMonth.getFullYear()));

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth());
  const [selectedYear, setSelectedYear] = useState(clampedYear);

  const handleToday = () => {
    const today = startOfToday();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    onSelect(today);
  };

  const handleGo = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onSelect(newDate);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="w-[280px] max-w-[90vw] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 grid gap-4 rounded-lg border p-6 shadow-2xl duration-200"
        >
          <DialogPrimitive.Close
            onClick={onClose}
            className="absolute top-4 right-4 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <DialogHeader>
            <DialogTitle className="text-[12px] uppercase">Select Month & Year</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center gap-2">
            <div className="w-[120px]">
              <ScrollWheelPicker
                items={MONTHS}
                selectedIndex={selectedMonth}
                onChange={setSelectedMonth}
                height={200}
              />
            </div>

            <div className="w-[80px]">
              <ScrollWheelPicker
                items={years.map(String)}
                selectedIndex={years.indexOf(selectedYear)}
                onChange={(index) => setSelectedYear(years[index])}
                height={200}
              />
            </div>
          </div>

          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToday}
              className="w-[100px] text-[11px] uppercase h-7"
            >
              Today ({format(startOfToday(), "MMM")})
            </Button>
            <Button
              onClick={handleGo}
              className="w-[100px] bg-[#1E1E1E] hover:bg-[#2E2E2E] text-[11px] uppercase h-7"
            >
              Go
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
