import axiosInstance from "@/lib/axios";

const BASE_URL = "/tables";

export const tablesApi = {
  getTables: async (params) => {
    const { data } = await axiosInstance.get(BASE_URL, { params });
    return data;
  },

  getTable: async (id, config = {}) => {
    const { data } = await axiosInstance.get(`${BASE_URL}/${id}`, config);
    return data;
  },

  createTable: async (payload) => {
    const { data } = await axiosInstance.post(BASE_URL, payload);
    return data;
  },

  updateTable: async (id, payload) => {
    const { data } = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return data;
  },

  deleteTable: async (id) => {
    const { data } = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return data;
  },
};
