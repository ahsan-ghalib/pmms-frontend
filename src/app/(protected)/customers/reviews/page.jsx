import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { ReviewsTable } from "@/containers/customers";

export default function CustomerReviewsPage() {
  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: "Customer Reviews", url: "/customers/reviews" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <ReviewsTable />
    </>
  );
}
