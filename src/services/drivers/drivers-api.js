import axiosInstance from "@/lib/axios";

export const driversAPI = {
  getAll: async (params) => {
    const response = await axiosInstance.get("/drivers", { params });
    return response.data;
  },

  getLocations: async () => {
    const response = await axiosInstance.get("/driver-locations");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(`/drivers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosInstance.post("/drivers", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosInstance.put(`/drivers/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(`/drivers/${id}`);
    return response.data;
  },

  updateStatus: async (id, active_status) => {
    const response = await axiosInstance.put(`/drivers/${id}/status`, { active_status });
    return response.data;
  },

  updateVerification: async (id, verified) => {
    const response = await axiosInstance.put(`/drivers/${id}/verification`, { verified });
    return response.data;
  }
};
