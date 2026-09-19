import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export interface Branch {
  _id: string;
  name: string;
}

interface BranchFilterContextType {
  branches: Branch[];
  selectedBranchId: string | "all";
  setSelectedBranchId: (id: string | "all") => void;
}

const BranchFilterContext = createContext<BranchFilterContextType | undefined>(undefined);

export function BranchFilterProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | "all">("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${API_BASE}/branches`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBranches(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBranches([]));
  }, []);

  return (
    <BranchFilterContext.Provider value={{ branches, selectedBranchId, setSelectedBranchId }}>
      {children}
    </BranchFilterContext.Provider>
  );
}

export function useBranchFilter() {
  const ctx = useContext(BranchFilterContext);
  if (!ctx) {
    return {
      branches: [] as Branch[],
      selectedBranchId: "all" as const,
      setSelectedBranchId: () => {},
    };
  }
  return ctx;
}
