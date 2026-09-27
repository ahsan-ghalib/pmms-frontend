import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

function asFormData(payload = {}) {
  const data = new FormData();

  const append = (key, value) => {
    if (value === undefined || value === null) return;
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
    if (Array.isArray(value)) {
      value.forEach((item, index) => append(`${key}[${index}]`, item));
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([child, childValue]) => append(`${key}[${child}]`, childValue));
      return;
    }
    if (value === "") return;
    data.append(key, value);
  };

  Object.entries(payload).forEach(([key, value]) => append(key, value));
  return data;
}

function hasUpload(payload) {
  const logo = payload?.logo;
  return logo instanceof File || (logo instanceof FileList && logo.length > 0);
}

export const companiesApi = {
  list: async (params = {}) => unwrapData((await axiosInstance.get("/companies", { params })).data),
  show: async (id) => unwrapData((await axiosInstance.get(`/companies/${id}`)).data),
  create: async (payload) => unwrapData((await axiosInstance.post("/companies", asFormData(payload))).data),
  update: async (id, payload) => {
    if (hasUpload(payload)) {
      return unwrapData((await axiosInstance.post(`/companies/${id}`, asFormData(payload))).data);
    }
    const { logo, ...json } = payload || {};
    return unwrapData((await axiosInstance.put(`/companies/${id}`, json)).data);
  },
  archive: async (id) => (await axiosInstance.delete(`/companies/${id}`)).data,
  restore: async (id) => (await axiosInstance.post(`/companies/${id}/restore`)).data,
  logoUrl: (id, version) => `${process.env.NEXT_PUBLIC_API_URL}/companies/${id}/logo${version ? `?v=${version}` : ""}`,
};
