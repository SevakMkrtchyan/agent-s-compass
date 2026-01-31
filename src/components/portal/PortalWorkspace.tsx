import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, FileText, ChevronDown, ChevronUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortalMessages } from "@/hooks/usePortalMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { PortalBuyer } from "@/pages/BuyerPortal";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

interface PortalWorkspaceProps {
  buyer: PortalBuyer;
}

// Thread message component - matches agent workspace card styling
interface ThreadMessageProps {
  sender: "agent" | "ai" | "user";
  senderName?: string;
  timestamp: Date | string;
  children: React.ReactNode;
  className?: string;
}

function ThreadMessage({ sender, senderName, timestamp, children, className }: ThreadMessageProps) {
  const formattedTime = typeof timestamp === "string" 
    ? format(new Date(timestamp), "MMM d, h:mm a")
    : format(timestamp, "MMM d, h:mm a");

  const isUser = sender === "user";

  return (
    <div className={cn("group", className)}>
      {/* Header with sender info */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-medium",
          sender === "agent" ? "bg-primary" : sender === "ai" ? "bg-violet-500" : "bg-muted-foreground"
        )}>
          {sender === "agent" ? "A" : sender === "ai" ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        </div>
        <span className="text-sm font-medium text-foreground">
          {senderName || (sender === "agent" ? "Your Agent" : sender === "ai" ? "AgentGPT" : "You")}
        </span>
        <span className="text-xs text-muted-foreground">
          {formattedTime}
        </span>
      </div>

      {/* Message content - card styling matching agent workspace */}
      <div className={cn(
        "ml-9",
        isUser && "max-w-[85%]"
      )}>
        <div className={cn(
          "rounded-lg border border-border/30 bg-card p-4",
          isUser && "bg-muted/50"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Shared artifact in thread - matches agent workspace saved artifacts styling
interface ArtifactMessageProps {
  artifact: {
    id: string;
    title: string;
    content: string;
    artifact_type: string;
    shared_at: string | null;
    created_at: string;
  };
}

function ArtifactMessage({ artifact }: ArtifactMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sharedDate = artifact.shared_at || artifact.created_at;
  
  // Check if content is long
  const isLongContent = artifact.content.length > 800 || artifact.content.split('\n').length > 15;

  return (
    <div className="group">
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
          A
        </div>
        <span className="text-sm font-medium text-foreground">Your Agent</span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(sharedDate), "MMM d, h:mm a")}
        </span>
      </div>

      {/* Message intro */}
      <div className="ml-9 mb-3">
        <p className="text-sm text-foreground/80">
          📄 I've shared a document with you:
        </p>
      </div>

      {/* Artifact card - same styling as agent workspace saved artifacts */}
      <div className="ml-9">
        <div className="rounded-lg border border-border/30 bg-card overflow-hidden">
          {/* Artifact header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/20">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">{artifact.title}</h3>
            </div>
            {isLongContent && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Expand
                  </>
                )}
              </button>
            )}
          </div>

          {/* Artifact content */}
          <div 
            className={cn(
              "p-4 md:p-5",
              !isExpanded && isLongContent && "max-h-[250px] overflow-hidden relative"
            )}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5 prose-headings:my-3 prose-headings:font-medium prose-h2:text-base prose-h3:text-sm">
              <ReactMarkdown>{artifact.content}</ReactMarkdown>
            </div>
            
            {/* Fade overlay when collapsed */}
            {!isExpanded && isLongContent && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
            )}
          </div>

          {/* Show more button when collapsed */}
          {!isExpanded && isLongContent && (
            <div className="px-4 pb-3">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Show full document →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Welcome message component
function WelcomeMessage({ buyerName }: { buyerName: string }) {
  const firstName = buyerName.split(" ")[0];
  
  return (
    <ThreadMessage sender="ai" timestamp={new Date()}>
      <div className="space-y-3">
        <p className="text-foreground">
          Hi {firstName}! 👋 Welcome to your home buying workspace.
        </p>
        <p className="text-foreground/80 text-sm">
          This is where you'll see updates from your agent, important documents, 
          and guidance throughout your journey. Ask me anything about the home buying process!
        </p>
      </div>
    </ThreadMessage>
  );
}

export function PortalWorkspace({ buyer }: PortalWorkspaceProps) {
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
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch shared artifacts for this buyer
  const { data: sharedArtifacts, isLoading: artifactsLoading } = useQuery({
    queryKey: ["portal-artifacts", buyer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("buyer_id", buyer.id)
        .eq("visibility", "shared")
        .order("shared_at", { ascending: true }); // Chronological order for thread
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!buyer.id,
  });

  // Scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streamingContent, sharedArtifacts]);

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

    setInput("");
    setStreamingContent("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    // Add user message
    await addMessage("user", trimmedInput);
    
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
                setStreamingContent(accumulatedContent);
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
      updateLastAssistantMessage("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingHistory || artifactsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Build thread items chronologically
  const threadItems: Array<{
    type: "welcome" | "artifact" | "user" | "assistant";
    data: unknown;
    timestamp: Date;
  }> = [];

  // Add welcome message first (use current time as fallback)
  threadItems.push({
    type: "welcome",
    data: null,
    timestamp: new Date(Date.now() - 86400000), // Show as "yesterday" to appear first
  });

  // Merge artifacts and messages chronologically
  sharedArtifacts?.forEach(artifact => {
    threadItems.push({
      type: "artifact",
      data: artifact,
      timestamp: new Date(artifact.shared_at || artifact.created_at),
    });
  });

  messages.forEach(msg => {
    threadItems.push({
      type: msg.role as "user" | "assistant",
      data: msg,
      timestamp: new Date(msg.created_at),
    });
  });

  // Sort by timestamp
  threadItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Thread Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {threadItems.map((item, idx) => {
            if (item.type === "welcome") {
              return <WelcomeMessage key="welcome" buyerName={buyer.name} />;
            }

            if (item.type === "artifact") {
              const artifact = item.data as {
                id: string;
                title: string;
                content: string;
                artifact_type: string;
                shared_at: string | null;
                created_at: string;
              };
              return <ArtifactMessage key={artifact.id} artifact={artifact} />;
            }

            if (item.type === "user") {
              const msg = item.data as { id: string; content: string; created_at: string };
              return (
                <ThreadMessage key={msg.id} sender="user" timestamp={msg.created_at}>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                </ThreadMessage>
              );
            }

            if (item.type === "assistant") {
              const msg = item.data as { id: string; content: string; created_at: string };
              const isLastAndStreaming = idx === threadItems.length - 1 && isStreaming;
              const displayContent = isLastAndStreaming ? streamingContent : msg.content;
              
              if (!displayContent && !isLastAndStreaming) return null;

              return (
                <ThreadMessage key={msg.id} sender="ai" timestamp={msg.created_at}>
                  {isLastAndStreaming && !displayContent ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5">
                      <ReactMarkdown>{displayContent || "..."}</ReactMarkdown>
                    </div>
                  )}
                </ThreadMessage>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Chat Input - matches agent workspace styling */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted/50 rounded-lg border border-border p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask AgentGPT anything about your home search..."
              className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground min-h-[44px] max-h-[200px]"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-9 w-9 rounded-lg flex-shrink-0"
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
