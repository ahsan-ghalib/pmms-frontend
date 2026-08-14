import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { CustomersTable } from "@/containers/customers";

export default function CustomersPage() {
  const breadcrumbData = [{ name: "Customers", url: "/customers" }];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <CustomersTable />
    </>
  );
}
