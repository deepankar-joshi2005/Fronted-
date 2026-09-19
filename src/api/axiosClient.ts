import axios from "axios";

// In-memory only — never persisted, so a refresh always goes through the
// httpOnly refresh-token cookie instead of trusting stale localStorage.
let accessToken = null;
let authFailureHandler = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Registered by authStore to clear session state when a refresh fails.
export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

const axiosClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthRoute =
      config?.url?.startsWith("/auth/login") ||
      config?.url?.startsWith("/auth/register-firm") ||
      config?.url?.startsWith("/auth/refresh");

    if (response?.status === 401 && !config._retry && !isAuthRoute) {
      config._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axiosClient.post("/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axiosClient(config);
      } catch (refreshError) {
        setAccessToken(null);
        if (authFailureHandler) authFailureHandler();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
