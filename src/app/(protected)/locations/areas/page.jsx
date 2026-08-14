import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { AreasTable } from "@/containers/locations/areas";

export const metadata = {
  title: "Areas | Soouq Live Admin",
};

export default function Page() {
  const breadcrumbData = [
    { name: "Locations", url: "/locations/countries" },
    { name: "Areas", url: "/locations/areas" },
  ];
  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <AreasTable />
    </>
  );
}








