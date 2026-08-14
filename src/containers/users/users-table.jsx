"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { DeleteDialogBox } from "@/components/common/delete-dialog-box";
import { useRouter } from "next/navigation";
import { usersColumns } from "./users-columns";
import { toast } from "sonner";
import { Plus, Users, Search, Filter } from "lucide-react";
import TableToolbar from "@/components/common/table-toolbar";
import { usersApi } from "@/services/users/users-api";
import useDebounce from "@/hooks/useDebounceRef";
import { hasPermissionSync, Permissions } from "@/lib/permissions";
import { useTranslations } from "next-intl";
import axiosInstance from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersTable({
  filterType = "all",
  outletId = null,
  title,
  description,
  loadingText,
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [tableData, setTableData] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 1000);

  const fetchTableData = async (page, pageSize, search = "", role = "") => {
    setIsTableLoading(true);
    try {
      const response = await usersApi.getUsers({
        page: page + 1,
        pageSize,
        search: search.trim(),
        role: role || undefined,
      });
      setTableData(response.data?.users || []);
      setTotal(response.data?.total ?? 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(page, pageSize, debouncedSearch, roleFilter);
  }, [page, pageSize, debouncedSearch, roleFilter]);

  const handleSearchChange = (value) => {
    setPage(0);
    setSearch(value);
  };

  const handleRoleFilterChange = (value) => {
    setPage(0);
    setRoleFilter(value === "all" ? "" : value);
  };

  const handleEdit = (user) => {
    router.push(`/users/edit/${user.id}`);
  };

  const handleDelete = (user) => {
    if (currentUserId && user.id === currentUserId) {
      toast.error("You cannot delete your own account");
      return;
    }
    setUserToDelete(user);
    setDeletePopupOpen(true);
  };

  const handleViewDetails = (user) => {
    router.push(`/users/${user.id}`);
  };

  const handleLoginAs = async (user) => {
    if (currentUserId && user.id === currentUserId) {
      toast.error("You cannot login as yourself");
      return;
    }
    try {
      const res = await axiosInstance.post("/auth/login-as", {
        userId: user.id,
      });
      const accessToken = res.data?.access_token;
      const permissions = res.data?.permissions;
      if (!accessToken) {
        toast.error("Invalid response from server");
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("soouqlive_impersonate_token", accessToken);
        if (permissions) {
          localStorage.setItem("soouqlive_permissions", permissions);
        }
        // Store basic impersonated user info for UI (optional)
        const impersonatedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name ?? null,
        };
        localStorage.setItem("soouqlive_impersonate_user", JSON.stringify(impersonatedUser));
      }
      toast.success(`You are now impersonating ${user.name || user.email}`);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to login as user");
    }
  };

  const handleToggleStatus = async (user, isActive) => {
    if (!hasPermissionSync(Permissions.EDIT_USERS)) {
      toast.error("You don't have permission to update user status");
      return;
    }

    try {
      await usersApi.updateUser(user.id, { isActive });
      
      setTableData((prevData) =>
        prevData.map((item) =>
          item.id === user.id ? { ...item, isActive } : item
        )
      );

      toast.success(
        `User ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteUser(userToDelete.id);

      setTableData((prevData) =>
        prevData.filter((item) => item.id !== userToDelete.id)
      );
      setTotal(prev => prev - 1);
      toast.success("User deleted successfully");
      setDeletePopupOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description || t("Manage_system_users", { defaultMessage: "Manage system users and their roles" })}</p>
        </div>
        <div>
          {hasPermissionSync(Permissions.ADD_USERS) && (
            <Button
              onClick={() => router.push("/users/create")}
              className="w-full md:w-auto mx-2 btn-glass-purple border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("Admin_Add_User", { defaultMessage: "Add User" })}
            </Button>
          )}
        </div>
      </div>

      <TableToolbar
        placeholder={t("Search_users", { defaultMessage: "Search users by name, email, or phone..." })}
        total={total}
        onSearchChange={handleSearchChange}
        rightSlot={
          <div className="flex items-center gap-4">
            <Select value={roleFilter || "all"} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("Filter_by_role", { defaultMessage: "Filter by role" })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("Admin_All_Roles", { defaultMessage: "All Roles" })}</SelectItem>
                <SelectItem value="super-admin">{t("Admin_Super_Admin", { defaultMessage: "Super Admin" })}</SelectItem>
                <SelectItem value="admin">{t("Admin_Admin", { defaultMessage: "Admin" })}</SelectItem>
                <SelectItem value="user">{t("Admin_User", { defaultMessage: "User" })}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>{t("Admin_users_found", { defaultMessage: "{total} users found", total })}</span>
            </div>
          </div>
        }
      />

      <DataTable
        columns={usersColumns(
          t,
          handleEdit,
          handleDelete,
          handleViewDetails,
          handleToggleStatus,
          currentUserId,
          handleLoginAs
        )}
        data={tableData}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={total}
        isLoading={isTableLoading}
        loadingText={loadingText}
      />

      <DeleteDialogBox
        open={deletePopupOpen}
        onClose={() => setDeletePopupOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={t("Delete_User", { defaultMessage: "Delete User" })}
        description={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}