import axios from "axios";
import { LOCALE_COOKIE_KEY } from "@/lib/locale-utils";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      let token = null;

      if (typeof window !== "undefined") {
        const impersonateToken = localStorage.getItem("soouqlive_impersonate_token");
        if (impersonateToken) {
          token = impersonateToken;
        } else {
          const { getSession } = await import("next-auth/react");
          const session = await getSession();
          token = session?.accessToken || null;
        }
        
        // Add language headers
        const match = document.cookie.match(new RegExp('(^| )' + LOCALE_COOKIE_KEY + '=([^;]+)'));
        if (match && match[2]) {
          config.headers['lang'] = match[2];
          config.headers['Accept-Language'] = match[2];
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error attaching token:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const shouldSkipAuthRedirect = (error) => {
  const url = error?.config?.url || "";
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/reset-password") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/pages/public")
  );
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !shouldSkipAuthRedirect(error)) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("persist:auth");
        localStorage.removeItem("authUser");
        localStorage.removeItem("soouqlive_permissions");
         localStorage.removeItem("soouqlive_impersonate_token");

        window.location.href = "/login";
      }
    }

    // if (error.response?.status === 403) {
    //   if (typeof window !== "undefined") {
    //     window.location.href = "/unauthorized";
    //   }
    // }

    // if (error.response?.status >= 500) {
    //   console.error("Server error:", error.response?.data);
    //    console.log(error.response?.data);
    // }

    return Promise.reject(error);
  }
);

export default axiosInstance;
