"use client";

import { Receipt } from "lucide-react";

export default function ClientInvoicesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and manage your invoices.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The invoices section is currently being built. You will be able to view and download invoices for all your projects here.
        </p>
      </div>
    </div>
  );
}
