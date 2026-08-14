import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const platformApi = {
  languages: async () => unwrapData((await axiosInstance.get("/languages")).data),
  createLanguage: async (payload) => (await axiosInstance.post("/languages", payload)).data,
  updateLanguage: async (id, payload) => (await axiosInstance.put(`/languages/${id}`, payload)).data,
  deleteLanguage: async (id) => (await axiosInstance.delete(`/languages/${id}`)).data,

  plans: async () => unwrapData((await axiosInstance.get("/subscription-plans")).data),
  plan: async (id) => unwrapData((await axiosInstance.get(`/subscription-plans/${id}`)).data),
  planFeatures: async () => unwrapData((await axiosInstance.get("/subscription-plans/features")).data),
  createPlan: async (payload) => unwrapData((await axiosInstance.post("/subscription-plans", payload)).data),
  updatePlan: async (id, payload) => unwrapData((await axiosInstance.put(`/subscription-plans/${id}`, payload)).data),
  deletePlan: async (id) => (await axiosInstance.delete(`/subscription-plans/${id}`)).data,

  subscriptions: async (params = {}) => unwrapData((await axiosInstance.get("/subscriptions", { params })).data),
  subscription: async (id) => unwrapData((await axiosInstance.get(`/subscriptions/${id}`)).data),
  createSubscription: async (payload) => unwrapData((await axiosInstance.post("/subscriptions", payload)).data),
  updateSubscription: async (id, payload) => unwrapData((await axiosInstance.put(`/subscriptions/${id}`, payload)).data),
  deleteSubscription: async (id) => (await axiosInstance.delete(`/subscriptions/${id}`)).data,

  trials: async (params = {}) => unwrapData((await axiosInstance.get("/trials", { params })).data),
  createTrial: async (payload) => (await axiosInstance.post("/trials", payload)).data,
  updateTrial: async (id, payload) => (await axiosInstance.put(`/trials/${id}`, payload)).data,
  deleteTrial: async (id) => (await axiosInstance.delete(`/trials/${id}`)).data,

  settings: async () => unwrapData((await axiosInstance.get("/platform-settings")).data),
  updateSettings: async (payload) => unwrapData((await axiosInstance.put("/platform-settings", payload)).data),
};
