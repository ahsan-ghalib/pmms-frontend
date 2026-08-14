import axiosInstance from "@/lib/axios";

export const rolesPermissionsApi = {
  getRoles: async (search = "") => {
    const response = await axiosInstance.get("/roles", {
      params: search ? { search } : undefined,
    });
    return response.data?.data || [];
  },

  getRolePermissions: async (roleId) => {
    const response = await axiosInstance.get(`/roles/${roleId}/permissions`);
    return response.data?.data || [];
  },

  updateRolePermissions: async (roleId, permissionIds) => {
    const response = await axiosInstance.patch(`/roles/${roleId}/permissions`, {
      permissions: permissionIds,
    });
    return response.data;
  },

  // Get encrypted permissions for current user
  getEncryptedPermissions: async () => {
    const response = await axiosInstance.get("/permissions");
    return response.data;
  },
};

