import axiosInstance from "@/lib/axios";

export const usersApi = {
  // Get all users with pagination and filtering
  getUsers: async (params = {}) => {
    const { page = 1, pageSize = 20, search = '', role = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search }),
      ...(role && { role })
    });
    
    const response = await axiosInstance.get(`/users?${queryParams}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await axiosInstance.post("/users", userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },

  // Get available roles
  getAvailableRoles: async () => {
    const response = await axiosInstance.get("/users/roles/available");
    return response.data;
  },

  // Upload user avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axiosInstance.post("/users/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};