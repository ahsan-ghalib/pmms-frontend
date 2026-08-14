import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { ReviewDetails } from "@/containers/customers";

export default function ReviewDetailsPage() {
  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: "Customer Reviews", url: "/customers/reviews" },
    { name: "Review Details", url: "#" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <ReviewDetails />
    </>
  );
}

