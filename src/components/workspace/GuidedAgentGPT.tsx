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
  RefreshCw,
  ArrowRight,
  User,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAgentGPT } from "@/hooks/useAgentGPT";
import { useAgentGPTStream } from "@/hooks/useAgentGPTStream";
import { useRecommendationCache } from "@/hooks/useRecommendationCache";
import { useToast } from "@/hooks/use-toast";
import { StreamingText, ThinkingDots } from "./StreamingText";
import type { StageGroup } from "@/types/conversation";
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
  type: "user" | "artifact" | "thinking";
  content: string;
  timestamp: Date;
  status?: "streaming" | "complete" | "pending";
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
  const [showActions, setShowActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isLoading, fetchRecommendedActions } = useAgentGPT();
  const { isStreaming, streamedContent, streamArtifact, streamThinking, clearStream, error: streamError } = useAgentGPTStream();
  const { getCachedActions, setCachedActions, lastRefreshed, isCacheHit } = useRecommendationCache();
  const { toast } = useToast();

  const currentStageData = STAGES[currentStage];

  // Load cached or fresh actions on buyer change
  useEffect(() => {
    const loadActions = async () => {
      const fallback = getFallbackActions(currentStage, buyerName);
      setRecommendedActions(fallback);
      setShowActions(true);

      const cached = getCachedActions(buyer.id);

      if (cached && !cached.isStale) {
        const actionsWithIcons = cached.actions.map(action => ({
          ...action,
          icon: getIconForAction(action),
        }));
        setRecommendedActions(actionsWithIcons);
        return;
      }

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
        }
      } catch (err) {
        console.error("Failed to fetch actions:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    setMessages([]);
    setShowActions(true);
    loadActions();
  }, [buyer.id, currentStage, buyerName]);

  useEffect(() => {
    if (prefillCommand) {
      setCommandInput(prefillCommand);
    }
  }, [prefillCommand]);

  useEffect(() => {
    if (streamError) {
      toast({
        title: "AgentGPT Error",
        description: streamError,
        variant: "destructive",
      });
    }
  }, [streamError, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

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
    setShowActions(false);

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      content: command,
      timestamp: new Date(),
      status: "complete",
    }]);

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
    } catch {
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
    setShowActions(false);

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      content: action.label,
      timestamp: new Date(),
      status: "complete",
    }]);

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
    } catch {
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
    } catch {
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
    toast({ title: "Artifact approved and published" });
  };

  const handleDiscardArtifact = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Scrollable Content - Full Width, No Cards */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 py-8">
          
          {/* Minimal Context Line */}
          <div className="text-[13px] text-muted-foreground/50 mb-8 pb-4 border-b border-border/20">
            {buyerName} · Stage {currentStage}: {currentStageData.title}
            {lastRefreshed && (
              <span className="ml-3">
                · {isCacheHit ? "Cached" : "Updated"} {formatTime(lastRefreshed)}
              </span>
            )}
          </div>

          {/* Recommended Actions - Full Width, No Card Wrappers */}
          {showActions && messages.length === 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">Recommended actions</h2>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </button>
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
                        "w-full flex items-center gap-4 py-3 px-1 text-left transition-colors group",
                        "hover:bg-muted/30 rounded-sm",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                        action.type === "artifact"
                          ? "bg-accent/10 text-accent"
                          : "bg-muted/50 text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-[15px] text-foreground font-normal">
                        {action.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Stream - Plain Text Blocks, No Bubbles */}
          <div className="space-y-8">
            {messages.map((message) => (
              <MessageBlock
                key={message.id}
                message={message}
                isStreaming={message.status === "streaming"}
                onApprove={() => handleApproveArtifact(message.id)}
                onDiscard={() => handleDiscardArtifact(message.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Input - Minimal, Full Width */}
      <div className="border-t border-border/30 bg-background">
        <div className="w-full max-w-none px-2 sm:px-4 lg:px-6 py-4">
          <div className="relative">
            <Textarea
              placeholder="Message AgentGPT..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className={cn(
                "w-full min-h-[52px] max-h-[160px] resize-none pr-14",
                "text-[15px] leading-relaxed",
                "bg-transparent border border-border/40 focus:border-border",
                "rounded-lg",
                "placeholder:text-muted-foreground/40",
                "disabled:opacity-50"
              )}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!commandInput.trim() || isStreaming}
              size="icon"
              variant="ghost"
              className={cn(
                "absolute right-2 bottom-2 h-9 w-9",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "disabled:opacity-30 disabled:cursor-not-allowed"
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

// Message Block Component - Plain text, no bubbles
function MessageBlock({
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
      <div className="flex gap-4 items-start">
        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[15px] leading-relaxed text-foreground">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "thinking") {
    return (
      <div className="flex gap-4 items-start">
        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wide">Internal Analysis</span>
            <span className="text-[10px] text-muted-foreground/40">· Not shared with buyer</span>
          </div>
          <div className="text-[15px] leading-[1.7] text-foreground/80">
            {isStreaming && !message.content ? (
              <ThinkingDots />
            ) : (
              <StreamingText
                content={message.content}
                isComplete={!isStreaming}
                className="text-[15px] leading-[1.7]"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "artifact") {
    const isPending = message.status !== "complete" && !isStreaming;
    return (
      <div className="flex gap-4 items-start">
        <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-foreground/70 uppercase tracking-wide">Draft Artifact</span>
            {isPending && (
              <span className="text-[10px] text-warning">· Pending Approval</span>
            )}
            {message.status === "complete" && !isStreaming && (
              <span className="text-[10px] text-success">· Approved</span>
            )}
          </div>
          
          <div className="text-[15px] leading-[1.7] text-foreground mb-4">
            {isStreaming && !message.content ? (
              <ThinkingDots />
            ) : (
              <StreamingText
                content={message.content}
                isComplete={!isStreaming}
                className="text-[15px] leading-[1.7]"
              />
            )}
          </div>

          {isPending && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/20">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button 
                size="sm" 
                className="h-8 bg-success hover:bg-success/90 text-success-foreground gap-1.5" 
                onClick={onApprove}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Approve & Publish
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground/60 hover:text-destructive"
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

// Helper functions
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
