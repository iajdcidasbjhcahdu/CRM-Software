"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  X,
  Code2,
  Tag,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Copy,
  BotIcon,
  Search,
} from "lucide-react";
import {
  getSystemPrompts,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
} from "@/actions/system-prompts.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsButton from "@/components/settings/SettingsButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

const SLUG_ICONS = {
  "proposal-generator": FileText,
  "crm-search-assistant": Search,
};

export default function SystemPromptsTab() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  // Edit/Create mode
  const [editing, setEditing] = useState(null); // null = list view, object = editing
  const [isCreating, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, prompt: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch prompts
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await getSystemPrompts();
      setLoading(false);
      if (res.success) setPrompts(res.data || []);
    })();
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setEditing({
      slug: "",
      name: "",
      description: "",
      prompt: "",
      responseSchema: "",
      isActive: true,
    });
  };

  const handleEdit = (prompt) => {
    setIsCreating(false);
    setEditing({
      id: prompt.id,
      slug: prompt.slug,
      name: prompt.name,
      description: prompt.description || "",
      prompt: prompt.prompt,
      responseSchema: prompt.responseSchema || "",
      isActive: prompt.isActive,
    });
  };

  const handleBack = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        slug: editing.slug,
        name: editing.name,
        description: editing.description || null,
        prompt: editing.prompt,
        responseSchema: editing.responseSchema || null,
        isActive: editing.isActive,
      };

      let result;
      if (isCreating) {
        result = await createSystemPrompt(payload);
      } else {
        result = await updateSystemPrompt(editing.id, payload);
      }

      if (result.success) {
        showToast("success", isCreating ? "Prompt created successfully" : "Prompt updated successfully");
        // Refresh list
        const res = await getSystemPrompts();
        if (res.success) setPrompts(res.data || []);
        handleBack();
      } else {
        showToast("error", result.error || "Failed to save prompt");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteModal.prompt) return;
    setIsDeleting(true);
    const result = await deleteSystemPrompt(deleteModal.prompt.id);
    setIsDeleting(false);
    setDeleteModal({ open: false, prompt: null });

    if (result.success) {
      showToast("success", "Prompt deleted");
      setPrompts((prev) => prev.filter((p) => p.id !== deleteModal.prompt.id));
    } else {
      showToast("error", result.error || "Failed to delete");
    }
  };

  const updateField = (field, value) => setEditing((p) => ({ ...p, [field]: value }));

  // ─── List View ─────────────────────────────────────
  if (!editing) {
    return (
      <div className="flex flex-col gap-6">
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

        <SettingsCard
          title="System Prompts"
          description="Manage AI prompts for different features. These prompts define how the AI behaves for each use case."
        >
          {/* Add Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
            >
              <Plus className="w-4 h-4" />
              New Prompt
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
              <span className="text-sm text-slate-400">Loading prompts...</span>
            </div>
          ) : prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BotIcon className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No system prompts</p>
              <p className="text-xs mt-1">Create your first prompt to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prompts.map((prompt) => {
                const Icon = SLUG_ICONS[prompt.slug] || FileText;
                return (
                  <div
                    key={prompt.id}
                    className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                          {prompt.name}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prompt.isActive
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}>
                          {prompt.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {prompt.description || "No description"}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">
                          {prompt.slug}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleEdit(prompt)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, prompt })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SettingsCard>

        <ConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, prompt: null })}
          onConfirm={handleDelete}
          isPending={isDeleting}
          title="Delete System Prompt"
          message={`Are you sure you want to delete "${deleteModal.prompt?.name}"? This cannot be undone.`}
          confirmLabel="Delete Prompt"
          variant="danger"
        />
      </div>
    );
  }

  // ─── Edit / Create View ────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all prompts
      </button>

      <SettingsCard
        title={isCreating ? "Create System Prompt" : `Edit: ${editing.name}`}
        description="Define the system prompt, response schema, and configuration."
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SettingsInput
              label="Name"
              icon={Tag}
              value={editing.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Proposal Generator"
            />
            <SettingsInput
              label="Slug"
              icon={Code2}
              value={editing.slug}
              onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="e.g. proposal-generator"
              disabled={!isCreating}
            />
          </div>

          <SettingsInput
            label="Description"
            icon={MessageSquare}
            value={editing.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Short description of what this prompt does..."
          />

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateField("isActive", !editing.isActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                editing.isActive
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {editing.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {editing.isActive ? "Active" : "Disabled"}
            </button>
          </div>

          {/* Prompt Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              System Prompt
            </label>
            <textarea
              value={editing.prompt}
              onChange={(e) => updateField("prompt", e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[14px] font-mono text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-y"
              placeholder="Enter the system prompt instructions..."
            />
          </div>

          {/* Response Schema */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Response Schema (JSON)
              </label>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                Optional — enables structured output
              </span>
            </div>
            <textarea
              value={editing.responseSchema}
              onChange={(e) => updateField("responseSchema", e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[13px] font-mono text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-y"
              placeholder='{"type": "object", "properties": { ... }}'
            />
            <p className="text-xs text-slate-400">
              Define a JSON Schema to get structured responses from the AI. Leave empty for free-form text responses.
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label={isCreating ? "Create Prompt" : "Save Changes"}
        />
      </div>
    </div>
  );
}
