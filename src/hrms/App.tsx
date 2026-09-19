import AppRouter from "@/router/AppRouter";
import { Toaster } from "@/components/ui/sonner";
import { UploadProvider } from "@/contexts/UploadContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import UploadToast from "@/components/UploadToast";

function App() {
  return (
    <>
      <NotificationProvider>
        <UploadProvider>
          <AppRouter />
          <UploadToast />
        </UploadProvider>
      </NotificationProvider>
      <Toaster />
    </>
  );
}

export default App;
