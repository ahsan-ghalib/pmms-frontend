"use client";

import { useT } from "@/lib/use-t";

export function AppHeaderTitle() {
  const t = useT("common");

  return (
    <h1 className="bg-gradient-to-r from-violet-700 via-purple-600 to-violet-700 bg-clip-text text-lg font-bold tracking-tight text-transparent md:text-xl">
      {t("pmms_brand", { defaultMessage: "PMMS" })}
    </h1>
  );
}
