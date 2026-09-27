import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

function asFormData(payload = {}) {
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (value instanceof FileList) {
      if (value[0]) data.append(key, value[0]);
      return;
    }
    if (value instanceof File) {
      data.append(key, value);
      return;
    }
    if (typeof value === "boolean") {
      data.append(key, value ? "1" : "0");
      return;
    }
    data.append(key, value);
  });
  return data;
}

export const tenantsApi = {
  options: async () => unwrapData((await axiosInstance.get("/tenants/options")).data),
  list: async (params = {}) => unwrapData((await axiosInstance.get("/tenants", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/tenants/${id}`)).data),
  create: async (payload) => unwrapData((await axiosInstance.post("/tenants", asFormData(payload))).data),
  update: async (id, payload) => unwrapData((await axiosInstance.post(`/tenants/${id}`, asFormData(payload))).data),
  deactivate: async (id, payload) => unwrapData((await axiosInstance.post(`/tenants/${id}/deactivate`, payload)).data),
  reactivate: async (id, payload = {}) => unwrapData((await axiosInstance.post(`/tenants/${id}/reactivate`, payload)).data),
  renew: async (id, payload) => unwrapData((await axiosInstance.post(`/tenants/${id}/renew`, asFormData(payload))).data),
  contractUrl: (id) => `${process.env.NEXT_PUBLIC_API_URL}/tenants/${id}/contract`,
  photoUrl: (id) => `${process.env.NEXT_PUBLIC_API_URL}/tenants/${id}/photo`,
};
