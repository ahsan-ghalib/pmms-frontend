import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const inventoryApi = {
  options: async () => unwrapData((await axiosInstance.get("/inventory-options")).data),
  parts: async (params = {}) => unwrapData((await axiosInstance.get("/inventory/parts", { params })).data),
  showPart: async (id) => unwrapData((await axiosInstance.get(`/inventory/parts/${id}`)).data),
  createPart: async (payload) => unwrapData((await axiosInstance.post("/inventory/parts", payload)).data),
  updatePart: async (id, payload) => unwrapData((await axiosInstance.put(`/inventory/parts/${id}`, payload)).data),
  uploadPhoto: async (id, file) => {
    const form = new FormData();
    form.append("photo", file);
    return unwrapData((await axiosInstance.post(`/inventory/parts/${id}/photo`, form)).data);
  },
  blob: async (path) => {
    const response = await axiosInstance.get(path, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
  categories: async (params = {}) => unwrapData((await axiosInstance.get("/part-categories", { params })).data),
  createCategory: async (payload) => unwrapData((await axiosInstance.post("/part-categories", payload)).data),
  updateCategory: async (id, payload) => unwrapData((await axiosInstance.put(`/part-categories/${id}`, payload)).data),
  locations: async (params = {}) => unwrapData((await axiosInstance.get("/stock-locations", { params })).data),
  createLocation: async (payload) => unwrapData((await axiosInstance.post("/stock-locations", payload)).data),
  logs: async (params = {}) => unwrapData((await axiosInstance.get("/stock/logs", { params })).data),
  transact: async (payload) => unwrapData((await axiosInstance.post("/stock/transactions", payload)).data),
  lowStock: async () => unwrapData((await axiosInstance.get("/stock/low")).data),
  trace: async (params = {}) => unwrapData((await axiosInstance.get("/stock/trace", { params })).data),
  purchaseRequests: async (params = {}) => unwrapData((await axiosInstance.get("/purchase-requests", { params })).data),
  showPurchaseRequest: async (id) => unwrapData((await axiosInstance.get(`/purchase-requests/${id}`)).data),
  createPurchaseRequest: async (payload) => unwrapData((await axiosInstance.post("/purchase-requests", payload)).data),
  updatePurchaseRequest: async (id, payload) => unwrapData((await axiosInstance.put(`/purchase-requests/${id}`, payload)).data),
  transitionPurchaseRequest: async (id, status) => unwrapData((await axiosInstance.patch(`/purchase-requests/${id}/status`, { status })).data),
  openPdf: async (id) => {
    const html = (await axiosInstance.get(`/purchase-requests/${id}/pdf`, { responseType: "text" })).data;
    const popup = window.open("", "_blank", "width=860,height=720");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
  },
};
