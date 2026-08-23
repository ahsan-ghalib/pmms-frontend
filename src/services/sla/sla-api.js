import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const slaApi = {
  options: async () => unwrapData((await axiosInstance.get("/sla-options")).data),
  policies: async (params = {}) => unwrapData((await axiosInstance.get("/sla/policies", { params })).data),
  showPolicy: async (id) => unwrapData((await axiosInstance.get(`/sla/policies/${id}`)).data),
  createPolicy: async (payload) => unwrapData((await axiosInstance.post("/sla/policies", payload)).data),
  updatePolicy: async (id, payload) => unwrapData((await axiosInstance.put(`/sla/policies/${id}`, payload)).data),
  snapshot: async (params) => unwrapData((await axiosInstance.get("/sla/snapshot", { params })).data),
  report: async (params = {}) => unwrapData((await axiosInstance.get("/sla/report", { params })).data),
  events: async (params = {}) => unwrapData((await axiosInstance.get("/sla/events", { params })).data),
};
