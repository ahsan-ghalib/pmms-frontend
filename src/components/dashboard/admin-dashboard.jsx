"use client";

import { useEffect, useState } from "react";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Box,
} from "lucide-react";
import { dashboardApi } from "@/services/dashboard/dashboard-api";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const STAT_GRADIENTS = [
  { glow: "bg-violet-500", icon: "from-violet-500 to-purple-600" },
  { glow: "bg-blue-500", icon: "from-blue-500 to-cyan-500" },
  { glow: "bg-emerald-500", icon: "from-emerald-500 to-teal-500" },
  { glow: "bg-amber-500", icon: "from-amber-500 to-orange-500" },
];

const formatStatus = (status) => {
  if (!status) return "";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || "";
  if (s === "delivered") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (s === "dispatched" || s === "ready_for_delivery") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (s === "payment_completed" || s === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (s === "rejected" || s === "cancelled") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
};

export function AdminDashboard() {
  const t = useTranslations("admin");
  const breadcrumbData = [{ name: t("dashboard", { defaultMessage: "Dashboard" }), url: "/dashboard" }];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate.toISOString();
      if (dateRange.endDate) params.endDate = dateRange.endDate.toISOString();

      const response = await dashboardApi.getDashboardData(params);
      setDashboardData(response);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange.startDate, dateRange.endDate]);

  const formatCurrency = (amount) => {
    return `SAR ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US").format(num || 0);
  };

  const getChangeColor = (change) => {
    if (change > 0) return "text-emerald-600";
    if (change < 0) return "text-rose-600";
    return "text-muted-foreground";
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="mr-1 size-3" />;
    if (change < 0) return <TrendingDown className="mr-1 size-3" />;
    return null;
  };

  const StatCard = ({ title, value, change, icon: Icon, gradientIndex = 0, isCurrency = true }) => {
    const style = STAT_GRADIENTS[gradientIndex % STAT_GRADIENTS.length];

    return (
      <div className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:p-6">
        <div className={cn("glass-stat-glow", style.glow)} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {typeof value === "number"
                ? isCurrency
                  ? formatCurrency(value)
                  : formatNumber(value)
                : value}
            </p>
            {change !== undefined && (
              <p className={cn("mt-2 flex items-center text-xs font-medium", getChangeColor(change))}>
                {getChangeIcon(change)}
                {change > 0 ? "+" : ""}
                {change.toFixed(2)}% from previous period
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
              style.icon
            )}
          >
            <Icon className="size-5 text-white drop-shadow" strokeWidth={2.25} />
          </div>
        </div>
      </div>
    );
  };

  const GlassCard = ({ title, icon: Icon, children, action }) => (
    <div className="glass-panel rounded-2xl p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-600/20">
              <Icon className="size-4 text-violet-600" />
            </div>
          )}
          <h3 className="text-base font-semibold text-foreground md:text-lg">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const EmptyChart = ({ message }) => (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-violet-200/60 dark:border-violet-700/50 bg-violet-50/30 dark:bg-violet-900/10">
      <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
        <BarChart3 className="size-5 text-violet-500" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <>
        <BreadcrumbComponent data={breadcrumbData} />
        <div className="flex h-96 items-center justify-center">
          <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl px-10 py-8">
            <RefreshCw className="size-8 animate-spin text-violet-600" />
            <p className="text-sm text-muted-foreground">{t("Loading_dashboard", { defaultMessage: "Loading dashboard..." })}</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BreadcrumbComponent data={breadcrumbData} />
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="size-5" />
            <p>{error}</p>
          </div>
        </div>
      </>
    );
  }

  const {
    overview,
    revenueChart,
    orderStatusBreakdown,
    topProducts,
    categoryDistribution,
    recentOrders,
    salesByChannel,
    inventory,
    topBrands,
  } = dashboardData || {};

  const revenueChartOptions = {
    chart: { type: "area", height: 320, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    xaxis: {
      categories: revenueChart?.map((item) => format(new Date(item.period), "MMM dd")) || [],
      labels: { style: { colors: "#64748b", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (val) => formatCurrency(val), style: { colors: "#64748b", fontSize: "11px" } },
    },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] },
    },
    colors: ["#7C3AED"],
    tooltip: { y: { formatter: (val) => formatCurrency(val) } },
    grid: { borderColor: "rgba(124, 58, 237, 0.08)", strokeDashArray: 4 },
  };

  const revenueChartSeries = [{ name: "Revenue", data: revenueChart?.map((item) => item.revenue) || [] }];

  const orderStatusChartOptions = {
    chart: { type: "donut", height: 320, fontFamily: "inherit" },
    labels: orderStatusBreakdown?.map((item) => formatStatus(item.status)) || [],
    colors: ["#10b981", "#f59e0b", "#7C3AED", "#ef4444", "#3b82f6", "#ec4899"],
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: { formatter: (val) => `${val.toFixed(1)}%` },
    plotOptions: { pie: { donut: { size: "68%" } } },
    tooltip: { y: { formatter: (val) => `${val} orders` } },
  };

  const orderStatusChartSeries = orderStatusBreakdown?.map((item) => item.count) || [];

  const categoryChartOptions = {
    chart: { type: "bar", height: 320, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { horizontal: false, columnWidth: "50%", borderRadius: 8, borderRadiusApplication: "end" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: categoryDistribution?.map((item) => item.categoryName) || [],
      labels: { style: { colors: "#64748b", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (val) => formatCurrency(val), style: { colors: "#64748b", fontSize: "11px" } },
    },
    colors: ["#7C3AED"],
    tooltip: { y: { formatter: (val) => formatCurrency(val) } },
    grid: { borderColor: "rgba(124, 58, 237, 0.08)", strokeDashArray: 4 },
  };

  const categoryChartSeries = [{ name: "Revenue", data: categoryDistribution?.map((item) => item.revenue) || [] }];

  const salesChannelChartOptions = {
    chart: { type: "pie", height: 320, fontFamily: "inherit" },
    labels: salesByChannel?.map((item) => item.channel) || [],
    colors: ["#7C3AED", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"],
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: { formatter: (val) => `${val.toFixed(1)}%` },
    tooltip: { y: { formatter: (val) => formatCurrency(val) } },
  };

  const salesChannelChartSeries = salesByChannel?.map((item) => item.revenue) || [];

  return (
    <div className="space-y-6 md:space-y-8">
      <BreadcrumbComponent data={breadcrumbData} />

      {/* Hero + filters */}
      <div className="glass-panel-strong relative overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-violet-600">
              <Sparkles className="size-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Analytics</span>
            </div>
            <h2 className="bg-gradient-to-r from-violet-800 via-purple-700 to-violet-800 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl">
              {t("dashboard", { defaultMessage: "Dashboard" })}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {t("Dashboard_desc", { defaultMessage: "Real-time overview of your store performance, orders, and revenue metrics." })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              {t("Refresh", { defaultMessage: "Refresh" })}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">{t("Report_filters", { defaultMessage: "Report filters" })}</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-[140px] flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("PERIOD", { defaultMessage: "PERIOD" })}</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="7">{t("Last_7_days", { defaultMessage: "Last 7 days" })}</option>
              <option value="14">{t("Last_14_days", { defaultMessage: "Last 14 days" })}</option>
              <option value="30">{t("Last_30_days", { defaultMessage: "Last 30 days" })}</option>
              <option value="90">{t("Last_90_days", { defaultMessage: "Last 90 days" })}</option>
            </select>
          </div>
          <div className="flex min-w-[140px] flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("MONTHLY_CHART", { defaultMessage: "MONTHLY CHART" })}</label>
            <select
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="3">{t("3_months", { defaultMessage: "3 months" })}</option>
              <option value="6">{t("6_months", { defaultMessage: "6 months" })}</option>
              <option value="12">{t("12_months", { defaultMessage: "12 months" })}</option>
            </select>
          </div>
          <div className="flex min-w-[280px] flex-1 flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("CUSTOM_DATE", { defaultMessage: "CUSTOM DATE" })}</label>
            <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <Calendar className="size-4 text-violet-600 shrink-0" />
              <input
                type="date"
                value={dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value ? new Date(e.target.value) : null })
                }
                className="w-full min-w-0 border-0 bg-transparent outline-none"
              />
              <span className="text-muted-foreground shrink-0">{t("Admin_to", { defaultMessage: "to" })}</span>
              <input
                type="date"
                value={dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value ? new Date(e.target.value) : null })
                }
                className="w-full min-w-0 border-0 bg-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex min-w-[200px] items-center gap-3 pt-2 sm:pt-0">
            <button
              onClick={handleApplyFilters}
              className="h-10 flex-1 rounded-lg bg-violet-600 px-6 font-medium text-white transition-colors hover:bg-violet-700"
            >
              {t("Apply", { defaultMessage: "Apply" })}
            </button>
            <button
              onClick={() => {
                handleResetFilters();
                setDateRange({ startDate: null, endDate: null });
              }}
              className="h-10 flex-1 rounded-lg border border-input bg-background px-6 font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t("Reset", { defaultMessage: "Reset" })}
            </button>
          </div>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-5">
        <StatCard
          title={t("Admin_Total_Revenue", { defaultMessage: "Total Revenue" })}
          value={overview?.revenue?.current || 0}
          change={overview?.revenue?.change}
          icon={DollarSign}
          gradientIndex={0}
        />
        <StatCard
          title={t("Admin_Total_Orders", { defaultMessage: "Total Orders" })}
          value={overview?.orders?.current || 0}
          change={overview?.orders?.change}
          icon={ShoppingCart}
          gradientIndex={1}
          isCurrency={false}
        />
        <StatCard
          title={t("Admin_Customers", { defaultMessage: "Customers" })}
          value={overview?.customers?.current || 0}
          change={overview?.customers?.change}
          icon={Users}
          gradientIndex={2}
          isCurrency={false}
        />
        <StatCard
          title={t("Admin_Products", { defaultMessage: "Products" })}
          value={overview?.products?.current || 0}
          change={overview?.products?.change}
          icon={Package}
          gradientIndex={3}
          isCurrency={false}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <StatCard
          title={t("Admin_Average_Order_Value", { defaultMessage: "Average Order Value" })}
          value={overview?.averageOrderValue?.current || 0}
          change={overview?.averageOrderValue?.change}
          icon={Activity}
          gradientIndex={0}
        />
        <div className="glass-panel rounded-2xl p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Low_Stock_Items", { defaultMessage: "Low Stock Items" })}</p>
              <p className="mt-2 text-2xl font-bold md:text-3xl">{formatNumber(inventory?.lowStockVariants || 0)}</p>
              <p className="mt-2 flex items-center text-xs font-medium text-amber-600">
                <AlertCircle className="mr-1 size-3" />
                {t("Needs_attention", { defaultMessage: "Needs attention" })}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Box className="size-5 text-white" />
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Out_of_Stock", { defaultMessage: "Out of Stock" })}</p>
              <p className="mt-2 text-2xl font-bold md:text-3xl">{formatNumber(inventory?.outOfStockVariants || 0)}</p>
              <p className="mt-2 flex items-center text-xs font-medium text-rose-600">
                <AlertCircle className="mr-1 size-3" />
                {t("Requires_restocking", { defaultMessage: "Requires restocking" })}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
              <AlertCircle className="size-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-5">
        <GlassCard title={t("Revenue_Overview", { defaultMessage: "Revenue Overview" })} icon={BarChart3}>
          {revenueChart?.length > 0 ? (
            <Chart options={revenueChartOptions} series={revenueChartSeries} type="area" height={320} />
          ) : (
            <EmptyChart message={t("No_revenue_data", { defaultMessage: "No revenue data available" })} />
          )}
        </GlassCard>
        <GlassCard title={t("Order_Status_Breakdown", { defaultMessage: "Order Status Breakdown" })} icon={PieChart}>
          {orderStatusBreakdown?.length > 0 ? (
            <Chart options={orderStatusChartOptions} series={orderStatusChartSeries} type="donut" height={320} />
          ) : (
            <EmptyChart message={t("No_order_status_data", { defaultMessage: "No order status data available" })} />
          )}
        </GlassCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-5">
        <GlassCard title={t("Category_Distribution", { defaultMessage: "Category Distribution" })} icon={BarChart3}>
          {categoryDistribution?.length > 0 ? (
            <Chart options={categoryChartOptions} series={categoryChartSeries} type="bar" height={320} />
          ) : (
            <EmptyChart message={t("No_category_data", { defaultMessage: "No category data available" })} />
          )}
        </GlassCard>
        <GlassCard title={t("Sales_by_Channel", { defaultMessage: "Sales by Channel" })} icon={PieChart}>
          {salesByChannel?.length > 0 ? (
            <Chart options={salesChannelChartOptions} series={salesChannelChartSeries} type="pie" height={320} />
          ) : (
            <EmptyChart message={t("No_channel_data", { defaultMessage: "No channel data available" })} />
          )}
        </GlassCard>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-5">
        <GlassCard
          title={t("Top_Selling_Products", { defaultMessage: "Top Selling Products" })}
          icon={Package}
          action={
            <Link href="/orders" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
              {t("View_all", { defaultMessage: "View all" })} <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="space-y-2">
            {topProducts?.length > 0 ? (
              topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between rounded-xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 px-4 py-3 transition-colors hover:bg-white/70 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(product.totalQuantity)} {t("sold", { defaultMessage: "sold" })}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-violet-700">{formatCurrency(product.totalRevenue)}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("No_product_data", { defaultMessage: "No product data available" })}</p>
            )}
          </div>
        </GlassCard>

        <GlassCard
          title={t("Top_Brands", { defaultMessage: "Top Brands" })}
          icon={Sparkles}
          action={
            <Link
              href="/product-management/brands"
              className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              {t("View_all", { defaultMessage: "View all" })} <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="space-y-2">
            {topBrands?.length > 0 ? (
              topBrands.slice(0, 5).map((brand, index) => (
                <div
                  key={brand.brandId}
                  className="flex items-center justify-between rounded-xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 px-4 py-3 transition-colors hover:bg-white/70 dark:hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{brand.brandName}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(brand.quantity)} units {t("sold", { defaultMessage: "sold" })}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-violet-700">{formatCurrency(brand.revenue)}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("No_brand_data", { defaultMessage: "No brand data available" })}</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent orders */}
      <GlassCard
        title={t("Recent_Orders", { defaultMessage: "Recent Orders" })}
        icon={ShoppingCart}
        action={
          <Link href="/orders" className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
            {t("View_all", { defaultMessage: "View all" })} <ArrowUpRight className="size-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-white/50 dark:border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-violet-100/80 dark:border-white/10 bg-violet-50/40 dark:bg-slate-900/40">
                {[t("Order_ID", { defaultMessage: "Order ID" }), t("Customer", { defaultMessage: "Customer" }), t("Status", { defaultMessage: "Status" }), t("Amount", { defaultMessage: "Amount" }), t("Date", { defaultMessage: "Date" })].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders?.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-violet-50/80 dark:border-white/10 transition-colors hover:bg-white/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium">{order.slug}</td>
                    <td className="px-4 py-3 text-sm">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          getStatusColor(order.status)
                        )}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    {t("No_recent_orders", { defaultMessage: "No recent orders available" })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
