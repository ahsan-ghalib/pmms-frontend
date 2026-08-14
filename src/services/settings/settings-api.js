import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const settingsApi = {
  complaintSettings: async (params = {}) => unwrapData((await axiosInstance.get("/complaint-settings", { params })).data),
  updateComplaintSettings: async (payload) => unwrapData((await axiosInstance.put("/complaint-settings", payload)).data),
  calendar: async () => unwrapData((await axiosInstance.get("/working-calendar")).data),
  updateCalendar: async (payload) => unwrapData((await axiosInstance.put("/working-calendar", payload)).data),
  addHoliday: async (payload) => unwrapData((await axiosInstance.post("/holidays", payload)).data),
  deleteHoliday: async (id) => (await axiosInstance.delete(`/holidays/${id}`)).data,
};

export const maintenanceApi = {
  list: async () => unwrapData((await axiosInstance.get("/maintenance-schedules")).data),
  create: async (payload) => (await axiosInstance.post("/maintenance-schedules", payload)).data,
  history: async (id) => unwrapData((await axiosInstance.get(`/maintenance-schedules/${id}/history`)).data),
  generate: async () => (await axiosInstance.post("/maintenance-schedules/generate")).data,
};
