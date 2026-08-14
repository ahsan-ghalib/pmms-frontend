import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { CustomersTable } from "@/containers/customers";

export default function VIPCustomersPage() {
  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: "VIP Customers", url: "/customers/vip" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <CustomersTable
        filterType="vip"
        title="VIP Customers"
        description="View customers with high spending or frequent orders"
        loadingText="Loading VIP customers..."
      />
    </>
  );
}
