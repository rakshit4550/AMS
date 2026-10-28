import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const toIso = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const addDays = (iso, days) => {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const startOfWeek = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
};

const formatDay = (iso) => {
  if (!iso) return "Select";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (year, month) =>
  new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

const monthCells = (year, month) => {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(toIso(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const shiftMonth = (cursor, delta) => {
  const date = new Date(cursor.year, cursor.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
};

const cursorFromIso = (iso) => {
  const [year, month] = iso.split("-").map(Number);
  return { year, month: month - 1 };
};

const DateRangePicker = ({ from, to, max, onChange }) => {
  const rootRef = useRef(null);
  const fromRef = useRef(from);
  const toRef = useRef(to);
  const maxRef = useRef(max);
  fromRef.current = from;
  toRef.current = to;
  maxRef.current = max;
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);
  const [cursor, setCursor] = useState(() => cursorFromIso(from || max));

  useEffect(() => {
    if (!open) return undefined;
    setCursor(cursorFromIso(fromRef.current || toRef.current || maxRef.current));
    setAnchor(null);
    setHover(null);
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const months = useMemo(() => {
    const right = shiftMonth(cursor, 1);
    return [
      { ...cursor, cells: monthCells(cursor.year, cursor.month) },
      { ...right, cells: monthCells(right.year, right.month) },
    ];
  }, [cursor]);

  const rangeStart = anchor || from;
  const rangeEnd = anchor ? hover || anchor : to;
  const low = rangeStart && rangeEnd && rangeStart > rangeEnd ? rangeEnd : rangeStart;
  const high = rangeStart && rangeEnd && rangeStart > rangeEnd ? rangeStart : rangeEnd;

  const apply = (nextFrom, nextTo) => {
    const start = !nextFrom || !nextTo || nextFrom <= nextTo ? nextFrom : nextTo;
    const end = !nextFrom || !nextTo || nextFrom <= nextTo ? nextTo : nextFrom;
    onChange(start && start > max ? max : start || "", end && end > max ? max : end || "");
  };

  const pickDay = (iso) => {
    if (!iso || iso > max) return;
    if (!anchor) {
      setAnchor(iso);
      apply(iso, iso);
      return;
    }
    apply(anchor < iso ? anchor : iso, anchor < iso ? iso : anchor);
    setAnchor(null);
    setOpen(false);
  };

  const presets = [
    { id: "today", label: "Today", run: () => apply(max, max) },
    { id: "week", label: "This week", run: () => apply(startOfWeek(max), max) },
    { id: "days", label: "Last 7 days", run: () => apply(addDays(max, -6), max) },
    { id: "month", label: "This month", run: () => apply(`${max.slice(0, 8)}01`, max) },
    { id: "clear", label: "Clear", run: () => apply("", "") },
  ];

  const renderMonth = (month, hiddenOnMobile) => (
    <div className={hiddenOnMobile ? "hidden sm:block" : ""}>
      <p className="mb-2 text-center text-sm font-semibold text-slate-800">
        {formatMonth(month.year, month.month)}
      </p>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((label) => (
          <span key={`${month.year}-${month.month}-${label}`} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </span>
        ))}
        {month.cells.map((iso, index) => {
          if (!iso) return <span key={`empty-${month.year}-${month.month}-${index}`} />;
          const disabled = iso > max;
          const isEndpoint = iso === low || iso === high;
          const inRange = low && high && iso >= low && iso <= high;
          const isToday = iso === max;
          return (
            <div
              key={iso}
              className={`flex items-center justify-center ${inRange && !disabled ? "bg-[#424687]/10" : ""} ${iso === low ? "rounded-l-full" : ""} ${iso === high ? "rounded-r-full" : ""}`}
            >
              <button
                type="button"
                disabled={disabled}
                onMouseEnter={() => anchor && iso <= max && setHover(iso)}
                onClick={() => pickDay(iso)}
                className={`!h-8 !w-8 !min-h-0 !p-0 rounded-full text-sm tabular-nums transition ${
                  disabled
                    ? "cursor-not-allowed text-slate-300"
                    : isEndpoint
                      ? "bg-[#424687] font-semibold text-white shadow-sm"
                      : isToday
                        ? "font-semibold text-[#424687] ring-1 ring-[#424687]/40 hover:bg-[#424687]/10"
                        : "text-slate-700 hover:bg-white"
                }`}
              >
                {Number(iso.slice(-2))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-2 rounded-2xl border bg-white px-2 py-1.5 text-left shadow-sm transition sm:w-auto ${
          open ? "border-[#424687] ring-2 ring-[#424687]/20" : "border-slate-200 hover:border-[#424687]/40"
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#424687] text-white">
          <FiCalendar className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-[6.5rem] px-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</span>
          <span className={`block text-sm ${from ? "font-semibold text-slate-800" : "text-slate-400"}`}>{formatDay(from)}</span>
        </span>
        <span className="text-slate-300" aria-hidden>—</span>
        <span className="min-w-[6.5rem] px-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</span>
          <span className={`block text-sm ${to ? "font-semibold text-slate-800" : "text-slate-400"}`}>{formatDay(to)}</span>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_-18px_rgba(37,40,88,0.45)] sm:w-[34rem] sm:p-4 lg:left-auto lg:right-0">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor((value) => shiftMonth(value, -1))}
              className="!h-8 !w-8 !min-h-0 !p-0 inline-flex items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#424687]"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs font-medium text-slate-500">
              {anchor ? "Choose the end date" : "Choose a start date"}
            </p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor((value) => shiftMonth(value, 1))}
              className="!h-8 !w-8 !min-h-0 !p-0 inline-flex items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#424687]"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderMonth(months[0], false)}
            {renderMonth(months[1], true)}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  preset.run();
                  setAnchor(null);
                  setOpen(false);
                }}
                className={`!h-7 !min-h-0 rounded-full px-2.5 text-xs font-semibold transition ${
                  preset.id === "clear"
                    ? "text-slate-500 hover:bg-slate-100"
                    : "bg-[#424687]/10 text-[#424687] hover:bg-[#424687] hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
