"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/pmms/page-header";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import ReasonDialog from "@/components/pmms/reason-dialog";
import { workOrdersApi } from "@/services/work-orders/work-orders-api";
import { techniciansApi } from "@/services/technicians/technicians-api";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDate, labelize } from "@/lib/pmms";
import { compressImages, formatDuration, formatMeters, getGps } from "@/lib/geo";
import { useSession } from "next-auth/react";
import { Roles, isManager, normalizeRole } from "@/lib/permissions/role-access";

export default function WorkOrderDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  const [workOrder, setWorkOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalog, setCatalog] = useState({ parts: [], stock_locations: [] });
  const [note, setNote] = useState("");
  const [dialog, setDialog] = useState(null);
  const [assign, setAssign] = useState({ primary: "", coworkers: [], reason: "" });
  const [complete, setComplete] = useState({ summary: "", latitude: "", longitude: "" });
  const [taxonomy, setTaxonomy] = useState({ category_id: "", service_id: "" });
  const [assetCode, setAssetCode] = useState("");
  const [partForm, setPartForm] = useState({ part_id: "", quantity: "1", stock_location_id: "", reason: "Parts Required" });

  const load = async () => {
    try {
      const [order, timeline] = await Promise.all([workOrdersApi.show(id), workOrdersApi.history(id)]);
      setWorkOrder(order);
      setHistory(timeline?.events || []);
      setTaxonomy({ category_id: order.category_id || "", service_id: order.service_id || "" });
      setAssetCode(order.asset_validated_code || "");
    } catch (error) {
      toast.error(apiError(error, "Failed to load work order"));
    }
  };

  useEffect(() => {
    load();
    pmmsUsersApi.list({ role: "technician" }).then((data) => setTechnicians(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    techniciansApi.partsCatalog().then((data) => setCatalog({
      parts: data?.parts || [],
      stock_locations: data?.stock_locations || [],
    })).catch(() => {});
  }, [id]);

  if (!workOrder) return <div className="p-8 text-center text-muted-foreground">Loading work order...</div>;

  const readonly = workOrder.readonly;
  const manager = isManager(role);
  const primary = (workOrder.assignments || []).find((item) => item.assignment_type === "primary" && !item.removed_at);
  const isPrimary = String(primary?.technician_id) === String(session?.user?.id);
  const closed = ["closed", "cancelled"].includes(workOrder.status);
  const canAct = !readonly && (manager || isPrimary) && !closed;
  const settings = workOrder.company_settings || {};
  const checkedIn = (workOrder.checkins || []).length > 0;
  const lastCheckout = (workOrder.checkouts || [])[(workOrder.checkouts || []).length - 1];
  const accepted = Boolean(workOrder.accepted_at);
  const canStart = canAct && accepted && workOrder.status === "assigned";

  const run = async (action, success) => {
    try {
      await action();
      toast.success(success);
      setDialog(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Action failed"));
    }
  };

  const withGps = async (action, success) => {
    try {
      const coords = await getGps();
      await action(coords);
      toast.success(success);
      setDialog(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Location is required for this action"));
    }
  };

  const services = categories.find((category) => category.id === taxonomy.category_id)?.services || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title={workOrder.work_order_no}
        description={`${labelize(workOrder.source_type)} · ${labelize(workOrder.type)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/work-orders")}>Back</Button>
            {readonly && <StatusBadge value="read only" />}
            {manager && isPrimary === false && canAct && <StatusBadge value="on behalf" />}
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Status</p><StatusBadge value={workOrder.status} /></div>
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Priority</p><PriorityBadge value={workOrder.priority} /></div>
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Holds</p><p className="font-semibold">{workOrder.hold_count || 0}</p></div>
        <div className="rounded-2xl border bg-white/60 p-4"><p className="text-xs text-slate-500">Schedule</p><p className="font-semibold">{workOrder.scheduled_date || "—"}</p></div>
      </div>

      <div className="rounded-2xl border bg-white/60 p-5">
        <p className="text-xs uppercase text-slate-500">Description</p>
        <p className="mt-2">{workOrder.description || workOrder.service_summary || "—"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {manager && !closed && <Button onClick={() => setDialog("assign")}>Assign crew</Button>}
        {canAct && workOrder.status === "assigned" && !accepted && <Button onClick={() => run(() => workOrdersApi.accept(workOrder.id), "Accepted")}>Accept</Button>}
        {canAct && workOrder.status === "assigned" && !accepted && <Button variant="outline" onClick={() => setDialog("reject")}>Reject</Button>}
        {canAct && accepted && !checkedIn && <Button onClick={() => withGps((coords) => workOrdersApi.checkIn(workOrder.id, coords), "Checked in")}>GPS check-in</Button>}
        {canAct && accepted && !workOrder.asset_validated_at && <Button variant="outline" onClick={() => setDialog("scan")}>Scan asset</Button>}
        {canStart && <Button onClick={() => run(() => workOrdersApi.start(workOrder.id), "Work started")}>Start work</Button>}
        {canAct && ["assigned", "in_progress", "on_hold"].includes(workOrder.status) && <Button variant="outline" onClick={() => setDialog("photos")}>Photos</Button>}
        {canAct && workOrder.status !== "on_hold" && <Button variant="outline" onClick={() => setDialog("hold")}>On hold</Button>}
        {canAct && ["in_progress", "on_hold"].includes(workOrder.status) && <Button variant="outline" onClick={() => setDialog("parts")}>Request parts</Button>}
        {manager && !closed && <Button variant="outline" onClick={() => setDialog("issue")}>Issue parts</Button>}
        {canAct && ["in_progress", "on_hold"].includes(workOrder.status) && <Button variant="outline" onClick={() => setDialog("usage")}>Record usage</Button>}
        {canAct && workOrder.status === "on_hold" && <Button onClick={() => run(() => workOrdersApi.resume(workOrder.id), "Resumed")}>Resume</Button>}
        {canAct && <Button variant="outline" onClick={() => setDialog("reschedule")}>Reschedule</Button>}
        {isPrimary && <Button variant="outline" onClick={() => setDialog("reschedule-request")}>Request reschedule</Button>}
        {canAct && checkedIn && ["in_progress", "on_hold"].includes(workOrder.status) && (
          <Button variant="outline" onClick={() => withGps((coords) => workOrdersApi.checkOut(workOrder.id, coords), "Checked out")}>GPS check-out</Button>
        )}
        {canAct && ["in_progress", "on_hold"].includes(workOrder.status) && <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setDialog("complete")}>Complete</Button>}
        {manager && workOrder.status === "completed" && <Button onClick={() => run(() => workOrdersApi.verify(workOrder.id), "Verified")}>Verify</Button>}
        {manager && workOrder.status === "completed" && <Button variant="outline" onClick={() => setDialog("rework")}>Rework</Button>}
        {manager && ["completed", "verified"].includes(workOrder.status) && <Button onClick={() => setDialog("close")}>Close</Button>}
        {manager && !closed && <Button variant="destructive" onClick={() => setDialog("cancel")}>Cancel</Button>}
        {manager && !["completed", "verified", "closed", "cancelled"].includes(workOrder.status) && <Button variant="outline" onClick={() => setDialog("taxonomy")}>Edit category</Button>}
        {role === Roles.TENANT && workOrder.status === "closed" && <Button onClick={() => setDialog("rate")}>Rate</Button>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white/60 p-5 space-y-3">
          <p className="font-semibold">Field status</p>
          <p className="text-sm">Asset: {workOrder.asset_validated_at ? `${workOrder.asset_validated_code} · ${workOrder.asset?.name || "validated"}` : "Not scanned"}</p>
          <p className="text-sm">Check-in: {checkedIn ? formatDate(workOrder.checkins[workOrder.checkins.length - 1]?.checked_in_at) : "Not checked in"}</p>
          {checkedIn && (
            <p className="text-xs text-slate-500">
              Distance from site: {formatMeters(workOrder.checkins[workOrder.checkins.length - 1]?.distance_from_site_meters)}
            </p>
          )}
          <p className="text-sm">Check-out: {lastCheckout ? formatDate(lastCheckout.checked_out_at) : "—"}</p>
          {lastCheckout?.on_site_duration_seconds != null && (
            <p className="text-xs text-slate-500">On-site: {formatDuration(lastCheckout.on_site_duration_seconds)}</p>
          )}
          {settings.require_asset_scan_to_start && !workOrder.asset_validated_at && (
            <p className="text-xs text-amber-600">Work cannot start until the asset is scanned and validated.</p>
          )}
        </div>
        <div className="rounded-2xl border bg-white/60 p-5 space-y-3">
          <p className="font-semibold">Crew</p>
          {(workOrder.assignments || []).filter((item) => !item.removed_at).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.technician_name || item.technician_id}</span>
              <StatusBadge value={item.assignment_type} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white/60 p-5 space-y-3">
          <p className="font-semibold">Notes</p>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note" />
          {canAct && <Button onClick={() => run(() => workOrdersApi.addNote(workOrder.id, note).then(() => setNote("")), "Note added")}>Add note</Button>}
        </div>
        <div className="rounded-2xl border bg-white/60 p-5 space-y-3">
          <p className="font-semibold">Parts</p>
          {(workOrder.part_requests || []).length === 0 && <p className="text-sm text-slate-500">No part requests yet.</p>}
          {(workOrder.part_requests || []).map((request) => (
            <div key={request.id} className="border rounded-xl p-3 space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-sm">{request.reason}</span>
                <StatusBadge value={request.status} />
              </div>
              {(request.items || []).map((item) => (
                <p key={`${request.id}-${item.part_id}`} className="text-xs text-slate-500">
                  {item.part_name || item.sku} · requested {item.requested_quantity} · issued {item.issued_quantity || 0} · used {item.used_quantity || 0}
                </p>
              ))}
              {manager && request.status === "requested" && (
                <Button size="sm" variant="outline" onClick={() => {
                  setPartForm((current) => ({ ...current, request_id: request.id }));
                  setDialog("issue-request");
                }}>Issue</Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold">Full history</p>
          <Button variant="outline" size="sm" onClick={async () => {
            const exported = await workOrdersApi.exportHistory(workOrder.id);
            const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${workOrder.work_order_no}-history.json`;
            link.click();
          }}>Export</Button>
        </div>
        <div className="space-y-3">
          {history.map((event, index) => (
            <div key={`${event.type}-${index}`} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{labelize(event.type)} {event.to ? `→ ${labelize(event.to)}` : event.event ? `· ${labelize(event.event)}` : ""}</p>
                <p className="text-xs text-slate-500">{event.reason || event.note || event.notes || ""}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(event.at)}</span>
            </div>
          ))}
        </div>
      </div>

      <ReasonDialog open={dialog === "reject"} onOpenChange={() => setDialog(null)} title="Reject work order" confirmLabel="Reject" onSubmit={({ reason }) => run(() => workOrdersApi.reject(workOrder.id, reason), "Rejected")} />
      <ReasonDialog open={dialog === "hold"} onOpenChange={() => setDialog(null)} title="Place on hold" extraFields={[{ name: "expected_resume_at", label: "Expected resume", type: "datetime-local" }]} onSubmit={({ reason, expected_resume_at }) => run(() => workOrdersApi.hold(workOrder.id, { reason, expected_resume_at }), "On hold")} />
      <ReasonDialog open={dialog === "reschedule"} onOpenChange={() => setDialog(null)} title="Reschedule" extraFields={[{ name: "scheduled_date", label: "New date", type: "date", required: true }]} onSubmit={(values) => run(() => workOrdersApi.reschedule(workOrder.id, values), "Rescheduled")} />
      <ReasonDialog open={dialog === "reschedule-request"} onOpenChange={() => setDialog(null)} title="Request reschedule" onSubmit={({ reason }) => run(() => workOrdersApi.requestReschedule(workOrder.id, reason), "Request sent")} />
      <ReasonDialog open={dialog === "rework"} onOpenChange={() => setDialog(null)} title="Return for rework" onSubmit={({ reason }) => run(() => workOrdersApi.rework(workOrder.id, reason), "Returned for rework")} />
      <ReasonDialog open={dialog === "close"} onOpenChange={() => setDialog(null)} title="Close work order" onSubmit={({ reason }) => run(() => workOrdersApi.close(workOrder.id, reason), "Closed")} />
      <ReasonDialog open={dialog === "cancel"} onOpenChange={() => setDialog(null)} title="Cancel work order" confirmLabel="Cancel work order" onSubmit={({ reason }) => run(() => workOrdersApi.cancel(workOrder.id, reason), "Cancelled")} />
      <ReasonDialog open={dialog === "rate"} onOpenChange={() => setDialog(null)} title="Rate this job" extraFields={[{ name: "rating", label: "Rating 1-5", type: "number", required: true }]} onSubmit={({ reason, rating }) => run(() => workOrdersApi.rate(workOrder.id, { rating: Number(rating), feedback: reason }), "Thanks for the rating")} />

      <Dialog open={dialog === "assign"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Assign technicians</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Primary technician</Label>
            <select className="w-full border rounded-md h-10 px-3" value={assign.primary} onChange={(event) => setAssign((current) => ({ ...current, primary: event.target.value }))}>
              <option value="">Select</option>
              {technicians.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <Label>Co-workers</Label>
            <div className="max-h-40 overflow-auto space-y-1">
              {technicians.filter((user) => String(user.id) !== String(assign.primary)).map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={assign.coworkers.includes(user.id)} onChange={(event) => {
                    setAssign((current) => ({
                      ...current,
                      coworkers: event.target.checked ? [...current.coworkers, user.id] : current.coworkers.filter((id) => id !== user.id),
                    }));
                  }} />
                  {user.name}
                </label>
              ))}
            </div>
            <Textarea placeholder="Reason" value={assign.reason} onChange={(event) => setAssign((current) => ({ ...current, reason: event.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => run(() => workOrdersApi.assign(workOrder.id, { primary_technician_id: Number(assign.primary), coworker_ids: assign.coworkers.map(Number), reason: assign.reason }), "Assigned")}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "scan"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Validate asset</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">Scan a QR/barcode with the camera, or enter the asset code manually.</p>
          <Input
            placeholder="Asset code"
            value={assetCode}
            onChange={(event) => setAssetCode(event.target.value)}
          />
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file || typeof window.BarcodeDetector === "undefined") {
                toast.message("Enter the asset code manually if the camera cannot read the code.");
                return;
              }
              try {
                const detector = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "code_39"] });
                const bitmap = await createImageBitmap(file);
                const codes = await detector.detect(bitmap);
                if (codes[0]?.rawValue) {
                  setAssetCode(codes[0].rawValue);
                } else {
                  toast.message("No code found. Enter the asset code manually.");
                }
              } catch {
                toast.message("Unable to read the code. Enter it manually.");
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => run(() => workOrdersApi.scanAsset(workOrder.id, assetCode), "Asset validated")}>Validate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "photos"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Upload photos</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={async (event) => {
            event.preventDefault();
            const type = event.target.photo_type.value;
            const files = await compressImages(event.target.photos.files || []);
            const form = new FormData();
            form.append("type", type);
            files.forEach((file) => form.append("photos[]", file));
            run(() => workOrdersApi.uploadPhotos(workOrder.id, form), "Photos uploaded");
          }}>
            <select name="photo_type" className="w-full border rounded-md h-10 px-3" defaultValue="before">
              <option value="before">Before</option>
              <option value="after">After</option>
              <option value="note">Note</option>
            </select>
            <Input type="file" name="photos" multiple accept="image/*" required />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "parts"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Request parts</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">This places the work order on hold with reason “Parts Required”. A supervisor issues stock.</p>
          <div className="space-y-3">
            <select className="w-full border rounded-md h-10 px-3" value={partForm.part_id} onChange={(event) => setPartForm((current) => ({ ...current, part_id: event.target.value }))}>
              <option value="">Select part</option>
              {catalog.parts.map((part) => <option key={part.id} value={part.id}>{part.name} ({part.sku})</option>)}
            </select>
            <Input type="number" min="0.001" step="0.001" value={partForm.quantity} onChange={(event) => setPartForm((current) => ({ ...current, quantity: event.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => run(() => workOrdersApi.requestParts(workOrder.id, {
              reason: "Parts Required",
              items: [{ part_id: partForm.part_id, quantity: Number(partForm.quantity) }],
            }), "Parts requested")}>Request and hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "issue" || dialog === "issue-request"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Issue parts</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="w-full border rounded-md h-10 px-3" value={partForm.stock_location_id} onChange={(event) => setPartForm((current) => ({ ...current, stock_location_id: event.target.value }))}>
              <option value="">Stock location</option>
              {catalog.stock_locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
            {dialog === "issue" && (
              <>
                <select className="w-full border rounded-md h-10 px-3" value={partForm.part_id} onChange={(event) => setPartForm((current) => ({ ...current, part_id: event.target.value }))}>
                  <option value="">Select part</option>
                  {catalog.parts.map((part) => <option key={part.id} value={part.id}>{part.name} ({part.sku})</option>)}
                </select>
                <Input type="number" min="0.001" step="0.001" value={partForm.quantity} onChange={(event) => setPartForm((current) => ({ ...current, quantity: event.target.value }))} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => run(() => (
              dialog === "issue-request"
                ? workOrdersApi.issuePartRequest(partForm.request_id, { stock_location_id: partForm.stock_location_id })
                : workOrdersApi.issuePartsDirect(workOrder.id, {
                  stock_location_id: partForm.stock_location_id,
                  items: [{ part_id: partForm.part_id, quantity: Number(partForm.quantity) }],
                })
            ), "Parts issued")}>Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "usage"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Record parts used</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="w-full border rounded-md h-10 px-3" value={partForm.part_id} onChange={(event) => setPartForm((current) => ({ ...current, part_id: event.target.value }))}>
              <option value="">Issued part</option>
              {(workOrder.part_requests || []).flatMap((request) => request.items || []).map((item) => (
                <option key={item.part_id} value={item.part_id}>{item.part_name || item.sku}</option>
              ))}
            </select>
            <Input type="number" min="0.001" step="0.001" value={partForm.quantity} onChange={(event) => setPartForm((current) => ({ ...current, quantity: event.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => run(() => workOrdersApi.recordUsage(workOrder.id, {
              items: [{ part_id: partForm.part_id, quantity: Number(partForm.quantity) }],
            }), "Usage recorded")}>Save usage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "complete"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Complete work order</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData();
            form.append("service_summary", complete.summary);
            if (complete.latitude) form.append("latitude", complete.latitude);
            if (complete.longitude) form.append("longitude", complete.longitude);
            [...(event.target.before_photos?.files || [])].forEach((file) => form.append("before_photos[]", file));
            [...(event.target.after_photos?.files || [])].forEach((file) => form.append("after_photos[]", file));
            run(() => workOrdersApi.complete(workOrder.id, form), "Completed");
          }}>
            <Textarea required placeholder="Service summary" value={complete.summary} onChange={(event) => setComplete((current) => ({ ...current, summary: event.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Latitude" value={complete.latitude} onChange={(event) => setComplete((current) => ({ ...current, latitude: event.target.value }))} />
              <Input placeholder="Longitude" value={complete.longitude} onChange={(event) => setComplete((current) => ({ ...current, longitude: event.target.value }))} />
            </div>
            <Button type="button" variant="outline" onClick={async () => {
              try {
                const coords = await getGps();
                setComplete((current) => ({ ...current, latitude: String(coords.latitude), longitude: String(coords.longitude) }));
              } catch (error) {
                toast.error(apiError(error, "Unable to read location"));
              }
            }}>Use current location</Button>
            <div><Label>Before photos</Label><Input type="file" name="before_photos" multiple accept="image/*" /></div>
            <div><Label>After photos</Label><Input type="file" name="after_photos" multiple accept="image/*" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit">Submit completion</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "taxonomy"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Change category and service</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="w-full border rounded-md h-10 px-3" value={taxonomy.category_id} onChange={(event) => setTaxonomy({ category_id: event.target.value, service_id: "" })}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}
            </select>
            <select className="w-full border rounded-md h-10 px-3" value={taxonomy.service_id} onChange={(event) => setTaxonomy((current) => ({ ...current, service_id: event.target.value }))}>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name_en}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => run(() => workOrdersApi.updateTaxonomy(workOrder.id, taxonomy), "Updated")}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
