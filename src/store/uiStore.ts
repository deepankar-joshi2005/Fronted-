import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "system",
      sidebarCollapsed: false,
      mobileSidebarOpen: false,

      setTheme(theme) {
        set({ theme });
        applyTheme(theme);
      },

      toggleSidebarCollapsed() {
        set({ sidebarCollapsed: !get().sidebarCollapsed });
      },

      setMobileSidebarOpen(open) {
        set({ mobileSidebarOpen: open });
      },
    }),
    {
      name: "praxis-ui-store",
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

applyTheme(useUiStore.getState().theme);
