import { DataTable } from "@/components/common/data-table";

export default function BanksTable({
  dataList,
  columns,
  page,
  pageSize,
  total,
  setPage,
  setPageSize,
  loading,
  rowSelection,
  setRowSelection
}) {
  return (
    <DataTable
      data={dataList}
      columns={columns}
      page={page - 1}
      pageSize={pageSize}
      total={total}
      setPage={(p) => setPage(p + 1)}
      setPageSize={setPageSize}
      pagination={true}
      isLoading={loading}
      loadingText="Loading..."
      enableRowSelection={true}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      columnsBtn={false}
    />
  );
}
