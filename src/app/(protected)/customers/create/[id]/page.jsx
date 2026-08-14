import React from "react";
import { CustomerForm } from "@/containers/customers";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";

const CreateCustomerPage = ({ params }) => {
  const isEdit = !!params?.id;
  const customerId = params?.id || null;
  
  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: isEdit ? "Edit Customer" : "Create Customer", url: isEdit ? `/customers/create/${customerId}` : "/customers/create" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <CustomerForm customerId={customerId} isEdit={isEdit} />
    </>
  );
};

export default CreateCustomerPage;

