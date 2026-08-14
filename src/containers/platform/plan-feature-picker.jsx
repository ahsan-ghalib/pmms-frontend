"use client";

import { Check, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeaturePills({ items = [], limit = 8, empty = "No features" }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">{empty}</p>;
  }

  const visible = items.slice(0, limit);
  const extra = items.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <span
          key={item.key || item}
          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
        >
          <Check className="h-3 w-3" />
          {item.label || item}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function FeatureChecklist({ items = [] }) {
  if (!items.length) return null;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
            <Check className="h-3 w-3" />
          </span>
          <span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
            {item.description && (
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PlanFeaturePicker({ groups = [], value = [], onChange }) {
  const selected = new Set(value);

  const toggle = (key) => {
    const next = selected.has(key) ? value.filter((item) => item !== key) : [...value, key];
    onChange(next);
  };

  const total = groups.reduce((sum, group) => sum + (group.features?.length || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Layers3 className="h-4 w-4 text-violet-600" />
          Features
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
          {value.length} / {total} enabled
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{group.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(group.features || []).map((feature) => {
              const active = selected.has(feature.key);
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => toggle(feature.key)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-violet-400 bg-violet-50/80 shadow-sm dark:border-violet-500/50 dark:bg-violet-500/10"
                      : "border-slate-200/80 bg-white/50 hover:border-violet-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-500/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{feature.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{feature.description}</p>
                    </div>
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-slate-300 bg-white dark:border-white/20 dark:bg-transparent"
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
