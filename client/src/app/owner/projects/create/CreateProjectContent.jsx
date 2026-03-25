"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderKanban,
  FileText,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
} from "lucide-react";

import {
  createProject,
  getProjectAccountManagers,
  getProjectClients,
} from "@/actions/projects.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [managers, setManagers] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: "",
    startDate: "",
    endDate: "",
    budget: "",
    notes: "",
    accountManagerId: "",
  });

  useEffect(() => {
    getProjectAccountManagers().then(setManagers);
    getProjectClients().then(setClients);

    const clientId = searchParams.get("clientId");
    if (clientId) {
      setForm((prev) => ({ ...prev, clientId }));
    }
  }, [searchParams]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Project name is required" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    if (!form.clientId) {
      setToast({ type: "error", message: "Please select a client" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (payload.budget) payload.budget = parseFloat(payload.budget);
      else delete payload.budget;
      if (!payload.description) delete payload.description;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      if (!payload.notes) delete payload.notes;
      if (!payload.accountManagerId) delete payload.accountManagerId;

      const result = await createProject(payload);
      if (result.success) {
        router.push(`/owner/projects/${result.data.id}`);
      } else {
        setToast({ type: "error", message: result.error || "Failed to create project" });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="New Project"
        description="Create a new project under a client."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Projects", href: "/owner/projects" },
          { label: "New Project" },
        ]}
      />

      <SettingsCard
        title="Project Info"
        description="Basic project details."
      >
        <div className="grid grid-cols-1 gap-6">
          <SettingsInput
            label="Project Name *"
            icon={FolderKanban}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Website Redesign"
          />
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the project scope and goals..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Client & Assignment"
        description="Assign this project to a client and account manager."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Client *"
            icon={Building2}
            value={form.clientId}
            onChange={(e) => update("clientId", e.target.value)}
            options={[
              { value: "", label: "— Select Client —" },
              ...clients.map((c) => ({
                value: c.id,
                label: c.companyName,
              })),
            ]}
          />
          <SettingsSelect
            label="Account Manager"
            icon={UserCheck}
            value={form.accountManagerId}
            onChange={(e) => update("accountManagerId", e.target.value)}
            options={[
              { value: "", label: "— Unassigned —" },
              ...managers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role.replace(/_/g, " ")})`,
              })),
            ]}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Timeline & Budget"
        description="Set the project schedule and budget."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SettingsInput
            label="Start Date"
            type="date"
            icon={Calendar}
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
          <SettingsInput
            label="End Date"
            type="date"
            icon={Calendar}
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
          <SettingsInput
            label="Budget"
            type="number"
            icon={DollarSign}
            value={form.budget}
            onChange={(e) => update("budget", e.target.value)}
            placeholder="50000"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Notes"
        description="Additional context or details about this project."
      >
        <div>
          <label className="text-sm font-semibold text-slate-800 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Key requirements, milestones, or any context about this project..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none"
          />
        </div>
      </SettingsCard>

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleSubmit}
          label="Create Project"
        />
      </div>
    </div>
  );
}
