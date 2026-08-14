import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const propertiesApi = {
  types: async () => unwrapData((await axiosInstance.get("/properties/types")).data),
  list: async (params = {}) => unwrapData((await axiosInstance.get("/properties", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/properties/${id}`)).data),
  tree: async (id, params = {}) => unwrapData((await axiosInstance.get(`/properties/${id}/tree`, { params })).data),
  create: async (payload) => unwrapData((await axiosInstance.post("/properties", payload)).data),
  update: async (id, payload) => unwrapData((await axiosInstance.put(`/properties/${id}`, payload)).data),
  archive: async (id) => unwrapData((await axiosInstance.delete(`/properties/${id}`)).data),
  restore: async (id) => unwrapData((await axiosInstance.post(`/properties/${id}/restore`)).data),
  pin: async (id, payload) => unwrapData((await axiosInstance.post(`/properties/${id}/pin`, payload)).data),
  addLocation: async (id, payload) => unwrapData((await axiosInstance.post(`/properties/${id}/locations`, payload)).data),
  updateLocation: async (id, payload) => unwrapData((await axiosInstance.put(`/locations/${id}`, payload)).data),
  archiveLocation: async (id) => unwrapData((await axiosInstance.delete(`/locations/${id}`)).data),
  restoreLocation: async (id) => unwrapData((await axiosInstance.post(`/locations/${id}/restore`)).data),
  pinLocation: async (id, payload) => unwrapData((await axiosInstance.post(`/locations/${id}/pin`, payload)).data),
  addSubLocation: async (id, payload) => unwrapData((await axiosInstance.post(`/locations/${id}/sub-locations`, payload)).data),
  updateSubLocation: async (id, payload) => unwrapData((await axiosInstance.put(`/sub-locations/${id}`, payload)).data),
  archiveSubLocation: async (id) => unwrapData((await axiosInstance.delete(`/sub-locations/${id}`)).data),
  restoreSubLocation: async (id) => unwrapData((await axiosInstance.post(`/sub-locations/${id}/restore`)).data),
  addUnit: async (id, payload) => unwrapData((await axiosInstance.post(`/sub-locations/${id}/units`, payload)).data),
  updateUnit: async (id, payload) => unwrapData((await axiosInstance.put(`/units/${id}`, payload)).data),
  archiveUnit: async (id) => unwrapData((await axiosInstance.delete(`/units/${id}`)).data),
  restoreUnit: async (id) => unwrapData((await axiosInstance.post(`/units/${id}/restore`)).data),
};
