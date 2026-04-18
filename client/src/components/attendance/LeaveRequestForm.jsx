"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Loader2, Calendar, FileText } from "lucide-react";
import { createLeaveRequest } from "@/actions/leave.action";

function computeTotalDays(from, to, fromDT, toDT) {
  if (!from || !to) return 0;
  const f = new Date(from);
  const t = new Date(to);
  const diff = Math.floor((t.getTime() - f.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (diff <= 0) return 0;
  if (diff === 1) {
    return fromDT !== "FULL_DAY" || toDT !== "FULL_DAY" ? 0.5 : 1;
  }
  let days = diff;
  if (fromDT !== "FULL_DAY") days -= 0.5;
  if (toDT !== "FULL_DAY") days -= 0.5;
  return days;
}

/**
 * Props:
 *  - isOpen: bool
 *  - onClose: () => void
 *  - onSuccess: (request) => void — called after successful submit
 *  - leaveTypes: [{ id, name, code, color, defaultQuota, isPaid }]
 *  - balances: [{ leaveType: { id, ... }, allocated, used }] — optional, for live balance preview
 *  - showToast: (type, msg) => void
 */
export default function LeaveRequestForm({ isOpen, onClose, onSuccess, leaveTypes = [], balances = [], showToast }) {
  const [form, setForm] = useState({
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    fromDayType: "FULL_DAY",
    toDayType: "FULL_DAY",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        leaveTypeId: leaveTypes[0]?.id || "",
        fromDate: "",
        toDate: "",
        fromDayType: "FULL_DAY",
        toDayType: "FULL_DAY",
        reason: "",
      });
    }
  }, [isOpen, leaveTypes]);

  const totalDays = useMemo(
    () => computeTotalDays(form.fromDate, form.toDate, form.fromDayType, form.toDayType),
    [form]
  );

  const selectedType = leaveTypes.find((t) => t.id === form.leaveTypeId);
  const balance = balances.find((b) => b.leaveType?.id === form.leaveTypeId);
  const remaining = balance && selectedType?.defaultQuota !== null
    ? (balance.allocated || 0) - (balance.used || 0)
    : null;
  const exceedsBalance = remaining !== null && totalDays > remaining;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.fromDate || !form.toDate || !form.reason.trim()) {
      showToast?.("error", "Please fill all required fields");
      return;
    }
    if (totalDays <= 0) {
      showToast?.("error", "Invalid leave duration");
      return;
    }
    if (exceedsBalance) {
      showToast?.("error", `Exceeds available balance (${remaining} day${remaining !== 1 ? "s" : ""})`);
      return;
    }

    setSubmitting(true);
    const res = await createLeaveRequest({
      leaveTypeId: form.leaveTypeId,
      fromDate: form.fromDate,
      toDate: form.toDate,
      fromDayType: form.fromDayType,
      toDayType: form.toDayType,
      reason: form.reason.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      showToast?.("success", "Leave request submitted");
      onSuccess?.(res.data);
      onClose();
    } else {
      showToast?.("error", res.error || "Failed to submit leave request");
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-950 rounded-[24px] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5542F6]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#5542F6]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Apply for Leave</h2>
              <p className="text-xs text-slate-400 mt-0.5">Submit a new leave request</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.leaveTypeId}
              onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
              required
            >
              <option value="">Select a leave type</option>
              {leaveTypes.filter((t) => t.isActive !== false).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.defaultQuota !== null ? `(${t.isPaid ? "Paid" : "Unpaid"})` : "(Unlimited)"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.fromDate}
                min={today}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
                required
              />
              <select
                value={form.fromDayType}
                onChange={(e) => setForm({ ...form, fromDayType: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#5542F6] outline-none"
              >
                <option value="FULL_DAY">Full day</option>
                <option value="FIRST_HALF">First half only</option>
                <option value="SECOND_HALF">Second half only</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                To <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.toDate}
                min={form.fromDate || today}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
                required
              />
              <select
                value={form.toDayType}
                onChange={(e) => setForm({ ...form, toDayType: e.target.value })}
                className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-[#5542F6] outline-none"
              >
                <option value="FULL_DAY">Full day</option>
                <option value="FIRST_HALF">First half only</option>
                <option value="SECOND_HALF">Second half only</option>
              </select>
            </div>
          </div>

          {totalDays > 0 && (
            <div className={`p-3 rounded-xl border ${exceedsBalance ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30" : "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30"}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Total days requested
                </span>
                <span className={`font-bold ${exceedsBalance ? "text-red-600" : "text-indigo-600"}`}>
                  {totalDays}
                </span>
              </div>
              {remaining !== null && (
                <p className="text-xs text-slate-500 mt-1">
                  Available balance: <span className="font-semibold">{remaining}</span>
                  {exceedsBalance && <span className="text-red-600 ml-1">— exceeds balance</span>}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              placeholder="Briefly explain why you need this leave..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || exceedsBalance || totalDays <= 0}
              className="flex items-center gap-2 px-5 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
