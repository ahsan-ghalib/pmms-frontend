import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import WishlistUsersTable from "@/containers/customers/wishlist-users-table";

export default function CustomerWishlistsPage() {
  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: "Customer Wishlists", url: "/customers/wishlists" },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Wishlists</h1>
          <p className="text-muted-foreground">
            Customers who have added items to their wishlist. Click View Wishlist to see their saved products.
          </p>
        </div>
        <WishlistUsersTable />
      </div>
    </>
  );
}
