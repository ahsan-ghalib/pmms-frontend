import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const billingApi = {
  invoices: async (params = {}) => unwrapData((await axiosInstance.get("/invoices", { params })).data),
  invoice: async (id) => unwrapData((await axiosInstance.get(`/invoices/${id}`)).data),
  createInvoice: async (payload) => unwrapData((await axiosInstance.post("/invoices", payload)).data),
  updateInvoice: async (id, payload) => unwrapData((await axiosInstance.put(`/invoices/${id}`, payload)).data),
  issueInvoice: async (id) => unwrapData((await axiosInstance.post(`/invoices/${id}/issue`)).data),
  correctInvoice: async (id, payload) => unwrapData((await axiosInstance.post(`/invoices/${id}/corrections`, payload)).data),
  cancelInvoice: async (id, reason) => unwrapData((await axiosInstance.post(`/invoices/${id}/cancel`, { reason })).data),
  recordPayment: async (id, payload) => unwrapData((await axiosInstance.post(`/invoices/${id}/payments`, payload)).data),
  companyBilling: async (companyId) => unwrapData((await axiosInstance.get(`/companies/${companyId}/billing`)).data),
  downloadPdf: async (invoice) => {
    const response = await axiosInstance.get(`/invoices/${invoice.id}/pdf`, { responseType: "blob" });
    const fileName = response.headers["content-disposition"]?.match(/filename="([^"]+)"/)?.[1]
      || `${invoice.invoice_number || "invoice-draft"}.pdf`;
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
