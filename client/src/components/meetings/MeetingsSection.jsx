"use client";

import { useState, useTransition } from "react";
import {
  Video,
  MapPin,
  Phone,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { createMeeting, updateMeeting, deleteMeeting } from "@/actions/meetings.action";
import Badge from "@/components/ui/Badge";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";

const MODE_ICONS = {
  VIRTUAL: Video,
  IN_PERSON: MapPin,
  PHONE_CALL: Phone,
};

const MODE_COLORS = {
  VIRTUAL: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30",
  IN_PERSON: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30",
  PHONE_CALL: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30",
};

const STATUS_ICONS = {
  SCHEDULED: Calendar,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};

export default function MeetingsSection({
  meetings: initialMeetings = [],
  entityType, // "lead" | "deal" | "project"
  entityId,
  showToast,
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    mode: "VIRTUAL",
    scheduledAt: "",
    duration: "",
    link: "",
    notes: "",
    description: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      mode: "VIRTUAL",
      scheduledAt: "",
      duration: "",
      link: "",
      notes: "",
      description: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setEditingMeeting(null);
    setShowCreateModal(true);
  };

  const openEdit = (meeting) => {
    setEditingMeeting(meeting);
    setForm({
      title: meeting.title || "",
      mode: meeting.mode || "VIRTUAL",
      scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : "",
      duration: meeting.duration || "",
      link: meeting.link || "",
      notes: meeting.notes || "",
      description: meeting.description || "",
    });
    setShowCreateModal(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast("error", "Meeting title is required");
      return;
    }
    if (!form.scheduledAt) {
      showToast("error", "Scheduled date/time is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        mode: form.mode,
        scheduledAt: form.scheduledAt,
        [`${entityType}Id`]: entityId,
      };
      if (form.duration) payload.duration = parseInt(form.duration, 10);
      if (form.link) payload.link = form.link.trim();
      if (form.notes) payload.notes = form.notes.trim();
      if (form.description) payload.description = form.description.trim();

      let result;
      if (editingMeeting) {
        // Don't send entity ID on update
        delete payload[`${entityType}Id`];
        result = await updateMeeting(editingMeeting.id, payload);
      } else {
        result = await createMeeting(payload);
      }

      if (result.success) {
        if (editingMeeting) {
          setMeetings((prev) => prev.map((m) => (m.id === result.data.id ? result.data : m)));
        } else {
          setMeetings((prev) => [result.data, ...prev]);
        }
        setShowCreateModal(false);
        resetForm();
        setEditingMeeting(null);
        showToast("success", editingMeeting ? "Meeting updated" : "Meeting scheduled");
      } else {
        showToast("error", result.error || "Failed to save meeting");
      }
    });
  };

  const handleStatusUpdate = (meetingId, newStatus) => {
    startTransition(async () => {
      const result = await updateMeeting(meetingId, { status: newStatus });
      if (result.success) {
        setMeetings((prev) => prev.map((m) => (m.id === result.data.id ? result.data : m)));
        showToast("success", `Meeting marked as ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      } else {
        showToast("error", result.error || "Failed to update meeting");
      }
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteMeeting(deletingId);
      if (result.success) {
        setMeetings((prev) => prev.filter((m) => m.id !== deletingId));
        setDeletingId(null);
        showToast("success", "Meeting deleted");
      } else {
        showToast("error", result.error || "Failed to delete meeting");
      }
    });
  };

  const handleScheduleFollowUp = (parentMeeting) => {
    resetForm();
    setEditingMeeting(null);
    setForm((prev) => ({
      ...prev,
      title: `Follow-up: ${parentMeeting.title}`,
      mode: parentMeeting.mode,
    }));
    setShowCreateModal(true);
  };

  const upcoming = meetings.filter((m) => m.status === "SCHEDULED");
  const past = meetings.filter((m) => m.status !== "SCHEDULED");

  return (
    <>
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Meetings</h3>
              <p className="text-xs text-slate-400">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""} scheduled</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No meetings scheduled yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Schedule your first meeting
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Upcoming</p>
                <div className="space-y-3">
                  {upcoming.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      expanded={expandedId === meeting.id}
                      onToggle={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                      onEdit={() => openEdit(meeting)}
                      onDelete={() => setDeletingId(meeting.id)}
                      onStatusUpdate={handleStatusUpdate}
                      onFollowUp={() => handleScheduleFollowUp(meeting)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Past</p>
                <div className="space-y-3">
                  {past.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      expanded={expandedId === meeting.id}
                      onToggle={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                      onEdit={() => openEdit(meeting)}
                      onDelete={() => setDeletingId(meeting.id)}
                      onStatusUpdate={handleStatusUpdate}
                      onFollowUp={() => handleScheduleFollowUp(meeting)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setEditingMeeting(null); }} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {editingMeeting ? "Edit Meeting" : "Schedule Meeting"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editingMeeting ? "Update meeting details" : "Add a new meeting"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <SettingsInput
                label="Title *"
                icon={Calendar}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Discovery call with client"
              />
              <SettingsSelect
                label="Mode"
                icon={Video}
                value={form.mode}
                onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
                options={[
                  { value: "VIRTUAL", label: "Virtual (Video Call)" },
                  { value: "IN_PERSON", label: "In Person" },
                  { value: "PHONE_CALL", label: "Phone Call" },
                ]}
              />
              <SettingsInput
                label="Date & Time *"
                type="datetime-local"
                icon={Clock}
                value={form.scheduledAt}
                onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
              />
              <SettingsInput
                label="Duration (minutes)"
                type="number"
                icon={Clock}
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                placeholder="e.g., 30"
              />
              <SettingsInput
                label={form.mode === "VIRTUAL" ? "Meeting Link" : form.mode === "PHONE_CALL" ? "Phone Number" : "Location"}
                icon={form.mode === "VIRTUAL" ? ExternalLink : form.mode === "PHONE_CALL" ? Phone : MapPin}
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder={
                  form.mode === "VIRTUAL" ? "https://meet.google.com/..." : form.mode === "PHONE_CALL" ? "+1 234 567 8900" : "Office address"
                }
              />
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Meeting agenda or purpose..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setEditingMeeting(null); resetForm(); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title.trim() || !form.scheduledAt}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : editingMeeting ? "Update Meeting" : "Schedule Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

/* ─── Meeting Card ─── */
function MeetingCard({ meeting, expanded, onToggle, onEdit, onDelete, onStatusUpdate, onFollowUp, isPending }) {
  const ModeIcon = MODE_ICONS[meeting.mode] || Video;
  const StatusIcon = STATUS_ICONS[meeting.status] || Calendar;
  const modeColor = MODE_COLORS[meeting.mode] || MODE_COLORS.VIRTUAL;

  const scheduledDate = new Date(meeting.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const isPast = scheduledDate < new Date() && meeting.status === "SCHEDULED";

  return (
    <div className={`rounded-xl border transition-colors ${isPast ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-200"}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${modeColor}`}>
            <ModeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{meeting.title}</p>
              {meeting.isFollowUp && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  Follow-up
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
              {meeting.duration && <span>{meeting.duration} min</span>}
              <Badge value={meeting.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isPast && meeting.status === "SCHEDULED" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Overdue</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="mt-4 space-y-3">
            {meeting.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.description}</p>
              </div>
            )}
            {meeting.link && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {meeting.mode === "VIRTUAL" ? "Meeting Link" : meeting.mode === "PHONE_CALL" ? "Phone Number" : "Location"}
                </p>
                {meeting.mode === "VIRTUAL" ? (
                  <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {meeting.link}
                  </a>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{meeting.link}</p>
                )}
              </div>
            )}
            {meeting.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.notes}</p>
              </div>
            )}
            {meeting.outcome && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Outcome</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.outcome}</p>
              </div>
            )}
            {meeting.createdBy && (
              <p className="text-xs text-slate-400">
                Created by {meeting.createdBy.firstName} {meeting.createdBy.lastName}
              </p>
            )}

            {/* Follow-up meetings */}
            {meeting.followUpMeetings && meeting.followUpMeetings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Follow-up Meetings</p>
                <div className="space-y-1">
                  {meeting.followUpMeetings.map((fu) => (
                    <div key={fu.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="w-3 h-3" />
                      <span>{fu.title}</span>
                      <Badge value={fu.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {meeting.status === "SCHEDULED" && (
              <>
                <button
                  onClick={() => onStatusUpdate(meeting.id, "COMPLETED")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </button>
                <button
                  onClick={() => onStatusUpdate(meeting.id, "CANCELLED")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={() => onStatusUpdate(meeting.id, "NO_SHOW")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  No Show
                </button>
              </>
            )}
            <button
              onClick={onFollowUp}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Follow-up Meeting
            </button>
            <button
              onClick={onEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
