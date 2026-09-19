import { create } from "zustand";
import * as authApi from "../api/auth.api.js";
import { setAccessToken, setAuthFailureHandler } from "../api/axiosClient.js";

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  // Called once on app boot: exchanges the httpOnly refresh cookie (if any)
  // for a fresh access token, so a page reload doesn't force a re-login.
  async initialize() {
    try {
      const { data } = await authApi.refresh();
      setAccessToken(data.data.accessToken);
      set({ user: data.data.user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },

  async login(email, password) {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    set({ user: data.data.user, isAuthenticated: true });
    return data.data.user;
  },

  async registerFirm(payload) {
    const { data } = await authApi.registerFirm(payload);
    setAccessToken(data.data.accessToken);
    set({ user: data.data.user, isAuthenticated: true });
    return data.data.user;
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  setUser(user) {
    set({ user });
  },
}));

setAuthFailureHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
