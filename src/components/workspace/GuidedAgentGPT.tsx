import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle,
  Edit3,
  FileText,
  Home,
  Info,
  Send,
  Sparkles,
  Trash2,
  BarChart3,
  MessageSquare,
  DollarSign,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAgentGPT } from "@/hooks/useAgentGPT";
import { useAgentGPTStream } from "@/hooks/useAgentGPTStream";
import { useRecommendationCache } from "@/hooks/useRecommendationCache";
import { useToast } from "@/hooks/use-toast";
import { StreamingText, ThinkingDots } from "./StreamingText";
import type { StageGroup, AIExplanation } from "@/types/conversation";
import type { Stage, Buyer } from "@/types";
import { STAGES } from "@/types";

// Recommended action types
interface RecommendedAction {
  id: string;
  label: string;
  command: string;
  type: "artifact" | "thinking";
  icon?: React.ElementType;
}

// Message types for chat stream
interface ChatMessage {
  id: string;
  type: "user" | "artifact" | "thinking" | "actions";
  content: string;
  timestamp: Date;
  status?: "streaming" | "complete" | "pending";
  actions?: RecommendedAction[];
}

interface GuidedAgentGPTProps {
  stages: StageGroup[];
  currentStage: Stage;
  buyerName: string;
  buyer: Buyer;
  onExpandStage: (stageId: Stage) => void;
  onSendCommand: (command: string) => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onExpandBlock: (itemId: string) => void;
  onOpenDetails: () => void;
  onPrefillFromProgress?: (command: string) => void;
  prefillCommand?: string;
}

export function GuidedAgentGPT({
  stages,
  currentStage,
  buyerName,
  buyer,
  onSendCommand,
  onApprove,
  prefillCommand,
}: GuidedAgentGPTProps) {
  const [commandInput, setCommandInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isLoading, fetchRecommendedActions } = useAgentGPT();
  const { isStreaming, streamedContent, streamArtifact, streamThinking, clearStream, error: streamError } = useAgentGPTStream();
  const { getCachedActions, setCachedActions, lastRefreshed, isCacheHit } = useRecommendationCache();
  const { toast } = useToast();

  const currentStageData = STAGES[currentStage];

  // Load cached or fresh actions on buyer change
  useEffect(() => {
    const loadActions = async () => {
      // Check cache first for instant display
      const cached = getCachedActions(buyer.id);
      
      if (cached && !cached.isStale) {
        // Instant display from cache
        const actionsWithIcons = cached.actions.map(action => ({
          ...action,
          icon: getIconForAction(action),
        }));
        setRecommendedActions(actionsWithIcons);
        return;
      }

      // Cache miss or stale - fetch fresh
      setIsRefreshing(true);
      try {
        const actions = await fetchRecommendedActions(buyer);
        if (actions.length > 0) {
          const actionsWithIcons = actions.map(action => ({
            ...action,
            icon: getIconForAction(action),
          }));
          setRecommendedActions(actionsWithIcons);
          // Cache for next time
          await setCachedActions(buyer.id, actions);
        } else {
          const fallback = getFallbackActions(currentStage, buyerName);
          setRecommendedActions(fallback);
          await setCachedActions(buyer.id, fallback);
        }
      } catch (err) {
        console.error("Failed to fetch actions:", err);
        const fallback = getFallbackActions(currentStage, buyerName);
        setRecommendedActions(fallback);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Reset messages when buyer changes
    setMessages([]);
    loadActions();
  }, [buyer.id]);

  // Handle prefill from external sources
  useEffect(() => {
    if (prefillCommand) {
      setCommandInput(prefillCommand);
    }
  }, [prefillCommand]);

  // Show error toast
  useEffect(() => {
    if (streamError) {
      toast({
        title: "AgentGPT Error",
        description: streamError,
        variant: "destructive",
      });
    }
  }, [streamError, toast]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  // Update streaming message content
  useEffect(() => {
    if (streamedContent && isStreaming) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.status === "streaming") {
          return prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, content: streamedContent } : msg
          );
        }
        return prev;
      });
    }
  }, [streamedContent, isStreaming]);

  // Mark message complete when streaming ends
  useEffect(() => {
    if (!isStreaming && streamedContent) {
      setMessages(prev =>
        prev.map(msg =>
          msg.status === "streaming" ? { ...msg, status: "complete", content: streamedContent } : msg
        )
      );
    }
  }, [isStreaming, streamedContent]);

  const determineIntent = (command: string): "artifact" | "thinking" => {
    const lowerCommand = command.toLowerCase();
    const thinkingPatterns = [
      "why", "what does", "what are the", "explain to me",
      "help me understand", "what should i", "risks", "mean",
      "analyze", "assessment", "evaluate"
    ];
    return thinkingPatterns.some(p => lowerCommand.includes(p)) ? "thinking" : "artifact";
  };

  const handleSend = useCallback(async () => {
    if (!commandInput.trim() || isStreaming) return;

    const command = commandInput.trim();
    const intent = determineIntent(command);
    onSendCommand(command);
    setCommandInput("");
    clearStream();

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      content: command,
      timestamp: new Date(),
      status: "complete",
    }]);

    // Add streaming placeholder
    setMessages(prev => [...prev, {
      id: `${intent}-${Date.now()}`,
      type: intent,
      content: "",
      timestamp: new Date(),
      status: "streaming",
    }]);

    try {
      if (intent === "thinking") {
        await streamThinking(command, buyer);
      } else {
        await streamArtifact(command, buyer);
      }
    } catch (err) {
      // Error handled by hook
    }
  }, [commandInput, isStreaming, buyer, onSendCommand, streamArtifact, streamThinking, clearStream]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecommendationClick = useCallback(async (action: RecommendedAction) => {
    clearStream();

    // Add action as user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      content: action.label,
      timestamp: new Date(),
      status: "complete",
    }]);

    // Add streaming placeholder
    setMessages(prev => [...prev, {
      id: `${action.type}-${Date.now()}`,
      type: action.type,
      content: "",
      timestamp: new Date(),
      status: "streaming",
    }]);

    try {
      if (action.type === "thinking") {
        await streamThinking(action.command, buyer);
      } else {
        await streamArtifact(action.command, buyer);
      }
    } catch (err) {
      // Error handled by hook
    }
  }, [buyer, streamArtifact, streamThinking, clearStream]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const actions = await fetchRecommendedActions(buyer);
      if (actions.length > 0) {
        const actionsWithIcons = actions.map(action => ({
          ...action,
          icon: getIconForAction(action),
        }));
        setRecommendedActions(actionsWithIcons);
        await setCachedActions(buyer.id, actions);
        toast({ title: "Recommendations updated" });
      }
    } catch (err) {
      toast({ title: "Failed to refresh", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApproveArtifact = (messageId: string) => {
    onApprove(messageId);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, status: "complete" as const } : msg
      )
    );
    toast({ title: "Artifact approved" });
  };

  const handleDiscardArtifact = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Scrollable Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* System Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pb-2">
            <Info className="h-3 w-3" />
            <span>AI-assisted recommendations for {buyerName}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Stage {currentStage}: {currentStageData.title}</span>
          </div>

          {/* Initial Actions (shown when no messages) */}
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recommended next actions</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lastRefreshed && (
                    <span>
                      {isCacheHit ? "Cached" : "Refreshed"} {formatTime(lastRefreshed)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {recommendedActions.slice(0, 4).map((action) => {
                  const Icon = action.icon || Sparkles;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleRecommendationClick(action)}
                      disabled={isStreaming}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all group",
                        "bg-card border border-border/50 hover:border-accent/40 hover:bg-accent/5",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        action.type === "artifact"
                          ? "bg-accent/10 text-accent"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-medium text-foreground flex-1">
                        {action.label}
                      </p>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-accent transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Stream */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={message.status === "streaming"}
              onApprove={() => handleApproveArtifact(message.id)}
              onDiscard={() => handleDiscardArtifact(message.id)}
            />
          ))}
        </div>
      </div>

      {/* Fixed Input Bar */}
      <div className="border-t border-border/40 bg-background/95 backdrop-blur-sm px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              placeholder="Tell AgentGPT what you want to do…"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className={cn(
                "min-h-[52px] max-h-[120px] resize-none pr-14 text-base",
                "bg-muted/40 border-border/50 focus:border-accent/50 focus:bg-background",
                "rounded-xl",
                "placeholder:text-muted-foreground/50",
                "disabled:opacity-50"
              )}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!commandInput.trim() || isStreaming}
              size="icon"
              className={cn(
                "absolute right-2 bottom-2 h-9 w-9 rounded-lg",
                "bg-accent hover:bg-accent/90 text-accent-foreground",
                "disabled:opacity-30"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isStreaming,
  onApprove,
  onDiscard,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  onApprove: () => void;
  onDiscard: () => void;
}) {
  if (message.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent text-accent-foreground px-5 py-3 rounded-2xl rounded-br-md max-w-[80%]">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "thinking") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Internal Analysis</span>
          <Badge variant="outline" className="text-[10px] text-muted-foreground/70">Private</Badge>
        </div>
        <div className="bg-muted/30 rounded-xl px-5 py-4 ml-8">
          {isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <StreamingText
              content={message.content}
              isComplete={!isStreaming}
              className="text-sm text-muted-foreground"
            />
          )}
        </div>
      </div>
    );
  }

  if (message.type === "artifact") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-xs font-medium text-foreground">Draft Artifact</span>
          {message.status !== "complete" && (
            <Badge variant="outline" className="text-[10px] text-warning border-warning/40">
              Pending Approval
            </Badge>
          )}
        </div>
        <div className="border border-warning/30 bg-card rounded-xl overflow-hidden ml-8">
          <div className="px-5 py-4">
            {isStreaming && !message.content ? (
              <ThinkingDots />
            ) : (
              <StreamingText
                content={message.content}
                isComplete={!isStreaming}
                className="text-sm"
              />
            )}
          </div>
          {!isStreaming && message.status !== "complete" && (
            <div className="flex gap-2 px-5 py-3 bg-muted/20 border-t border-border/30">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button size="sm" className="flex-1 gap-2" onClick={onApprove}>
                <CheckCircle className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={onDiscard}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Helper function to format time
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

// Get icon for action based on content
function getIconForAction(action: RecommendedAction): React.ElementType {
  const label = action.label.toLowerCase();
  const command = action.command.toLowerCase();

  if (label.includes("comp") || command.includes("comp") || label.includes("market")) return BarChart3;
  if (label.includes("offer") || command.includes("offer") || label.includes("price")) return DollarSign;
  if (label.includes("update") || label.includes("draft") || command.includes("draft")) return MessageSquare;
  if (label.includes("document") || label.includes("checklist") || command.includes("checklist")) return FileText;
  if (label.includes("inspection") || label.includes("walkthrough")) return Home;
  if (action.type === "thinking") return Info;

  return Sparkles;
}

// Fallback actions if AI fails
function getFallbackActions(stage: Stage, buyerName: string): RecommendedAction[] {
  const firstName = buyerName.split(" ")[0];

  const baseActions: Record<Stage, RecommendedAction[]> = {
    0: [
      { id: "1", label: "Set buyer expectations", command: "Draft buyer introduction and set expectations for the home buying journey", type: "artifact", icon: MessageSquare },
      { id: "2", label: "Confirm financing status", command: "Create task to confirm financing and pre-approval status", type: "artifact", icon: FileText },
      { id: "3", label: "Explain market conditions", command: "Why is understanding market conditions important for buyers?", type: "thinking", icon: Info },
    ],
    1: [
      { id: "1", label: `Draft update for ${firstName}`, command: `Draft buyer update about new listings matching ${buyerName}'s criteria`, type: "artifact", icon: MessageSquare },
      { id: "2", label: "Generate property comps", command: "Generate comparable sales analysis for saved properties", type: "artifact", icon: BarChart3 },
      { id: "3", label: "Explain days on market", command: `Explain "days on market" concept to ${buyerName}`, type: "artifact", icon: MessageSquare },
    ],
    2: [
      { id: "1", label: "Prepare offer strategy", command: "Prepare offer strategy summary for buyer review", type: "artifact", icon: DollarSign },
      { id: "2", label: "Generate offer scenarios", command: "Generate offer scenarios with different price points", type: "artifact", icon: BarChart3 },
      { id: "3", label: "Explain contingencies", command: "Draft explanation of key contingencies for buyer", type: "artifact", icon: MessageSquare },
    ],
    3: [
      { id: "1", label: "Inspection summary", command: "Draft inspection findings summary for buyer", type: "artifact", icon: FileText },
      { id: "2", label: "Create repair request", command: "Generate repair request list based on inspection", type: "artifact", icon: FileText },
      { id: "3", label: "Timeline update", command: "Create closing timeline update for buyer", type: "artifact", icon: MessageSquare },
    ],
    4: [
      { id: "1", label: "Final walkthrough prep", command: "Generate final walkthrough checklist", type: "artifact", icon: Home },
      { id: "2", label: "Closing cost breakdown", command: "Draft closing costs explanation for buyer", type: "artifact", icon: DollarSign },
      { id: "3", label: "What to verify at closing?", command: "What should I verify before closing?", type: "thinking", icon: Info },
    ],
    5: [
      { id: "1", label: "Post-closing resources", command: "Generate post-closing resources and next steps", type: "artifact", icon: Home },
      { id: "2", label: "Request review", command: "Create task to request buyer review and referrals", type: "artifact", icon: MessageSquare },
      { id: "3", label: "What's next for retention?", command: "What's the best approach for client retention?", type: "thinking", icon: Info },
    ],
  };

  return baseActions[stage] || baseActions[1];
}
