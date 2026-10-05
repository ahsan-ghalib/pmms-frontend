import axiosInstance from "@/lib/axios";
import { unwrapData } from "@/lib/pmms";
export const geoApi = {
  countries: async () => unwrapData((await axiosInstance.get("/geo/countries")).data),
  states: async (countryId) => unwrapData((await axiosInstance.get("/geo/states", { params: { country_id: countryId } })).data),
  cities: async (stateId) => unwrapData((await axiosInstance.get("/geo/cities", { params: { state_id: stateId } })).data),
};
