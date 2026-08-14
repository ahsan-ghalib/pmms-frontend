import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ComplaintItemsList({ items }) {
  const t = useTranslations("common");

  if (!items || items.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b">
        <CardTitle className="text-lg text-blue-800 dark:text-blue-300">
          {t("complaint_items") || "Complaint Items"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item, idx) => (
            <div key={idx} className="p-6 flex flex-col sm:flex-row gap-4">
              <div className="h-20 w-20 bg-slate-100 dark:bg-zinc-800 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-2">{item.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {item.order_line_id && <span><strong className="text-foreground">Line:</strong> #{item.order_line_id}</span>}
                  {item.quantity && <span><strong className="text-foreground">Qty:</strong> {item.quantity}</span>}
                  {item.price && <span><strong className="text-foreground">Price:</strong> {item.price}</span>}
                </div>
                {item.note && (
                  <div className="bg-slate-50 dark:bg-zinc-800 border p-3 rounded-md text-sm text-slate-700 dark:text-slate-300">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t("line_note") || "Line Note"}
                    </div>
                    {item.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
