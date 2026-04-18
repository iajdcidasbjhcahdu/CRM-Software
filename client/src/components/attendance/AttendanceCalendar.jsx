"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  PRESENT: "bg-emerald-500",
  WORK_FROM_HOME: "bg-emerald-400",
  ON_DUTY: "bg-teal-500",
  HALF_DAY_FIRST: "bg-amber-400",
  HALF_DAY_SECOND: "bg-amber-400",
  ON_LEAVE: "bg-sky-500",
  ABSENT: "bg-red-500",
  HOLIDAY: "bg-purple-400",
  WEEKEND: "bg-slate-300 dark:bg-slate-700",
};

const STATUS_LABELS = {
  PRESENT: "Present",
  WORK_FROM_HOME: "WFH",
  ON_DUTY: "On Duty",
  HALF_DAY_FIRST: "Half (1st)",
  HALF_DAY_SECOND: "Half (2nd)",
  ON_LEAVE: "On Leave",
  ABSENT: "Absent",
  HOLIDAY: "Holiday",
  WEEKEND: "Weekend",
};

function startOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 1));
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function dayOfWeek(year, month, day) {
  return new Date(Date.UTC(year, month, day)).getUTCDay();
}

/**
 * Props:
 *  - records: [{ date, status, checkInAt, checkOutAt, workedMinutes, ... }]
 *  - year, month (1-12) — optional. Defaults to current.
 *  - onMonthChange?: (year, month1Based) => void
 *  - onDayClick?: (dateISO, record) => void
 *  - holidays?: [{ date, name }]
 */
export default function AttendanceCalendar({
  records = [],
  year: yearProp,
  month: monthProp,
  onMonthChange,
  onDayClick,
  holidays = [],
}) {
  const now = new Date();
  const [year, setYear] = useState(yearProp ?? now.getFullYear());
  const [month, setMonth] = useState((monthProp ?? now.getMonth() + 1) - 1); // 0-based internally

  const recordsByDate = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const d = new Date(r.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      map.set(key, r);
    }
    return map;
  }, [records]);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    for (const h of holidays) {
      const d = new Date(h.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      map.set(key, h);
    }
    return map;
  }, [holidays]);

  const go = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setYear(y);
    setMonth(m);
    onMonthChange?.(y, m + 1);
  };

  const total = daysInMonth(year, month);
  const firstDow = dayOfWeek(year, month, 1); // 0 = Sun

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ kind: "blank" });
  for (let d = 1; d <= total; d++) {
    const key = `${year}-${month}-${d}`;
    const rec = recordsByDate.get(key);
    const hol = holidaysByDate.get(key);
    const dow = dayOfWeek(year, month, d);
    const isWeekend = dow === 0 || dow === 6;
    cells.push({
      kind: "day",
      day: d,
      dow,
      isWeekend,
      record: rec,
      holiday: hol,
    });
  }

  const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => go(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{monthName}</h3>
        <button onClick={() => go(1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 uppercase mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.kind === "blank") {
            return <div key={idx} className="aspect-square" />;
          }
          const { day, record, holiday, isWeekend } = cell;
          const dateISO = new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];
          const status = record?.status || (holiday ? "HOLIDAY" : isWeekend ? "WEEKEND" : null);
          const dotColor = status ? STATUS_COLORS[status] : null;
          const isToday =
            day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

          return (
            <button
              key={idx}
              onClick={() => onDayClick?.(dateISO, record, holiday)}
              title={holiday?.name || STATUS_LABELS[status] || ""}
              className={`aspect-square rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors
                ${isToday ? "border-[#5542F6] bg-[#5542F6]/5" : "border-slate-100 dark:border-slate-800"}
                ${onDayClick ? "hover:bg-slate-50 dark:hover:bg-slate-900" : ""}
              `}
            >
              <span className={`${isWeekend && !record ? "text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>
                {day}
              </span>
              {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[k]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
