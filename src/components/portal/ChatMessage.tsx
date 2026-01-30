import { format } from "date-fns";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: Date | string;
  buyerName?: string;
}

export function ChatMessage({ role, content, timestamp, buyerName }: ChatMessageProps) {
  const isAssistant = role === "assistant";
  const displayTime = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const initials = buyerName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        {isAssistant ? (
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {isAssistant ? "AgentGPT Assistant" : buyerName || "You"}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(displayTime, "h:mm a")}
          </span>
        </div>

        {/* Message Card */}
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm max-w-[90%]",
            isAssistant
              ? "bg-card border border-border"
              : "bg-muted"
          )}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
              <ReactMarkdown>{content || "..."}</ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-foreground">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
