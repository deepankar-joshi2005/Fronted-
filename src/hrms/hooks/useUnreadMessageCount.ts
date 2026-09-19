import { useState, useEffect } from "react";
import { getConversations } from "@/api/messageService";
import { useSocket } from "@/contexts/SocketContext";

export const useUnreadMessageCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Safely get socket context - return 0 if not available
  let socket = null;
  try {
    const socketContext = useSocket();
    socket = socketContext.socket;
  } catch (error) {
    // Socket context not available, continue without socket
    console.warn("Socket context not available for unread message count");
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await getConversations();
      const total = response.conversations.reduce(
        (sum, conv) => sum + conv.unreadCount,
        0
      );
      setUnreadCount(total);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Update count when new message arrives or conversation updates
    const handleUpdate = () => {
      fetchUnreadCount();
    };

    socket.on("message:notification", handleUpdate);
    socket.on("conversation:updated", handleUpdate);

    return () => {
      socket.off("message:notification", handleUpdate);
      socket.off("conversation:updated", handleUpdate);
    };
  }, [socket]);

  return unreadCount;
};

