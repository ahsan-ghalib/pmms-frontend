import axiosInstance from "@/lib/axios";

const BASE_URL = "/table-bookings";

export const tableBookingsApi = {
  getBookings: async (params) => {
    const { data } = await axiosInstance.get(BASE_URL, { params });
    return data;
  },

  getBooking: async (id) => {
    const { data } = await axiosInstance.get(`${BASE_URL}/${id}`);
    return data;
  },

  updateBookingStatus: async (id, status) => {
    const { data } = await axiosInstance.put(`${BASE_URL}/${id}`, { status });
    return data;
  },

  cancelBooking: async (id) => {
    const { data } = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return data;
  },
};
