import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { crmNotificationService } from "@/api/crmNotificationService";

export const useCRMNotifications = () => {
	const { user } = useAuth();
	const { socket } = useSocket();
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);

	const fetchUnreadCount = useCallback(async () => {
		if (!user || (user.role !== "superadmin" && user.role !== "sales-manager" && user.role !== "sales-executive")) {
			setLoading(false);
			return;
		}

		try {
			const response = await crmNotificationService.getUnreadCount();
			if (response.success) {
				setUnreadCount(response.count);
			}
		} catch (error) {
			console.error("Error fetching unread count:", error);
		} finally {
			setLoading(false);
		}
	}, [user]);

	// Function to decrease count optimistically
	const decreaseCount = useCallback((amount: number = 1) => {
		setUnreadCount((prev) => Math.max(0, prev - amount));
	}, []);

	// Function to set count to 0 (when all marked as read)
	const resetCount = useCallback(() => {
		setUnreadCount(0);
	}, []);

	useEffect(() => {
		fetchUnreadCount();

		// Set up socket listeners for real-time updates
		if (socket) {
			const handleNewNotification = () => {
				// Increment unread count when new notification arrives
				setUnreadCount((prev) => prev + 1);
			};

			const handleNotificationRead = (data: any) => {
				// Decrease count when notification is marked as read
				if (data.userId === user?.id) {
					setUnreadCount((prev) => Math.max(0, prev - 1));
				}
			};

			const handleAllRead = (data: any) => {
				// Reset count when all notifications are marked as read
				if (data.userId === user?.id) {
					setUnreadCount(0);
				}
			};

			socket.on("crm:notification", handleNewNotification);
			socket.on("crm:notification:read", handleNotificationRead);
			socket.on("crm:notification:all-read", handleAllRead);

			return () => {
				socket.off("crm:notification", handleNewNotification);
				socket.off("crm:notification:read", handleNotificationRead);
				socket.off("crm:notification:all-read", handleAllRead);
			};
		}
	}, [socket, fetchUnreadCount, user?.id]);

	return { unreadCount, loading, refresh: fetchUnreadCount, decreaseCount, resetCount };
};

