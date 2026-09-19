import axiosInstance from "@/api/axiosInstance";
import { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  email: string;
  role: string;
  name: string;
  companyId?: string;
  subscriptionPlan?: string;
  trialEndDate?: string | null;
  subscriptionEndDate?: string | null;
  leadMentorId?: string;
  permissions?: string[];
  profilePicture?: string | null;
  isSystemAdmin?: boolean;
  companyLogo?: string | null;
  companyStamp?: string | null;
} | null;

export interface AuthContextType {
  user: User;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);

        if (parsedUser && (parsedUser.isSystemAdmin === undefined || !parsedUser.companyId)) {
          axiosInstance.get("/auth/me")
            .then((response) => {
              const updatedUser = response.data.user;
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            })
            .catch((error) => {
              console.error("Error fetching user info:", error);
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    // Deliberately NOT calling setUser(null) here. Every caller of logout()
    // immediately hard-redirects to CA-Management's /login right after this
    // returns — if we update React state first, HRMS's own router re-renders
    // for a moment (showing its own logged-out/login screen) before the
    // browser actually processes the navigation, causing a visible flash.
    // Skipping the state update means HRMS's UI never re-renders at all; the
    // whole page just unloads straight into CA-Management.
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Also end CA-Management's own session. Its refresh token lives in an
    // httpOnly cookie, invisible to this code — without this call it stays
    // valid, so the next load of /login silently re-authenticates via
    // /auth/refresh and the Business Client auto-redirect bounces straight
    // back into HRMS, making "logout" look like it does nothing.
    fetch("/api/v1/auth/logout", { method: "POST", credentials: "include", keepalive: true }).catch(() => {});
  };

  const refreshUser = async () => {
    try {
      const res = await axiosInstance.get("/auth/me");
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Refresh User Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
