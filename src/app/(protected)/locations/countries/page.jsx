import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { CountriesTable } from "@/containers/locations/countries";

export const metadata = { title: "Countries | Soouq Live Admin" };
export default function CountriesPage() {
  const breadcrumbData = [
    { name: "Locations", url: "/locations/countries" },
    { name: "Countries", url: "/locations/countries" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <CountriesTable />
    </>
  );
}








