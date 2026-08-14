import axiosInstance from "@/lib/axios";

export const pagesApi = {
  // Get list of active pages (public)
  getActivePages: async () => {
    const response = await axiosInstance.get("/pages/public/list");
    return response.data;
  },

  // Get page by slug (public)
  getPageBySlug: async (slug) => {
    const response = await axiosInstance.get(`/pages/public/${slug}`);
    return response.data;
  },
};

