import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const notificationsApi = {
  options: async () => unwrapData((await axiosInstance.get("/notification-options")).data),
  inbox: async () => unwrapData((await axiosInstance.get("/notifications")).data),
  markRead: async (id) => unwrapData((await axiosInstance.patch(`/notifications/${id}/read`)).data),
  registerDevice: async (payload) => unwrapData((await axiosInstance.post("/devices", payload)).data),
  forgetDevice: async (device_token) => unwrapData((await axiosInstance.delete("/devices", { data: { device_token } })).data),
  templates: async (params = {}) => unwrapData((await axiosInstance.get("/notification-templates", { params })).data),
  saveTemplate: async (payload) => unwrapData((await axiosInstance.post("/notification-templates", payload)).data),
  setEmailEnabled: async (companyId, email_enabled) => unwrapData((await axiosInstance.put(`/companies/${companyId}/email-notifications`, { email_enabled })).data),
  broadcasts: async (params = {}) => unwrapData((await axiosInstance.get("/broadcasts", { params })).data),
  createBroadcast: async (payload) => unwrapData((await axiosInstance.post("/broadcasts", payload)).data),
};
