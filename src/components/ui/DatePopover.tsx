"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDateValue(value: string) {
  if (!value) return new Date();
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function DatePopover({
  value,
  onChange,
  min,
}: {
  value: string;
  onChange: (next: string) => void;
  min?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minDate = useMemo(() => (min ? parseDateValue(min) : null), [min]);
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  function isDisabled(day: Date) {
    if (!minDate) return false;
    return day < startOfDay(minDate);
  }

  function startOfDay(day: Date) {
    const copy = new Date(day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            if (!prev) setViewDate(selectedDate);
            return !prev;
          });
        }}
        className="flex w-full items-center justify-between rounded-lg border border-parchment-line bg-white/80 px-3 py-2.5 text-left text-sm text-ink-text outline-none transition hover:border-brass focus:border-brass focus:ring-2 focus:ring-brass/30"
      >
        <span>{format(selectedDate, "dd MMM yyyy")}</span>
        <CalendarDays size={15} className="text-ink-text/45" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[90] w-[280px] rounded-xl border border-ink-line/15 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((d) => addMonths(d, -1))}
              className="rounded-md p-1.5 text-ink-text/50 transition hover:bg-ink-text/5 hover:text-ink-text"
            >
              <ChevronLeft size={15} />
            </button>
            <p className="text-sm font-medium text-ink-text">{format(viewDate, "MMMM yyyy")}</p>
            <button
              type="button"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              className="rounded-md p-1.5 text-ink-text/50 transition hover:bg-ink-text/5 hover:text-ink-text"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="pb-1 text-center text-[10px] font-mono uppercase tracking-wider text-ink-text/35">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const selected = isSameDay(day, selectedDate);
              const inMonth = isSameMonth(day, viewDate);
              const today = isToday(day);
              const disabled = isDisabled(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(format(day, "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md text-xs transition ${
                    selected
                      ? "bg-brass text-ink"
                      : inMonth
                        ? "text-ink-text hover:bg-ink-text/5"
                        : "text-ink-text/30 hover:bg-ink-text/5"
                  } ${today && !selected ? "border border-brass/40" : "border border-transparent"} ${disabled ? "cursor-not-allowed opacity-30" : ""}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
