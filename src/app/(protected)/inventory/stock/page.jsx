"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import StockLogs from "@/containers/inventory/stock-logs";
import { useT } from "@/lib/use-t";

export default function StockLogsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: t("stock_logs", { defaultMessage: "Stock logs" }), url: "/inventory/stock" },
      ]} />
      <StockLogs />
    </div>
  );
}
