import React from "react";
import { CustomerForm } from "@/containers/customers";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";

const breadcrumbData = [
  { name: "Customers", url: "/customers" },
  { name: "Create Customer", url: "/customers/create" },
];

const CreateCustomerPage = () => {
  return (
    <>
      {/* test */}
      <BreadcrumbComponent data={breadcrumbData} />
      <CustomerForm customerId={null} isEdit={false} />
    </>
  );
};

export default CreateCustomerPage;
