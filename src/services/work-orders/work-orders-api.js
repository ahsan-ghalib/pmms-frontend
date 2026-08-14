import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const workOrdersApi = {
  list: async (params = {}) => unwrapData((await axiosInstance.get("/work-orders", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/work-orders/${id}`)).data),
  create: async (payload) => (await axiosInstance.post("/work-orders", payload)).data,
  history: async (id) => unwrapData((await axiosInstance.get(`/work-orders/${id}/history`)).data),
  exportHistory: async (id) => unwrapData((await axiosInstance.get(`/work-orders/${id}/history/export`)).data),
  assign: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/assign`, payload)).data,
  accept: async (id) => (await axiosInstance.post(`/work-orders/${id}/accept`)).data,
  reject: async (id, reason) => (await axiosInstance.post(`/work-orders/${id}/reject`, { reason })).data,
  hold: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/hold`, payload)).data,
  resume: async (id) => (await axiosInstance.post(`/work-orders/${id}/resume`)).data,
  reschedule: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/reschedule`, payload)).data,
  complete: async (id, payload) => {
    const isForm = payload instanceof FormData;
    return (await axiosInstance.post(`/work-orders/${id}/complete`, payload, isForm ? { headers: { "Content-Type": undefined } } : {})).data;
  },
  verify: async (id) => (await axiosInstance.post(`/work-orders/${id}/verify`)).data,
  rework: async (id, reason) => (await axiosInstance.post(`/work-orders/${id}/rework`, { reason })).data,
  close: async (id, reason) => (await axiosInstance.post(`/work-orders/${id}/close`, { reason })).data,
  cancel: async (id, reason) => (await axiosInstance.post(`/work-orders/${id}/cancel`, { reason })).data,
  updateTaxonomy: async (id, payload) => (await axiosInstance.patch(`/work-orders/${id}/taxonomy`, payload)).data,
  addNote: async (id, note) => (await axiosInstance.post(`/work-orders/${id}/notes`, { note })).data,
  requestReschedule: async (id, reason) => (await axiosInstance.post(`/work-orders/${id}/reschedule-requests`, { reason })).data,
  approveReschedule: async (id, payload) => (await axiosInstance.post(`/reschedule-requests/${id}/approve`, payload)).data,
  rejectReschedule: async (id, reason) => (await axiosInstance.post(`/reschedule-requests/${id}/reject`, { reason })).data,
  rate: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/rating`, payload)).data,
  reopen: async (id) => (await axiosInstance.post(`/work-orders/${id}/reopen`)).data,
  checkIn: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/check-in`, payload)).data,
  checkOut: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/check-out`, payload)).data,
  scanAsset: async (id, code) => (await axiosInstance.post(`/work-orders/${id}/scan-asset`, { code })).data,
  start: async (id) => (await axiosInstance.post(`/work-orders/${id}/start`)).data,
  uploadPhotos: async (id, form) => (await axiosInstance.post(`/work-orders/${id}/photos`, form)).data,
  requestParts: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/part-requests`, payload)).data,
  issuePartsDirect: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/parts`, payload)).data,
  recordUsage: async (id, payload) => (await axiosInstance.post(`/work-orders/${id}/parts/usage`, payload)).data,
  issuePartRequest: async (requestId, payload) => (await axiosInstance.post(`/part-requests/${requestId}/issue`, payload)).data,
};
