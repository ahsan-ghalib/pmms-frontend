"use client";

import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="glass-panel rounded-2xl px-6 py-14 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5 rounded-full bg-violet-600 hover:bg-violet-700" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
