"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import TableToolbar from "@/components/common/table-toolbar";
import useDebounce from "@/hooks/useDebounceRef";
import { DataTable } from "@/components/common/data-table";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { MessageSquare, ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/common/stat-card";
import { getComplaintsColumns } from "./columns";

export default function ComplaintsTable() {
  const t = useTranslations("common");
  const router = useRouter();

  const [dataList, setDataList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [stats, setStats] = useState({
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    low: 0,
    medium: 0,
    high: 0
  });

  const columns = getComplaintsColumns(t, router);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/complaints", {
        params: { 
          page, 
          pageSize, 
          search: debouncedSearch,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        },
      });
      const payload = res.data;
      const data = payload?.data;
      
      setDataList(data?.data ?? data?.complaints ?? []);
      setTotal(data?.total ?? 0);
      
      if (payload?.stats) {
        setStats(payload.stats);
      } else {
        // Fallback mockup stats for testing UI before backend adds them
        setStats({
          pending: 12,
          in_progress: 5,
          resolved: 45,
          rejected: 3,
          low: 30,
          medium: 20,
          high: 15
        });
      }
    } catch (error) {
      toast.error(t("failed_to_load_complaints") || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter]);

  const toolbarConfig = {
    search: {
      placeholder: t("search_complaints") || "Search complaints...",
      value: search,
      onChange: (value) => {
        setSearch(value);
        setPage(1);
      },
    },
    filters: [
      {
        key: "status",
        placeholder: t("status") || "Status",
        options: [
          { label: t("pending") || "Pending", value: "pending" },
          { label: t("in_progress") || "In Progress", value: "in_progress" },
          { label: t("resolved") || "Resolved", value: "resolved" },
          { label: t("rejected") || "Rejected", value: "rejected" },
        ],
        value: statusFilter,
        onChange: (value) => {
          setStatusFilter(value === "all" ? "" : value);
          setPage(1);
        },
      },
      {
        key: "priority",
        placeholder: t("priority") || "Priority",
        options: [
          { label: t("low") || "Low", value: "low" },
          { label: t("medium") || "Medium", value: "medium" },
          { label: t("high") || "High", value: "high" },
        ],
        value: priorityFilter,
        onChange: (value) => {
          setPriorityFilter(value === "all" ? "" : value);
          setPage(1);
        },
      },
    ],
  };

  return (
    <>
      {/* Page Header Card */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="default" size="icon" className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm">
              <MessageSquare className="h-5 w-5 text-white" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("complaints") || "Complaints"}
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t("manage_complaints_description") || "Manage user and vendor complaints."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard title={t("pending") || "Pending"} value={stats.pending} theme="amber" />
        <StatCard title={t("in_progress") || "In Progress"} value={stats.in_progress} theme="blue" />
        <StatCard title={t("resolved") || "Resolved"} value={stats.resolved} theme="green" />
        <StatCard title={t("rejected") || "Rejected"} value={stats.rejected} theme="red" />
        <StatCard title={t("low") || "Low"} value={stats.low} theme="cyan" />
        <StatCard title={t("medium") || "Medium"} value={stats.medium} theme="orange" />
        <StatCard title={t("high") || "High"} value={stats.high} theme="rose" />
      </div>

      <TableToolbar 
        config={toolbarConfig} 
        rightSlot={
          <>
            {/* <Button variant="outline" size="sm" className="rounded-full h-10 px-4 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 shadow-sm">
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="rounded-full h-10 px-4 text-slate-700 dark:text-slate-200 border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button size="sm" className="rounded-full h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Complaint
            </Button> */}
          </>
        }
      />

      <div className="rounded-2xl overflow-hidden">
        <DataTable
          data={dataList}
          columns={columns}
          page={page - 1}
          pageSize={pageSize}
          total={total}
          setPage={(p) => setPage(p + 1)}
          setPageSize={() => {}}
          pagination={true}
          isLoading={loading}
          loadingText={t("loading") || "Loading..."}
          columnsBtn={false}
        />
      </div>
    </>
  );
}
