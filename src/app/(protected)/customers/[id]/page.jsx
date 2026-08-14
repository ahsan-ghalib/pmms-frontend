import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { CustomerDetails } from "@/containers/customers";

export default async function CustomerDetailsPage({ params }) {
  const { id } = await params;
  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: "Details", url: `/customers/${id}` },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <CustomerDetails />
    </>
  );
}
