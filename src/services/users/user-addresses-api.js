import axiosInstance from "@/lib/axios";

export const userAddressesApi = {
  queries: {
    // Get list of all customer addresses
    getAddresses: async (params = {}) => {
      const response = await axiosInstance.get("/admin/user-addresses", { params });
      return response.data;
    },
  },
};
