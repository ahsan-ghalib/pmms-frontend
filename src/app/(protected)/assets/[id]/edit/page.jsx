"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import AssetForm from "@/containers/assets/asset-form";
import { assetsApi } from "@/services/assets/assets-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function EditAssetPage() {
  const { id } = useParams();
  const t = useT("common");
  const [asset, setAsset] = useState(null);

  useEffect(() => {
    assetsApi.show(id).then(setAsset).catch((error) => {
      toast.error(apiError(error, t("asset_load_failed", { defaultMessage: "Failed to load asset" })));
    });
  }, [id]);

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("assets", { defaultMessage: "Assets" }), url: "/assets" },
        { name: asset?.name || t("details", { defaultMessage: "Details" }), url: `/assets/${id}` },
        { name: t("edit", { defaultMessage: "Edit" }), url: `/assets/${id}/edit` },
      ]} />
      {asset ? <AssetForm asset={asset} /> : <div className="glass-panel h-48 animate-pulse rounded-2xl" />}
    </div>
  );
}
