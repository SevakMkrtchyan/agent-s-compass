import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date | string;
  buyerName?: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-muted text-foreground">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[85%]">
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5 prose-headings:my-3 prose-headings:font-semibold">
          <ReactMarkdown>{content || "..."}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
