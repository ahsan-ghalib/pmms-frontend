import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const complaintsApi = {
  list: async (params = {}) => unwrapData((await axiosInstance.get("/complaints", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/complaints/${id}`)).data),
  context: async () => unwrapData((await axiosInstance.get("/complaints/context")).data),
  slots: async (params) => unwrapData((await axiosInstance.get("/complaints/slots", { params })).data),
  create: async (payload) => {
    const isForm = payload instanceof FormData;
    return (await axiosInstance.post("/complaints", payload, isForm ? { headers: { "Content-Type": undefined } } : {})).data;
  },
  transition: async (id, payload) => (await axiosInstance.patch(`/complaints/${id}/status`, payload)).data,
  addNote: async (id, note) => (await axiosInstance.post(`/complaints/${id}/notes`, { note })).data,
  categories: async (params = {}) => unwrapData((await axiosInstance.get("/categories", { params })).data),
  category: async (id) => unwrapData((await axiosInstance.get(`/categories/${id}`)).data),
  createCategory: async (payload) => unwrapData((await axiosInstance.post("/categories", payload)).data),
  updateCategory: async (id, payload) => unwrapData((await axiosInstance.put(`/categories/${id}`, payload)).data),
  deactivateCategory: async (id) => (await axiosInstance.delete(`/categories/${id}`)).data,
  restoreCategory: async (id) => (await axiosInstance.post(`/categories/${id}/restore`)).data,
  services: async (params = {}) => unwrapData((await axiosInstance.get("/services", { params })).data),
  service: async (id) => unwrapData((await axiosInstance.get(`/services/${id}`)).data),
  createService: async (categoryId, payload) => unwrapData((await axiosInstance.post(`/categories/${categoryId}/services`, payload)).data),
  updateService: async (id, payload) => unwrapData((await axiosInstance.put(`/services/${id}`, payload)).data),
  deactivateService: async (id) => (await axiosInstance.delete(`/services/${id}`)).data,
  restoreService: async (id) => (await axiosInstance.post(`/services/${id}/restore`)).data,
};
