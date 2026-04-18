"use client";

import { Calendar, CheckCircle2, Clock } from "lucide-react";

/**
 * Props:
 *  - balances: [{ id, year, allocated, used, leaveType: { name, code, color, isPaid, defaultQuota } }]
 *  - editable: bool — if true, shows an Edit button per card and calls onEdit(balance)
 *  - onEdit?: (balance) => void
 */
export default function LeaveBalanceCards({ balances = [], editable = false, onEdit }) {
  if (!balances.length) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No leave balance data available for this year yet.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((b) => {
        const isUnlimited = b.leaveType?.defaultQuota === null || b.leaveType?.defaultQuota === undefined;
        const allocated = b.allocated || 0;
        const used = b.used || 0;
        const remaining = isUnlimited ? null : allocated - used;
        const pct = !isUnlimited && allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;
        const color = b.leaveType?.color || "#5542F6";

        return (
          <div
            key={b.id}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {b.leaveType?.name || "Leave"}
                </h3>
              </div>
              {editable && (
                <button
                  onClick={() => onEdit?.(b)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isUnlimited ? (
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">∞</p>
                <p className="text-xs text-slate-400 mt-1">Unlimited · Used: {used}</p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-2">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{remaining}</p>
                  <p className="text-sm text-slate-400">/ {allocated}</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Used: {used}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Left: {remaining}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
