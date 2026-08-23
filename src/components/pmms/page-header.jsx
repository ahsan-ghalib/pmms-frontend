"use client";

import { Button } from "@/components/ui/button";

export default function PageHeader({ icon: Icon, title, description, actions, accent = "bg-violet-600 hover:bg-violet-700" }) {
  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <Button variant="default" size="icon" aria-hidden="true" tabIndex={-1} className={`h-11 w-11 rounded-xl shadow-sm ${accent}`}>
              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
