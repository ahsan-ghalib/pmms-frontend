import axiosInstance from "@/lib/axios";

export const storesApi = {
  // Get all stores with pagination and filtering
  getStores: async (params = {}) => {
    const { page = 1, pageSize = 20, search = '' } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search && { search })
    });
    
    const response = await axiosInstance.get(`/stores?${queryParams}`);
    return response.data;
  },

  // Get store by ID
  getStoreById: async (id) => {
    const response = await axiosInstance.get(`/stores/${id}`);
    return response.data;
  },

  // Create new store
  createStore: async (storeData) => {
    const response = await axiosInstance.post("/stores", storeData);
    return response.data;
  },

  // Update store
  updateStore: async (id, storeData) => {
    const response = await axiosInstance.put(`/stores/${id}`, storeData);
    return response.data;
  },

  // Delete store
  deleteStore: async (id) => {
    const response = await axiosInstance.delete(`/stores/${id}`);
    return response.data;
  }
};
