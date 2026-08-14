import React from "react";

export default function Container({ children, className = "" }) {
  return (
    <div className={`bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}
