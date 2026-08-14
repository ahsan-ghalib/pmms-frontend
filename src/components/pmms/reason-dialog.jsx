"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function ReasonDialog({
  open,
  onOpenChange,
  title,
  confirmLabel = "Confirm",
  loading = false,
  extraFields = [],
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [extra, setExtra] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({ reason, ...extra });
    setReason("");
    setExtra({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {extraFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                type={field.type || "text"}
                required={field.required}
                value={extra[field.name] || ""}
                onChange={(event) => setExtra((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea required value={reason} onChange={(event) => setReason(event.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
