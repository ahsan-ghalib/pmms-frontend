import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";

export const techniciansApi = {
  duty: async () => unwrapData((await axiosInstance.get("/technician/duty")).data),
  dutyOn: async (payload) => unwrapData((await axiosInstance.post("/technician/duty/on", payload)).data),
  dutyOff: async (payload = {}) => unwrapData((await axiosInstance.post("/technician/duty/off", payload)).data),
  acceptPrivacy: async () => unwrapData((await axiosInstance.post("/technician/duty/privacy")).data),
  jobs: async (params = {}) => unwrapData((await axiosInstance.get("/technician/jobs", { params })).data),
  pingLocation: async (payload) => unwrapData((await axiosInstance.post("/technician/location", payload)).data),
  live: async () => unwrapData((await axiosInstance.get("/technicians/live")).data),
  history: async (userId, params = {}) => unwrapData((await axiosInstance.get(`/technicians/${userId}/locations`, { params })).data),
  partsCatalog: async (params = {}) => unwrapData((await axiosInstance.get("/parts", { params })).data),
};
