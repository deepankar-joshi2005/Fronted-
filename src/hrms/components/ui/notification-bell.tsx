import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notificationService } from "@/api/notificationService";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadUnreadCount();
  }, [user]);

  const loadUnreadCount = async () => {
    // Only call notification counts API for authorized roles
    const authorizedRoles = ['superadmin', 'leadmentor', 'mentor', 'employee'];
    if (!user || !authorizedRoles.includes(user.role)) return;
    
    try {
      setLoading(true);
      const response = await notificationService.getNotificationCounts();
      setUnreadCount(response.unreadNotifications || 0);
    } catch (error) {
      console.error("Error loading unread count:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </div>
  );
}
