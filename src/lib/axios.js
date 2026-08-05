import axios from "axios";
import { useAuthStore, getCookie } from "../store/auth.store";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return "/api";
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    const cleanUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
  }

  return "/api";
};

const baseURL = getBaseURL();

const axiosInstance = axios.create({ baseURL });

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || (typeof document !== "undefined" && getCookie("bip_token"));
  if (token) {
    if (config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/signup")) {
        useAuthStore.getState().clearUser();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
