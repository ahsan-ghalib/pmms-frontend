import axiosInstance from "@/lib/axios";

const BASE_URL = "/cashiers";

export const cashiersApi = {
  getCashiers: async (params) => {
    const response = await axiosInstance.get(BASE_URL, { params });
    return response.data;
  },

  getCashier: async (id) => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createCashier: async (data) => {
    const response = await axiosInstance.post(BASE_URL, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateCashier: async (id, data) => {
    // If data is FormData, we append _method = PUT to it for Laravel, and send as POST.
    // Otherwise we just do a regular PUT.
    if (data instanceof FormData) {
      data.append("_method", "PUT");
      const response = await axiosInstance.post(`${BASE_URL}/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } else {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
      return response.data;
    }
  },

  deleteCashier: async (id) => {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
