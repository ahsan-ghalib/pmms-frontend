import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const companiesApi = {
  list: async (params = {}) => unwrapData((await axiosInstance.get("/companies", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/companies/${id}`)).data),
  create: async (payload) => unwrapData((await axiosInstance.post("/companies", payload)).data),
  update: async (id, payload) => unwrapData((await axiosInstance.put(`/companies/${id}`, payload)).data),
  archive: async (id) => (await axiosInstance.delete(`/companies/${id}`)).data,
  restore: async (id) => (await axiosInstance.post(`/companies/${id}/restore`)).data,
};
