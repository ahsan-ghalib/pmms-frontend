import { useTranslations } from "next-intl";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import DriversOverview from "@/containers/drivers/drivers-overview";

export default function DriversPage() {
  const t = useTranslations("admin");
  const breadcrumbData = [
    { name: t("Drivers", { defaultMessage: "Drivers" }), url: "/drivers" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <DriversOverview />
    </>
  );
}
