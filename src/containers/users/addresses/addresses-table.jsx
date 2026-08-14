"use client";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { getAddressesColumns } from "./addresses-columns";
import { toast } from "sonner";
import { Search } from "lucide-react";
import TableToolbar from "@/components/common/table-toolbar";
import { userAddressesApi } from "@/services/users/user-addresses-api";
import useDebounce from "@/hooks/useDebounceRef";
import { useTranslations } from "next-intl";

export function AddressesTable() {
  const t = useTranslations("admin");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      };

      if (searchQuery) {
        params["filter[full_name]"] = searchQuery;
      }

      const response = await userAddressesApi.queries.getAddresses(params);
      
      if (response && response.data) {
        setData(response.data);
        setTotalRows(response.meta?.total || response.data.length);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error(t("failed_to_fetch_addresses") || "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useDebounce((value) => {
    setSearchQuery(value);
    setPagination({ ...pagination, pageIndex: 0 }); // Reset to first page
  }, 500);

  useEffect(() => {
    fetchAddresses();
  }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

  const columns = getAddressesColumns(t);

  return (
    <div className="space-y-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <TableToolbar
        title={t("customer_addresses") || "Customer Addresses"}
        description={t("manage_customer_addresses_description") || "View all customer addresses across the platform."}
        searchConfig={{
          placeholder: t("search_by_name") || "Search by name...",
          onChange: handleSearch,
          icon: Search,
        }}
      />
      
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={Math.ceil(totalRows / pagination.pageSize)}
      />
    </div>
  );
}
