import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ComplaintStatusHistory({ logs }) {
  const t = useTranslations("common");

  if (!logs || logs.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="bg-teal-50/50 dark:bg-teal-900/10 border-b">
        <CardTitle className="text-lg text-teal-800 dark:text-teal-300">
          {t("complaint_status_history") || "Complaint Status History"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-3 space-y-8">
          {logs.map((log, idx) => (
            <div key={idx} className="relative pl-6">
              <div className="absolute w-3.5 h-3.5 bg-teal-500 border-2 border-white dark:border-zinc-950 rounded-full -left-[9px] top-1"></div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {new Date(log.created_at).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {log.status_from ? (
                  <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
                    {t(log.status_from) || log.status_from}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-600 dark:text-slate-300">—</Badge>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge className="text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800">
                  {t(log.status_to) || log.status_to}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{t("actor") || "Actor"}:</span> {log.actor_type || "System"}
                {log.changed_by && (
                  <span className="ml-2">
                    <span className="font-semibold text-foreground">{t("by_user") || "By User"}:</span> {log.changed_by.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
