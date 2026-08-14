import api from "@/lib/axios";

const BASE_URL = "/employees";

export const employeesApi = {
  getEmployees: async (params) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};
