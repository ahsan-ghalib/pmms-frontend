"use client";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useT } from "@/lib/use-t";

export const BreadcrumbComponent = ({ data, className }) => {
  const t = useT("common");
  return (
    <div className={`bg-white dark:bg-slate-900/40 shadow-sm border border-slate-100 dark:border-white/10 mb-6 w-fit rounded-full px-4 py-2 flex items-center ${className || ''}`}>
      <Breadcrumb>
        <BreadcrumbList>
          <div className="flex items-center">
            <BreadcrumbItem>
              <Link
                href="/"
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                <Home className="h-4 w-4 mr-3 text-primary" />
                <span>{t("Home", { defaultMessage: "Home" })}</span>
              </Link>
              {data?.length && (
                <ChevronRight size={18} className="text-primary mx-2" />
              )}
            </BreadcrumbItem>
          </div>
          {data?.length &&
            data.map((item, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbItem>
                  <Link
                    href={item.url}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                    {item.name}
                  </Link>
                  {index !== data.length - 1 && (
                    <ChevronRight size={18} className="text-primary mx-2" />
                  )}
                </BreadcrumbItem>
              </div>
            ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
