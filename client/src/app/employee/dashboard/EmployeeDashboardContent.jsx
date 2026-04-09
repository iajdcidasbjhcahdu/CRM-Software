"use client";

import Link from "next/link";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

export default function EmployeeDashboardContent({ stats }) {
  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">Unable to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Assigned Projects",
      value: stats.projects?.total || 0,
      icon: FolderKanban,
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
      href: "/employee/projects",
    },
    {
      label: "My Tasks",
      value: stats.tasks?.total || 0,
      icon: ListChecks,
      color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
      href: "/employee/tasks",
    },
    {
      label: "Completed",
      value: stats.tasks?.completed || 0,
      icon: CheckCircle2,
      color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    },
    {
      label: "In Review",
      value: stats.tasks?.inReview || 0,
      icon: Clock,
      color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    },
  ];

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your tasks, projects, and upcoming activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Wrapper = stat.href ? Link : "div";
          return (
            <Wrapper
              key={stat.label}
              {...(stat.href ? { href: stat.href } : {})}
              className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
            </Wrapper>
          );
        })}
      </div>

      {/* Task breakdown bar */}
      {stats.tasks?.total > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Task Breakdown</h2>
          <div className="flex rounded-full overflow-hidden h-3 bg-slate-100 dark:bg-slate-800">
            {stats.tasks.completed > 0 && (
              <div className="bg-emerald-500" style={{ width: `${(stats.tasks.completed / stats.tasks.total) * 100}%` }} title={`Completed: ${stats.tasks.completed}`} />
            )}
            {stats.tasks.inProgress > 0 && (
              <div className="bg-blue-500" style={{ width: `${(stats.tasks.inProgress / stats.tasks.total) * 100}%` }} title={`In Progress: ${stats.tasks.inProgress}`} />
            )}
            {stats.tasks.inReview > 0 && (
              <div className="bg-amber-500" style={{ width: `${(stats.tasks.inReview / stats.tasks.total) * 100}%` }} title={`In Review: ${stats.tasks.inReview}`} />
            )}
            {stats.tasks.todo > 0 && (
              <div className="bg-slate-300 dark:bg-slate-600" style={{ width: `${(stats.tasks.todo / stats.tasks.total) * 100}%` }} title={`Todo: ${stats.tasks.todo}`} />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed ({stats.tasks.completed})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress ({stats.tasks.inProgress})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Review ({stats.tasks.inReview})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> Todo ({stats.tasks.todo})</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-[#5542F6]" /> Recent Tasks
            </h2>
            <Link href="/employee/tasks" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.recentTasks?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge value={task.status} />
                      <Badge value={task.priority} />
                      <span className="text-xs text-slate-400">{task.project?.name}</span>
                    </div>
                  </div>
                  {task.dueDate && (
                    <span className="text-xs text-slate-500 flex-shrink-0">{formatDate(task.dueDate)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No tasks assigned yet.</p>
          )}
        </div>

        {/* Projects Overview */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#5542F6]" /> Projects
            </h2>
            <Link href="/employee/projects" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.projectsList?.length > 0 ? (
            <div className="space-y-3">
              {stats.projectsList.map((project) => (
                <Link
                  key={project.id}
                  href={`/employee/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate group-hover:text-[#5542F6] transition-colors">
                      {project.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{project._count?.tasks || 0} tasks</span>
                      <span>{project._count?.milestones || 0} milestones</span>
                    </div>
                  </div>
                  <Badge value={project.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No projects assigned yet.</p>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5542F6]" /> Upcoming Milestones
          </h2>
          {stats.upcomingMilestones?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{milestone.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{milestone.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge value={milestone.status} />
                    {milestone.dueDate && <span className="text-xs text-slate-500">{formatDate(milestone.dueDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming milestones.</p>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5542F6]" /> Upcoming Meetings
            </h2>
            <Link href="/employee/meetings" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.upcomingMeetings?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{meeting.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge value={meeting.mode} />
                      <span className="text-xs text-slate-400">{meeting.project?.name}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(meeting.scheduledAt)}</p>
                    <p className="text-xs text-slate-400">{formatTime(meeting.scheduledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming meetings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
