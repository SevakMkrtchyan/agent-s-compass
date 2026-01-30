import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { usePortalMessages } from "@/hooks/usePortalMessages";
import type { PortalBuyer } from "@/pages/BuyerPortal";

interface PortalChatProps {
  buyer: PortalBuyer;
}

export function PortalChat({ buyer }: PortalChatProps) {
  const {
    messages,
    isLoading: isLoadingHistory,
    addMessage,
    updateLastAssistantMessage,
    finalizeLastAssistantMessage,
    setMessages,
  } = usePortalMessages(buyer.id);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add welcome message if no history
  useEffect(() => {
    if (!isLoadingHistory && messages.length === 0) {
      const welcomeContent = `Hey ${buyer.name.split(" ")[0]}! 👋

I'm here to help you through your home buying journey. Ask me anything about:

• Where you are in the process
• Properties you're looking at
• Your offers and their status
• General home buying tips

What's on your mind?`;
      
      setMessages([{
        id: "welcome",
        buyer_id: buyer.id,
        role: "assistant",
        content: welcomeContent,
        created_at: new Date().toISOString(),
      }]);
    }
  }, [isLoadingHistory, messages.length, buyer.name, buyer.id, setMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus textarea on load
  useEffect(() => {
    textareaRef.current?.focus();
  }, [isLoadingHistory]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    // Add user message
    await addMessage("user", trimmedInput);
    setInput("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    setIsStreaming(true);

    // Create placeholder for assistant response
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempAssistantId,
      buyer_id: buyer.id,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    }]);

    let accumulatedContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buyer-portal-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: trimmedInput,
            buyerId: buyer.id,
            buyerContext: {
              name: buyer.name,
              currentStage: buyer.current_stage,
              budgetMin: buyer.budget_min,
              budgetMax: buyer.budget_max,
              preApprovalStatus: buyer.pre_approval_status,
              preApprovalAmount: buyer.pre_approval_amount,
              preferredCities: buyer.preferred_cities,
              propertyTypes: buyer.property_types,
              minBeds: buyer.min_beds,
              minBaths: buyer.min_baths,
              mustHaves: buyer.must_haves,
              niceToHaves: buyer.nice_to_haves,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                accumulatedContent += parsed.delta.text;
                updateLastAssistantMessage(accumulatedContent);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Save the complete assistant message to DB
      if (accumulatedContent) {
        await finalizeLastAssistantMessage(accumulatedContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      updateLastAssistantMessage(
        "Sorry, I'm having trouble connecting right now. Please try again in a moment."
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl border border-border p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message AgentGPT..."
              className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground min-h-[44px] max-h-[200px]"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-9 w-9 rounded-xl flex-shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            I can answer questions but can't take actions. Contact your agent for changes.
          </p>
        </div>
      </div>
    </div>
  );
}
