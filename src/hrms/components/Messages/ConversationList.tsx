import React from "react";
import type { Conversation } from "@/api/messageService";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading = false,
}) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "leadmentor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "schooladmin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "mentor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "student":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "leadmentor":
        return "Lead Mentor";
      case "schooladmin":
        return "School Admin";
      case "mentor":
        return "School Mentor";
      case "student":
        return "Student";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">
          Loading conversations...
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-2">
          Start a new conversation by selecting a user
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-1.5">
        {conversations.map(
          (conversation) =>
            conversation.participant && (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors border touch-manipulation",
                  "min-h-[60px] flex items-center", // Better touch targets
                  selectedConversationId === conversation._id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-accent border-transparent active:bg-accent/80"
                )}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {conversation.participant.name}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          getRoleColor(conversation.participant.role)
                        )}
                      >
                        {getRoleLabel(conversation.participant.role)}
                      </Badge>
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="bg-primary text-primary-foreground text-xs px-2"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
        )}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
