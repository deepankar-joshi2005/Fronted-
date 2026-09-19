import axiosInstance from "./axiosInstance";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  school?: {
    _id: string;
    name: string;
    city: string;
    state: string;
    schoolCount: number;
  };
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  receiver: User;
  content: string;
  isRead: boolean;
  readAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participant: User;
  lastMessage?: {
    _id: string;
    content: string;
    sender: string;
    createdAt: string;
    isRead: boolean;
  };
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface SendMessagePayload {
  receiverId: string;
  content: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface AvailableUsersResponse {
  success: boolean;
  users: User[];
}

export interface ConversationResponse {
  success: boolean;
  conversation: any;
}

export interface MessageResponse {
  success: boolean;
  message: Message;
}

export interface DeleteMessageResponse {
  success: boolean;
  message: string;
}

// Get all conversations for the logged-in user
export const getConversations = async (): Promise<ConversationsResponse> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.get("/messages/conversations", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get messages for a specific conversation
export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<MessagesResponse> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.get(
    `/messages/conversations/${conversationId}/messages`,
    {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Send a message
export const sendMessage = async (
  payload: SendMessagePayload
): Promise<MessageResponse> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.post("/messages/send", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get list of users that the current user can message
export const getAvailableUsers = async (): Promise<AvailableUsersResponse> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.get("/messages/available-users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Delete a message
export const deleteMessage = async (
  messageId: string
): Promise<DeleteMessageResponse> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.delete(`/messages/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get or create a conversation with a specific user
export const getOrCreateConversation = async (
  otherUserId: string
): Promise<ConversationResponse> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.get(
    `/messages/conversations/with/${otherUserId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Mark conversation as read
export const markConversationAsRead = async (
  conversationId: string
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token");
  const response = await axiosInstance.patch(
    `/messages/conversations/${conversationId}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

