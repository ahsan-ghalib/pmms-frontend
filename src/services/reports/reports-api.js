import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const reportsApi = {
  catalogue: async () => unwrapData((await axiosInstance.get("/reports")).data),
  show: async (type, params = {}) => unwrapData((await axiosInstance.get(`/reports/${type}`, { params })).data),
  export: async (type, format, params = {}) => {
    const response = await axiosInstance.get(`/reports/${type}/export`, {
      params: { ...params, format },
      responseType: "blob",
    });
    const fileName = response.headers["content-disposition"]?.match(/filename="([^"]+)"/)?.[1]
      || `${type}.${format}`;
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
