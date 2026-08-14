"use client";

import { cn } from "@/lib/utils";

const themeStyles = {
  grey: {
    gradient: "from-slate-500/10 to-slate-500/5",
    title: "text-slate-500",
    value: "text-slate-700",
  },
  blue: {
    gradient: "from-blue-500/10 to-blue-500/5",
    title: "text-blue-500",
    value: "text-blue-600",
  },
  green: {
    gradient: "from-green-500/10 to-green-500/5",
    title: "text-green-500",
    value: "text-green-600",
  },
  purple: {
    gradient: "from-purple-500/10 to-purple-500/5",
    title: "text-purple-500",
    value: "text-purple-600",
  },
  red: {
    gradient: "from-red-500/10 to-red-500/5",
    title: "text-red-500",
    value: "text-red-600",
  },
  amber: {
    gradient: "from-amber-500/10 to-amber-500/5",
    title: "text-amber-500",
    value: "text-amber-600",
  },
  cyan: {
    gradient: "from-cyan-500/10 to-cyan-500/5",
    title: "text-cyan-500",
    value: "text-cyan-600",
  },
  teal: {
    gradient: "from-teal-500/10 to-teal-500/5",
    title: "text-teal-500",
    value: "text-teal-600",
  },
  indigo: {
    gradient: "from-indigo-500/10 to-indigo-500/5",
    title: "text-indigo-500",
    value: "text-indigo-600",
  },
  orange: {
    gradient: "from-orange-500/10 to-orange-500/5",
    title: "text-orange-500",
    value: "text-orange-600",
  },
  rose: {
    gradient: "from-rose-500/10 to-rose-500/5",
    title: "text-rose-500",
    value: "text-rose-600",
  },
};

export default function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  theme = "grey",
  className,
  onClick,
}) {
  const styles = themeStyles[theme] || themeStyles.grey;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group min-h-[100px] text-left w-full",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br", styles.gradient)}></div>
      
      <div className="flex justify-between items-start z-10 mb-2">
        <span className={cn("text-3xl font-black tracking-tight", styles.value)}>
          {value}
        </span>
        {Icon && (
          <div className={cn("p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm", styles.title)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="z-10">
        <span className={cn("text-xs font-bold uppercase tracking-wider", styles.title)}>
          {title}
        </span>
        {hint ? <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{hint}</p> : null}
      </div>
    </Tag>
  );
}
