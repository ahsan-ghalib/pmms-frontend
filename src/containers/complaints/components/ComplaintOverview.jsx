import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function ComplaintOverview({ complaint }) {
  const t = useTranslations("common");

  if (!complaint) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-xl">
            {t("complaint_details") || "Complaint Details"} <span className="text-teal-600">#{complaint.id}</span>
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{complaint.status}</Badge>
            <Badge variant="outline">{complaint.priority}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("sender") || "Sender"}
            </div>
            <div className="font-medium">{complaint.sender?.name || "N/A"}</div>
            <div className="text-sm text-muted-foreground">{complaint.sender?.email}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("vendor") || "Vendor"}
            </div>
            <div className="font-medium">{complaint.vendor?.name || "—"}</div>
            <div className="text-sm text-muted-foreground">{complaint.vendor?.email}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("type") || "Type"}
            </div>
            <div className="font-medium">{t(complaint.type) || complaint.type}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {t("order_id") || "Order ID"}
            </div>
            <div className="font-medium">
              {complaint.order_id ? `#${complaint.order_id}` : t("none") || "None"}
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {t("subject") || "Subject"}
          </div>
          <h2 className="text-lg font-bold mb-4">{complaint.subject}</h2>
          
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {t("description") || "Description"}
          </div>
          <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border">
            {complaint.description}
          </div>
        </div>

        {complaint.images && complaint.images.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              {t("attachments") || "Attachments"}
            </div>
            <div className="flex flex-wrap gap-4">
              {complaint.images.map((img, idx) => (
                <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block border rounded-lg overflow-hidden h-32 w-32 bg-slate-100 dark:bg-zinc-800">
                  <img src={img} alt={`Attachment ${idx + 1}`} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
