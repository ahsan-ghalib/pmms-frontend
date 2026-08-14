import React from "react";
import { EmployeesTable } from "@/containers/employees/employees-table";

export const metadata = {
  title: "Employees - Admin",
  description: "Manage your branch managers and staff.",
};

const EmployeesPage = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <EmployeesTable />
    </div>
  );
};

export default EmployeesPage;
