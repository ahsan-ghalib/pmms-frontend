import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';


export function DataTablePagination({
  table,
  page,
  setPage,
  pageSize,
 setPageSize,
 
  total ,
}) {
  const t = useTranslations("common");
  const [pageInput, setPageInput] = useState(String(page + 1));
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Update input when page changes externally
  useEffect(() => {
    setPageInput(String(page + 1));
  }, [page]);

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    // Allow empty input or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInput, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      setPageInput(String(page + 1));
    } else if (pageNum > totalPages) {
      setPage(totalPages - 1);
      setPageInput(String(totalPages));
    } else {
      setPage(pageNum - 1);
      setPageInput(String(pageNum));
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  // Generate page numbers to display (show current page ± 2 pages, with ellipsis)
  const getPageNumbers = () => {
    const pages = [];
    const currentPage = page + 1;
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-end');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push('ellipsis-start');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis-start');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-end');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4 w-full gap-4 sm:gap-0">
      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex-1">
        {table?.getFilteredSelectedRowModel?.()?.rows.length ?? 0} of{' '}
        {table?.getFilteredRowModel?.()?.rows.length ?? 0} {t("rows_selected", { defaultMessage: "row(s) selected" })}
      </div>

      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("Rows_per_page", { defaultMessage: "Rows per page" })}</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[70px] bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/60 border-slate-200/60 dark:border-white/10 rounded-xl shadow-sm transition-all text-slate-700 dark:text-slate-300 font-medium">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl border-slate-200/60 dark:border-white/10 shadow-lg bg-white/95 dark:bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl">
              {[10, 20, 25, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)} className="rounded-lg cursor-pointer">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <span>{t("Page", { defaultMessage: "Page" })}</span>
            <Input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="h-9 w-12 text-center px-1 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-800 border-slate-200/60 dark:border-white/10 rounded-xl shadow-sm transition-all font-semibold text-slate-800 dark:text-slate-200"
              aria-label="Page number"
            />
            <span>of {totalPages}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex size-9 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-0.5 border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300 text-slate-600 dark:text-slate-300"
            onClick={() => setPage(0)}
            disabled={page === 0}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-0.5 border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300 text-slate-600 dark:text-slate-300"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Page number buttons */}
          {totalPages > 1 && (
            <div className="hidden md:flex items-center space-x-1.5 mx-1">
              {getPageNumbers().map((pageNum, index) => {
                if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400 dark:text-slate-500 font-medium">
                      ...
                    </span>
                  );
                }
                const isActive = pageNum === page + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`h-9 w-9 p-0 rounded-xl shadow-sm transition-all duration-300 font-bold ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] border-blue-600 hover:bg-blue-700 hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5' 
                        : 'bg-white/50 hover:bg-white hover:-translate-y-0.5 border-slate-200/60 text-slate-600 dark:text-slate-300'
                    }`}
                    onClick={() => {
                      setPage(pageNum - 1);
                      setPageInput(String(pageNum));
                    }}
                    disabled={isActive}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
          )}
          
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-0.5 border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300 text-slate-600 dark:text-slate-300"
            onClick={() => setPage(page + 1)}
            disabled={page + 1 >= totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex size-9 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-0.5 border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-300 text-slate-600 dark:text-slate-300"
            onClick={() => {
              setPage(totalPages - 1);
              setPageInput(String(totalPages));
            }}
            disabled={page + 1 >= totalPages}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
