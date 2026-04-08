"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FolderKanban, Search, Calendar, User, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getProjects } from "@/actions/projects.action";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "DUE_SIGNING", label: "Due Signing" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function ClientProjectsContent({ initialData }) {
  const [projects, setProjects] = useState(initialData?.projects || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const result = await getProjects(params);
      if (result.success) setProjects(result.data.projects || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Projects</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and track all your projects.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : projects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/client/projects/${project.id}`}
              className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-[#5542F6]/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#5542F6]/10 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-[#5542F6]" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-[#5542F6] transition-colors">
                    {project.name}
                  </h3>
                </div>
                <Badge value={project.status} />
              </div>

              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                {project.accountManager && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Manager: {project.accountManager.firstName} {project.accountManager.lastName}</span>
                  </div>
                )}
                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(project.startDate)} — {formatDate(project.endDate) || "Ongoing"}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No projects found.</p>
        </div>
      )}
    </div>
  );
}
