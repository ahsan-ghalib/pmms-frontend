import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const dashboardApi = {
  overview: async () => unwrapData((await axiosInstance.get("/dashboard")).data),
};
