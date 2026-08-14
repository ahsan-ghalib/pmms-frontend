"use client";

import { useParams } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import WishlistItemsTable from "@/containers/customers/wishlist-items-table";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

export default function CustomerWishlistDetailPage() {
  const params = useParams();
  const customerId = params.customerId;
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (!customerId) return;
    axiosInstance
      .get(`/customers/${customerId}`)
      .then((res) => {
        const name = res.data?.data?.user?.name;
        if (name) setCustomerName(name);
      })
      .catch(() => {});
  }, [customerId]);

  const breadcrumbData = [
    { name: "Customers", url: "/customers" },
    { name: "Customer Wishlists", url: "/customers/wishlists" },
    { name: customerName || `Customer #${customerId}`, url: `/customers/wishlists/${customerId}` },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Wishlist Details</h1>
          <p className="text-muted-foreground">
            Products saved to this customer&apos;s wishlist.
          </p>
        </div>
        <WishlistItemsTable customerId={customerId} customerName={customerName} />
      </div>
    </>
  );
}
