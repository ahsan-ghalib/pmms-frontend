import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const DOCUMENT_TYPE_LABELS = {
  warranty: "Warranty Documents",
  user_manual: "User Manuals",
  purchase_invoice: "Purchase Invoices",
  service_report: "Service Reports",
  installation: "Installation Documents",
  photo: "Photo",
};

export const assetsApi = {
  options: async () => unwrapData((await axiosInstance.get("/asset-options")).data),
  list: async (params = {}) => unwrapData((await axiosInstance.get("/assets", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/assets/${id}`)).data),
  resolve: async (code) => unwrapData((await axiosInstance.get("/assets/resolve", { params: { code } })).data),
  create: async (payload) => unwrapData((await axiosInstance.post("/assets", payload)).data),
  update: async (id, payload) => unwrapData((await axiosInstance.put(`/assets/${id}`, payload)).data),
  updateStatus: async (id, payload) => unwrapData((await axiosInstance.patch(`/assets/${id}/status`, payload)).data),
  transfer: async (id, payload) => unwrapData((await axiosInstance.post(`/assets/${id}/transfers`, payload)).data),
  uploadDocument: async (id, file, type) => {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    return unwrapData((await axiosInstance.post(`/assets/${id}/documents`, form)).data);
  },
  uploadPhoto: async (id, file) => {
    const form = new FormData();
    form.append("photo", file);
    return unwrapData((await axiosInstance.post(`/assets/${id}/photo`, form)).data);
  },
  blob: async (path) => {
    const response = await axiosInstance.get(path, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
  downloadDocument: async (assetId, fileId, filename) => {
    const response = await axiosInstance.get(`/assets/${assetId}/documents/${fileId}`, { responseType: "blob" });
    triggerDownload(response.data, filename || "document");
  },
  downloadLabel: async (id, filename) => {
    const response = await axiosInstance.get(`/assets/${id}/label.pdf`, { responseType: "blob" });
    triggerDownload(response.data, filename || "asset-label.pdf");
  },
  openLabel: async (id) => {
    const html = (await axiosInstance.get(`/assets/${id}/label`, { responseType: "text" })).data;
    const popup = window.open("", "_blank", "width=480,height=360");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
  },
  categories: async (params = {}) => unwrapData((await axiosInstance.get("/asset-categories", { params })).data),
  createCategory: async (payload) => unwrapData((await axiosInstance.post("/asset-categories", payload)).data),
  updateCategory: async (id, payload) => unwrapData((await axiosInstance.put(`/asset-categories/${id}`, payload)).data),
  createSubcategory: async (categoryId, payload) => unwrapData((await axiosInstance.post(`/asset-categories/${categoryId}/subcategories`, payload)).data),
  updateSubcategory: async (id, payload) => unwrapData((await axiosInstance.put(`/asset-subcategories/${id}`, payload)).data),
};
