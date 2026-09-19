import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAuthStore } from "./store/authStore.js";
import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
