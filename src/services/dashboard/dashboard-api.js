import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const dashboardApi = {
  overview: async (params = {}) => unwrapData((await axiosInstance.get("/dashboard", { params })).data),
};
