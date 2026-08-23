import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const checklistsApi = {
  templates: async (params = {}) => unwrapData((await axiosInstance.get("/checklist-templates", { params })).data),
  showTemplate: async (id) => unwrapData((await axiosInstance.get(`/checklist-templates/${id}`)).data),
  saveTemplate: async (payload, id) => unwrapData(
    id
      ? (await axiosInstance.put(`/checklist-templates/${id}`, payload)).data
      : (await axiosInstance.post("/checklist-templates", payload)).data
  ),
  saveItem: async (templateId, payload) => unwrapData((await axiosInstance.post(`/checklist-templates/${templateId}/items`, payload)).data),
  updateItem: async (id, payload) => unwrapData((await axiosInstance.put(`/checklist-items/${id}`, payload)).data),
  setItemStatus: async (id, status) => unwrapData((await axiosInstance.patch(`/checklist-items/${id}/status`, { status })).data),
  executions: async (params = {}) => unwrapData((await axiosInstance.get("/checklists", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/checklists/${id}`)).data),
  start: async (payload) => unwrapData((await axiosInstance.post("/checklists", payload)).data),
  recordResult: async (id, form) => unwrapData((await axiosInstance.post(`/checklists/${id}/results`, form, { headers: { "Content-Type": undefined } })).data),
  complete: async (id) => unwrapData((await axiosInstance.post(`/checklists/${id}/complete`)).data),
  corrective: async (resultId, payload) => unwrapData((await axiosInstance.post(`/checklist-results/${resultId}/corrective-work-order`, payload)).data),
  exportPdf: async (id) => {
    const response = await axiosInstance.get(`/checklists/${id}/pdf`, { responseType: "blob" });
    const fileName = response.headers["content-disposition"]?.match(/filename="([^"]+)"/)?.[1] || `checklist-${id}.pdf`;
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
