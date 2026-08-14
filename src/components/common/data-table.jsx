"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/common/data-table-pagination";
import { LoadingSpinner } from "@/helper/Loader";

export function DataTable({
  t = useTranslations("common"),
  data,
  columns,
  page,
  pageSize,
  total,
  style,
  setPage,
  setPageSize,
  pagination = true,
  columnsBtn = true,
  isLoading = false,
  loadingText = "Loading data...",
  enableRowSelection = false,
  onRowSelectionChange,
  rowSelection: controlledRowSelection,
  onBulkAction,
  bulkActionLabel = "Bulk Action",
  bulkActionIcon,
}) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [internalRowSelection, setInternalRowSelection] = React.useState({});

  // Use controlled selection if provided, otherwise use internal state
  const rowSelection = enableRowSelection && controlledRowSelection !== undefined 
    ? controlledRowSelection 
    : internalRowSelection;

  // Handle row selection changes
  const handleRowSelectionChange = React.useCallback((updater) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    
    // If controlled, only call the callback. Otherwise, update internal state.
    if (enableRowSelection && controlledRowSelection !== undefined) {
      if (onRowSelectionChange) {
        onRowSelectionChange(newSelection);
      }
    } else {
      setInternalRowSelection(newSelection);
      if (onRowSelectionChange) {
        onRowSelectionChange(newSelection);
      }
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection, controlledRowSelection]);

  const safeData = React.useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  const safeTotal = React.useMemo(() => {
    return typeof total === "number" && total >= 0 ? total : 0;
  }, [total]);

  const safePageSize = React.useMemo(() => {
    return typeof pageSize === "number" && pageSize > 0 ? pageSize : 10;
  }, [pageSize]);

  const safePage = React.useMemo(() => {
    return typeof page === "number" && page >= 0 ? page : 0;
  }, [page]);

  const safeColumns = React.useMemo(() => {
    return Array.isArray(columns) ? columns : [];
  }, [columns]);

  // Reset internal selection when data changes significantly (e.g., after deletion)
  React.useEffect(() => {
    if (enableRowSelection && controlledRowSelection === undefined) {
      // Only reset internal state if not controlled
      setInternalRowSelection({});
    }
  }, [safeData.length, enableRowSelection, controlledRowSelection]);

  const table = useReactTable({
    data: safeData,
    columns: safeColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
    enableRowSelection: enableRowSelection,
    manualPagination: true,
    autoResetPageIndex: false,
    pageCount: Math.ceil(safeTotal / safePageSize) || 1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(enableRowSelection && { rowSelection }),
      pagination: {
        pageIndex: safePage,
        pageSize: safePageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex: safePage, pageSize: safePageSize });
        if (next.pageIndex !== safePage && setPage) setPage(next.pageIndex);
        if (next.pageSize !== safePageSize && setPageSize)
          setPageSize(next.pageSize);
      } else {
        if (
          updater.pageIndex !== undefined &&
          updater.pageIndex !== safePage &&
          setPage
        )
          setPage(updater.pageIndex);
        if (
          updater.pageSize !== undefined &&
          updater.pageSize !== safePageSize &&
          setPageSize
        )
          setPageSize(updater.pageSize);
      }
    },
  });

  const showToolbar =
    (enableRowSelection && onBulkAction && Object.keys(rowSelection).length > 0)
    || (columnsBtn && safeColumns.length > 0);

  return (
    <div className="w-full" style={style}>
      {showToolbar && (
        <div className="mb-3 flex items-center justify-between">
          {enableRowSelection && onBulkAction && Object.keys(rowSelection).length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {Object.keys(rowSelection).length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedRows = table.getSelectedRowModel().rows;
                  onBulkAction(selectedRows);
                }}
              >
                {bulkActionIcon}
                {bulkActionLabel}
              </Button>
            </div>
          )}

          {columnsBtn && safeColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  {t("Columns", { defaultMessage: "Columns" })} <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      <div className={isLoading ? "" : "overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40"}>
        {isLoading ? (
          <div className="min-h-[44vh] flex flex-col items-center justify-start space-y-3 pt-14">
            <LoadingSpinner className="w-8 h-8 text-gray-500 dark:text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loadingText || "Loading data..."}
            </p>
          </div>
        ) : (
          <Table className="w-full text-sm">
            <TableHeader className="bg-white/30 dark:bg-slate-800/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-white/50 dark:border-white/10 hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className="h-11 px-5 text-[12px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 align-middle"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-white/60 dark:hover:bg-slate-800/50 transition-colors border-b border-white/50 dark:border-white/10 last:border-0 bg-transparent"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="px-5 py-3 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={safeColumns.length || 1}
                    className="h-24 text-center text-slate-500 dark:text-slate-400"
                  >
                    {t("No_results", { defaultMessage: "No results." })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination && !isLoading && (
        <div className="mt-4">
        <DataTablePagination
          table={table}
          page={safePage}
          pageSize={safePageSize}
          setPage={setPage}
          setPageSize={setPageSize}
          total={safeTotal}
        />
        </div>
      )}
    </div>
  );
}
