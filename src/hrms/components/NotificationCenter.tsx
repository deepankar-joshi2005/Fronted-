import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  X, 
  AlertCircle, 
  Info, 
  Calendar,
  BookOpen
} from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "assessment" | "announcement" | "reminder" | "system";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  isRead: boolean;
  relatedAssessment?: {
    _id: string;
    title: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call when notification endpoints are ready
      // const response = await notificationService.getNotifications();
      // setNotifications(response.data || []);
      
      // Mock data for now
      setNotifications([
        {
          _id: "1",
          title: "New Assessment Available",
          message: "Mathematics Assessment for Grade 8 is now available. Please complete it before the deadline.",
          type: "assessment",
          priority: "high",
          createdAt: new Date().toISOString(),
          isRead: false,
          relatedAssessment: {
            _id: "assessment1",
            title: "Mathematics Assessment - Grade 8"
          }
        },
        {
          _id: "2",
          title: "Assessment Reminder",
          message: "Science Assessment deadline is approaching. You have 2 days left to complete it.",
          type: "reminder",
          priority: "medium",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          isRead: false,
          relatedAssessment: {
            _id: "assessment2",
            title: "Science Assessment - Grade 8"
          }
        }
      ]);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Implement actual API call
      // await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implement actual API call
      // await notificationService.markAllAsRead();
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === "urgent" ? "text-red-600" : 
                     priority === "high" ? "text-orange-600" : 
                     priority === "medium" ? "text-blue-600" : "text-gray-600";

    switch (type) {
      case "assessment":
        return <BookOpen className={`h-4 w-4 ${iconClass}`} />;
      case "reminder":
        return <Calendar className={`h-4 w-4 ${iconClass}`} />;
      case "system":
        return <Info className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <AlertCircle className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    } as const;

    return (
      <Badge variant={variants[priority as keyof typeof variants] || "outline"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      <div className="bg-black/50 fixed inset-0" onClick={onClose} />
      <Card className="w-96 max-h-[80vh] relative z-10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    }`}
                    onClick={() => markAsRead(notification._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {getPriorityBadge(notification.priority)}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.relatedAssessment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Navigate to assessment
                                console.log("Navigate to assessment:", notification.relatedAssessment?._id);
                              }}
                            >
                              View Assessment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
