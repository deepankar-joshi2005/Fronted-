import React, { useEffect, useRef } from "react";
import type { Message } from "@/api/messageService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isLoading = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt);
      const dateKey = date.toLocaleDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-2">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="p-3 space-y-3">
        {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            <div className="flex items-center justify-center mb-3">
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                {dateKey}
              </span>
            </div>
            <div className="space-y-2">
              {dateMessages.map((message) => {
                const isCurrentUser = message.sender._id === currentUserId;

                return (
                  <div
                    key={message._id}
                    className={cn(
                      "flex",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent"
                      )}
                    >
                      {/* {!isCurrentUser && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender.name}
                        </p>
                      )} */}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div
                        className={cn(
                          "flex items-center justify-end gap-1 mt-1",
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        <span className="text-xs">
                          {formatTime(message.createdAt)}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs">
                            {message.isRead ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;

