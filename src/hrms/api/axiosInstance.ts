/** @format */

import axios from "axios";
import qs from "qs";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

const axiosInstance = axios.create({
  baseURL: API_URL,

  // 🔥 YAHI MAIN FIX HAI
  paramsSerializer: (params) =>
    qs.stringify(params, {
      arrayFormat: "repeat", // phase=a&phase=b
      skipNulls: true,
    }),
});

console.log("API_URL:", API_URL);

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.reload();
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.isAccountDeactivated
    ) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      alert(
        "Your account has been deactivated. Please contact your administrator."
      );
      window.location.reload();
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.isSubscriptionExpired
    ) {
      // 🚨 Robust Signal: Tell the frontend that we've expired
      window.dispatchEvent(new Event("subscription_expired"));
      
      // Update localStorage so reload is consistent
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        user.subscriptionPlan = "EXPIRED";
        localStorage.setItem("user", JSON.stringify(user));
      }

      console.warn("Subscription expired, signaling UI to block access:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
