"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/pmms/page-header";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDate } from "@/lib/pmms";
import SlaPanel from "@/components/pmms/sla-panel";

const NEXT = {
  submitted: "assigned",
  assigned: "in_progress",
  in_progress: "completed",
  completed: "verified",
  verified: "closed",
};

export default function PmmsComplaintDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      setComplaint(await complaintsApi.show(id));
    } catch (error) {
      toast.error(apiError(error, "Failed to load complaint"));
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!complaint) return <div className="p-8 text-center text-muted-foreground">Loading complaint...</div>;

  const nextStatus = NEXT[complaint.status];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquareWarning}
        title={complaint.reference_no}
        description={complaint.property?.name || "Complaint"}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/complaints")}>Back</Button>
            {nextStatus && (
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={async () => {
                try {
                  await complaintsApi.transition(complaint.id, { status: nextStatus });
                  toast.success("Status updated");
                  load();
                } catch (error) {
                  toast.error(apiError(error, "Transition failed"));
                }
              }}>
                Move to {nextStatus.replaceAll("_", " ")}
              </Button>
            )}
          </>
        }
      />
      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Status</p><StatusBadge value={complaint.status} /></div>
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Priority</p><PriorityBadge value={complaint.priority} /></div>
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Category</p><p className="font-semibold">{complaint.category?.name_en || "—"}</p></div>
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Service</p><p className="font-semibold">{complaint.service?.name_en || "—"}</p></div>
      </div>
      <SlaPanel sla={complaint.sla} complaintId={complaint.id} workOrderId={complaint.work_orders?.[0]?.id} />
      <div className="rounded-2xl border bg-white/60 p-5">
        <p className="text-xs uppercase text-slate-500">Description</p>
        <p className="mt-2 leading-relaxed">{complaint.description}</p>
      </div>
      {(complaint.work_orders || []).length > 0 && (
        <div className="rounded-2xl border bg-white/60 p-5 space-y-2">
          <p className="font-semibold">Linked work orders</p>
          {complaint.work_orders.map((order) => (
            <Button key={order.id} variant="outline" onClick={() => router.push(`/work-orders/${order.id}`)}>
              {order.work_order_no} · {order.status}
            </Button>
          ))}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white/60 p-5 space-y-3">
          <p className="font-semibold">Notes</p>
          {(complaint.notes || []).map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">{item.note}<div className="text-xs text-slate-400 mt-1">{formatDate(item.created_at)}</div></div>
          ))}
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an internal note" />
          <Button onClick={async () => {
            await complaintsApi.addNote(complaint.id, note);
            setNote("");
            load();
          }}>Add note</Button>
        </div>
        <div className="rounded-2xl border bg-white/60 p-5 space-y-3">
          <p className="font-semibold">History</p>
          {(complaint.status_history || []).map((item) => (
            <div key={item.id} className="text-sm flex justify-between">
              <span>{item.from_status || "new"} → {item.to_status}</span>
              <span className="text-slate-400">{formatDate(item.changed_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
