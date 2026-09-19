import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LogoutButtonProps {
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  isCollapsed?: boolean;
}

export function LogoutButton({ 
  variant = "ghost", 
  size = "default", 
  className = "",
  isCollapsed = false 
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear auth state
      logout();
      
      // Show success message
      toast.success("Logged out successfully");

      // Hard redirect to CA-Management's own root login page — not HRMS's
      // internal /hrms-app/login, since login is unified across both apps.
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
          disabled={isLoggingOut}
        >
          <LogOut className={isCollapsed ? "h-4 w-4" : "mr-3 h-4 w-4"} />
          {!isCollapsed && (
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          )}
          {isCollapsed && <span className="sr-only">Logout</span>}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out? You will need to log in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
