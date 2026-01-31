import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, FileText, Home, DollarSign, CheckCircle2, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePortalMessages } from "@/hooks/usePortalMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { PortalBuyer } from "@/pages/BuyerPortal";
import ReactMarkdown from "react-markdown";

interface PortalWorkspaceProps {
  buyer: PortalBuyer;
}

// Get stage info for display
const getStageInfo = (stageName: string | null): { number: number; emoji: string; objective: string } => {
  const stageMap: Record<string, { number: number; emoji: string; objective: string }> = {
    "Readiness & Expectations": { number: 0, emoji: "🎯", objective: "Understand your goals and timeline" },
    "Financing & Capability": { number: 1, emoji: "💰", objective: "Secure your buying power" },
    "Market Intelligence & Search Setup": { number: 2, emoji: "🔍", objective: "Define your ideal home criteria" },
    "Touring, Filtering & Convergence": { number: 3, emoji: "🏠", objective: "Find properties you love" },
    "Offer Strategy & Submission": { number: 4, emoji: "📝", objective: "Submit competitive offers" },
    "Negotiation & Contract": { number: 5, emoji: "🤝", objective: "Negotiate the best terms" },
    "Due Diligence & Inspections": { number: 6, emoji: "🔬", objective: "Verify the property condition" },
    "Appraisal & Lending": { number: 7, emoji: "📊", objective: "Finalize your financing" },
    "Final Walkthrough & Preparation": { number: 8, emoji: "✅", objective: "Prepare for closing day" },
    "Closing & Post-Close": { number: 9, emoji: "🎉", objective: "Complete your purchase" },
  };
  
  const info = stageMap[stageName || ""] || { number: 1, emoji: "📋", objective: "Getting started" };
  return info;
};

// Quick actions for buyers
const BUYER_QUICK_ACTIONS = [
  { id: "status", label: "What's my current status?", icon: CheckCircle2 },
  { id: "next-steps", label: "What should I do next?", icon: Sparkles },
  { id: "properties", label: "Tell me about my saved properties", icon: Home },
  { id: "offers", label: "What's happening with my offers?", icon: DollarSign },
];

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
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch shared artifacts for this buyer
  const { data: sharedArtifacts } = useQuery({
    queryKey: ["portal-artifacts", buyer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("buyer_id", buyer.id)
        .eq("visibility", "shared")
        .order("shared_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!buyer.id,
  });

  // Fetch property counts
  const { data: propertyCounts } = useQuery({
    queryKey: ["portal-property-counts", buyer.id],
    queryFn: async () => {
      const { count: savedCount } = await supabase
        .from("buyer_properties")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyer.id)
        .eq("favorited", true);

      const { count: viewedCount } = await supabase
        .from("buyer_properties")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyer.id)
        .eq("viewed", true);

      return { saved: savedCount || 0, viewed: viewedCount || 0 };
    },
    enabled: !!buyer.id,
  });

  // Fetch active offers count
  const { data: offerCount } = useQuery({
    queryKey: ["portal-offer-count", buyer.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyer.id)
        .in("status", ["draft", "pending", "submitted"]);

      return count || 0;
    },
    enabled: !!buyer.id,
  });

  const stageInfo = getStageInfo(buyer.current_stage);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleSend = async (message?: string) => {
    const trimmedInput = (message || input).trim();
    if (!trimmedInput || isStreaming) return;

    // Hide quick actions after first message
    setShowQuickActions(false);

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

  const handleQuickAction = (actionId: string) => {
    const action = BUYER_QUICK_ACTIONS.find(a => a.id === actionId);
    if (action) {
      handleSend(action.label);
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
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#f9fafb]">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
          {/* Welcome Section - Only show when no messages */}
          {!hasMessages && showQuickActions && (
            <div className="max-w-3xl">
              {/* Stage Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Your Home Buying Journey</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-light text-foreground mb-2">
                  Hi {buyer.name.split(" ")[0]}! 👋
                </h1>
                <p className="text-muted-foreground">
                  You're currently in <strong>Stage {stageInfo.number}: {buyer.current_stage || "Getting Started"}</strong>
                  <span className="ml-2 text-lg">{stageInfo.emoji}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stageInfo.objective}
                </p>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{propertyCounts?.saved || 0}</p>
                        <p className="text-xs text-muted-foreground">Saved Properties</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{propertyCounts?.viewed || 0}</p>
                        <p className="text-xs text-muted-foreground">Properties Viewed</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{offerCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Active Offers</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{sharedArtifacts?.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Documents</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Quick Questions</h3>
                <div className="space-y-2">
                  {BUYER_QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        disabled={isStreaming}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg border bg-white",
                          "text-foreground/80 hover:text-foreground hover:border-foreground/20",
                          "transition-colors flex items-center gap-3",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shared Documents Section */}
              {sharedArtifacts && sharedArtifacts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents From Your Agent
                  </h3>
                  <div className="space-y-2">
                    {sharedArtifacts.slice(0, 3).map((artifact) => (
                      <Card key={artifact.id} className="bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{artifact.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Shared {new Date(artifact.shared_at || artifact.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {artifact.artifact_type}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conversation Stream */}
          {hasMessages && (
            <div className="max-w-3xl space-y-6">
              {/* Show Back to Actions button */}
              {!showQuickActions && (
                <button
                  onClick={() => setShowQuickActions(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Back to quick actions
                </button>
              )}

              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={isStreaming && message.content === ""}
                />
              ))}

              {/* Streaming indicator */}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input */}
      <div className="border-t border-border/20 bg-[#f9fafb]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6">
          <div className="relative max-w-3xl">
            <textarea
              ref={textareaRef}
              placeholder={`Ask AgentGPT anything about your home search...`}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              rows={1}
              className={cn(
                "w-full min-h-[52px] max-h-[200px] resize-none pr-14 py-4 px-5",
                "text-base",
                "bg-white border border-border/30 focus:border-border/60 focus:outline-none",
                "placeholder:text-muted-foreground/40",
                "disabled:opacity-50"
              )}
              style={{ borderRadius: '2px' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className={cn(
                "absolute right-4 bottom-4",
                "text-muted-foreground/40 hover:text-foreground transition-colors",
                "disabled:opacity-20 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-3xl">
            I can answer questions but can't take actions. Contact your agent for changes.
          </p>
        </div>
      </div>
    </div>
  );
}

// Message Card Component - structured like agent workspace
interface MessageCardProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

function MessageCard({ role, content, isStreaming }: MessageCardProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <Card className="bg-white border-border/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">You asked:</p>
              <p className="text-foreground">{content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm font-medium text-primary mb-2">AgentGPT</p>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5">
              <ReactMarkdown>{content || (isStreaming ? "Thinking..." : "...")}</ReactMarkdown>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
