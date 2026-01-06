import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Message, Stage } from "@/types";

interface AIChatPanelProps {
  stage: Stage;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function AIChatPanel({ stage, messages, onSendMessage, isLoading }: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const educationalDisclaimer = (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20 text-sm mb-4">
      <AlertCircle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
      <p className="text-muted-foreground">
        AI responses are educational only and do not constitute advice. 
        Consult your agent for personalized guidance.
      </p>
    </div>
  );

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-premium">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">HomeGuide AI</h3>
          <p className="text-xs text-muted-foreground">Educational Assistant</p>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-1 text-xs text-accent">
            <Sparkles className="h-3 w-3" />
            Stage {stage}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {educationalDisclaimer}
        
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Ask me anything about your home buying journey!
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              I'm here to help you understand the process.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.role === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                message.role === "assistant" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {message.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-2 max-w-[80%]",
                message.role === "assistant"
                  ? "bg-secondary text-secondary-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.isEducational && message.role === "assistant" && (
                <span className="text-xs opacity-70 mt-1 block">
                  Educational content only
                </span>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your home buying journey..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
