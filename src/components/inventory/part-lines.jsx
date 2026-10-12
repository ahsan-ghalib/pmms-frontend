"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";

export const EMPTY_LINE = { part_id: "", quantity: "1" };

export const validLines = (lines) => lines
  .filter((line) => line.part_id && Number(line.quantity) > 0)
  .map((line) => ({ part_id: line.part_id, quantity: Number(line.quantity) }));

/**
 * options: [{ id, label, max? }] — max caps the quantity (e.g. hand stock held).
 */
export default function PartLines({ options, lines, onChange, emptyText }) {
  const t = useT("common");
  const update = (index, patch) => onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  if (options.length === 0) {
    return <p className="rounded-xl border border-dashed p-4 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const option = options.find((row) => row.id === line.part_id);
        const taken = lines.filter((row, i) => i !== index).map((row) => row.part_id);
        return (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <select
                className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                value={line.part_id}
                onChange={(event) => update(index, { part_id: event.target.value })}
              >
                <option value="">{t("select_part", { defaultMessage: "Select part" })}</option>
                {options.filter((row) => !taken.includes(row.id)).map((row) => (
                  <option key={row.id} value={row.id}>{row.label}</option>
                ))}
              </select>
              {option?.max != null && (
                <p className="text-xs text-slate-500">{t("available_qty", { defaultMessage: "Available: {qty}", qty: option.max })}</p>
              )}
            </div>
            <Input
              type="number"
              min="0.001"
              step="0.001"
              max={option?.max ?? undefined}
              className="h-10 w-28"
              value={line.quantity}
              onChange={(event) => update(index, { quantity: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-400 hover:text-rose-600"
              disabled={lines.length === 1}
              onClick={() => onChange(lines.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      {lines.length < options.length && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, { ...EMPTY_LINE }])}>
          <Plus className="mr-1 h-4 w-4" />
          {t("add_another_part", { defaultMessage: "Add another part" })}
        </Button>
      )}
    </div>
  );
}
