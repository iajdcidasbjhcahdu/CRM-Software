"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ListChecks,
  Search,
  Calendar,
  FolderKanban,
  Target,
  Layers,
  Loader2,
  MessageSquare,
  GitBranch,
  CornerDownRight,
  User,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getMyTasks } from "@/actions/tasks.action";

const STATUSES = [
  { id: "ALL", label: "All" },
  { id: "TODO", label: "Todo" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "COMPLETED", label: "Completed" },
  { id: "REVIEWED", label: "Reviewed" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function EmployeeTasksContent({ initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      const result = await getMyTasks(filters);
      if (result.success) setTasks(result.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Group tasks by status
  const groupedTasks = STATUSES.filter((s) => s.id !== "ALL").reduce((acc, status) => {
    acc[status.id] = tasks.filter((t) => t.status === status.id);
    return acc;
  }, {});

  const filteredTasks = statusFilter === "ALL" ? tasks : (groupedTasks[statusFilter] || []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Tasks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All tasks assigned to you across all projects.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
          {STATUSES.map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === status.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {status.label}
              {status.id !== "ALL" && (
                <span className="ml-1 text-[10px] text-slate-400">
                  ({(groupedTasks[status.id] || []).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
        >
          {PRIORITIES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
            >
              {/* Parent task breadcrumb */}
              {task.parentTask && (
                <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400">
                  <CornerDownRight className="w-3 h-3" />
                  <span>Follow-up of: {task.parentTask.title}</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{task.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge value={task.status} />
                    <Badge value={task.priority} />
                    {task.project && (
                      <Link
                        href={`/employee/projects/${task.project.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#5542F6] hover:underline"
                      >
                        <FolderKanban className="w-3 h-3" /> {task.project.name}
                      </Link>
                    )}
                    {task.milestone && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Target className="w-3 h-3" /> {task.milestone.title}
                      </span>
                    )}
                    {task.planningStep && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Layers className="w-3 h-3" /> {task.planningStep.title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.feedbacks?.length > 0 && (
                    <span className="flex items-center gap-1 text-indigo-600">
                      <MessageSquare className="w-3.5 h-3.5" /> {task.feedbacks.length}
                    </span>
                  )}
                  {task.childTasks?.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <GitBranch className="w-3.5 h-3.5" /> {task.childTasks.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <ListChecks className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {statusFilter === "ALL" ? "No tasks assigned to you yet." : `No ${statusFilter.replace("_", " ").toLowerCase()} tasks.`}
          </p>
        </div>
      )}
    </div>
  );
}
