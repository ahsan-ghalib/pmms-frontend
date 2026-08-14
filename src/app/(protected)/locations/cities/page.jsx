import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { CitiesTable } from "@/containers/locations/cities";

export const metadata = {
  title: "Cities | Soouq Live Admin",
};

export default function Page() {
  const breadcrumbData = [
    { name: "Locations", url: "/locations/countries" },
    { name: "Cities", url: "/locations/cities" },
  ];
  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <CitiesTable />
    </>
  );
}








