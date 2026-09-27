import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const pmmsUsersApi = {
  list: async (params = {}) => unwrapData((await axiosInstance.get("/users", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/users/${id}`)).data),
  create: async (payload) => (await axiosInstance.post("/users", payload)).data,
  update: async (id, payload) => (await axiosInstance.put(`/users/${id}`, payload)).data,
  updateStatus: async (id, payload) => (await axiosInstance.patch(`/users/${id}/status`, payload)).data,
  statusHistory: async (id) => unwrapData((await axiosInstance.get(`/users/${id}/status-history`)).data),
  statusOptions: async () => unwrapData((await axiosInstance.get("/users/status-options")).data),
  assignProperties: async (id, payload) => (await axiosInstance.post(`/users/${id}/properties`, payload)).data,
  updateCoworkerPermission: async (id, can_add_coworkers) =>
    (await axiosInstance.patch(`/users/${id}/coworker-permission`, { can_add_coworkers })).data,
};
