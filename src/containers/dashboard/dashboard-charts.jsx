"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/lib/use-t";
import { labelize } from "@/lib/pmms";

const PALETTE = ["#7c3aed", "#2563eb", "#0d9488", "#d97706", "#e11d48", "#4f46e5", "#0284c7", "#059669"];

const STATUS_COLORS = {
  submitted: "#0284c7",
  created: "#64748b",
  assigned: "#4f46e5",
  in_progress: "#2563eb",
  on_hold: "#d97706",
  completed: "#059669",
  verified: "#0d9488",
  closed: "#16a34a",
  cancelled: "#e11d48",
  reopened: "#ea580c",
  urgent: "#e11d48",
  normal: "#64748b",
  preventive: "#7c3aed",
  subscription: "#2563eb",
  trial: "#d97706",
  none: "#94a3b8",
};

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#f8fafc",
  fontSize: 12,
  boxShadow: "0 12px 30px -12px rgba(15,23,42,0.45)",
};

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`glass-panel rounded-2xl p-5 ${className}`}>
      <div className="mb-4">
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-sm text-slate-400">
      {label}
    </div>
  );
}

function colorFor(key, index) {
  return STATUS_COLORS[key] || PALETTE[index % PALETTE.length];
}

export function VolumeChart({ data }) {
  const t = useT("common");
  const rows = Array.isArray(data) ? data : [];
  const hasValues = rows.some((row) => Number(row.complaints) || Number(row.work_orders));

  return (
    <ChartCard
      className="md:col-span-2"
      title={t("dash_volume_title", { defaultMessage: "14-day volume" })}
      subtitle={t("dash_volume_desc", { defaultMessage: "Complaints submitted vs work orders created." })}
    >
      {!hasValues ? (
        <EmptyChart label={t("dash_no_chart", { defaultMessage: "No activity in the last 14 days" })} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="dashComplaints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dashWorkOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString()}
            />
            <Legend />
            <Area type="monotone" dataKey="complaints" name={t("complaints", { defaultMessage: "Complaints" })} stroke="#7c3aed" fill="url(#dashComplaints)" strokeWidth={2} />
            <Area type="monotone" dataKey="work_orders" name={t("work_orders", { defaultMessage: "Work Orders" })} stroke="#2563eb" fill="url(#dashWorkOrders)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function StatusDonut({ title, subtitle, data }) {
  const t = useT("common");
  const rows = (Array.isArray(data) ? data : []).filter((row) => Number(row.value) > 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!rows.length ? (
        <EmptyChart label={t("dash_no_chart", { defaultMessage: "No activity in the last 14 days" })} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="label" innerRadius={58} outerRadius={86} paddingAngle={3}>
              {rows.map((row, index) => (
                <Cell key={row.key} fill={colorFor(row.key, index)} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, labelize(name)]} />
            <Legend formatter={(value) => labelize(value)} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function CategoryBars({ data, className = "md:col-span-2" }) {
  const t = useT("common");
  const rows = Array.isArray(data) ? data : [];
  const hasValues = rows.some((row) => Number(row.complaints) || Number(row.work_orders));

  return (
    <ChartCard
      className={className}
      title={t("dash_category_title", { defaultMessage: "Category mix" })}
      subtitle={t("dash_category_desc", { defaultMessage: "Where complaints and jobs are concentrating." })}
    >
      {!hasValues ? (
        <EmptyChart label={t("dash_no_chart", { defaultMessage: "No activity in the last 14 days" })} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="complaints" name={t("complaints", { defaultMessage: "Complaints" })} fill="#7c3aed" radius={[6, 6, 0, 0]} />
            <Bar dataKey="work_orders" name={t("work_orders", { defaultMessage: "Work Orders" })} fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function SimpleBars({ title, subtitle, data, color = "#7c3aed" }) {
  const t = useT("common");
  const rows = (Array.isArray(data) ? data : []).filter((row) => Number(row.value) > 0);

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {!rows.length ? (
        <EmptyChart label={t("dash_no_chart", { defaultMessage: "No activity in the last 14 days" })} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="label" tickFormatter={labelize} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={labelize} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {rows.map((row, index) => (
                <Cell key={row.key} fill={colorFor(row.key, index) || color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
