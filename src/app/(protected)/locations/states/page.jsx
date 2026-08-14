import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { StatesTable } from "@/containers/locations/states";

export const metadata = {
  title: "States | Soouq Live Admin",
};

export default function Page() {
  const breadcrumbData = [
    { name: "Locations", url: "/locations/countries" },
    { name: "States", url: "/locations/states" },
  ];
  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <StatesTable />
    </>
  );
}








