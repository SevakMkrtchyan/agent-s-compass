import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  ClipboardList,
  Loader2,
  Eye,
  Lock,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAgentGPT } from "@/hooks/useAgentGPT";
import { useAgentGPTStream } from "@/hooks/useAgentGPTStream";
import { useRecommendationCache } from "@/hooks/useRecommendationCache";
import { useStage, type NextAction } from "@/hooks/useStages";
import { useArtifacts } from "@/hooks/useArtifacts";
import { useToast } from "@/hooks/use-toast";
import { StreamingText, ThinkingDots } from "./StreamingText";
import type { StageGroup } from "@/types/conversation";
import type { Stage, Buyer } from "@/types";
import { STAGES } from "@/types";

interface RecommendedAction {
  id: string;
  label: string;
  command: string;
  type: "artifact" | "thinking";
  icon?: React.ElementType;
  dbType?: "task" | "generate";
}

interface ChatMessage {
  id: string;
  type: "user" | "artifact" | "thinking";
  content: string;
  timestamp: Date;
  status?: "streaming" | "complete" | "pending" | "saved";
  savedVisibility?: "internal" | "shared";
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
  initialAction?: string;
  initialCommand?: string;
}

export function GuidedAgentGPT({
  currentStage,
  buyerName,
  buyer,
  onSendCommand,
  onApprove,
  prefillCommand,
  initialAction,
  initialCommand,
}: GuidedAgentGPTProps) {
  const [searchParams] = useSearchParams();
  const [commandInput, setCommandInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [hasTriggeredInitial, setHasTriggeredInitial] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isLoading, fetchRecommendedActions } = useAgentGPT();
  const { isStreaming, streamedContent, streamArtifact, streamThinking, clearStream, error: streamError } = useAgentGPTStream();
  const { getCachedActions, setCachedActions, lastRefreshed, isCacheHit } = useRecommendationCache();
  const { createArtifact, isCreating } = useArtifacts(buyer.id);
  const { toast } = useToast();
  
  // Fetch stage data from database
  const { data: dbStage, isLoading: stageLoading } = useStage(currentStage);

  const currentStageData = STAGES[currentStage];

  // Convert database next_actions to RecommendedAction format
  const mapDbActionsToRecommended = useCallback((dbActions: NextAction[], buyerName: string): RecommendedAction[] => {
    return dbActions.map((action, idx) => ({
      id: action.id || `action-${idx}`,
      label: action.label,
      command: generateCommandFromDbAction(action, buyerName),
      type: "artifact" as const,
      dbType: action.type,
      icon: getIconForDbAction(action),
    }));
  }, []);

  // Load actions on mount, buyer change, or when stage data loads
  useEffect(() => {
    const loadActions = async () => {
      // First priority: Use database stage actions if available
      if (dbStage?.next_actions && dbStage.next_actions.length > 0) {
        const dbActions = mapDbActionsToRecommended(dbStage.next_actions, buyerName);
        setRecommendedActions(dbActions);
        setShowActions(true);
        return;
      }

      // Fallback to hardcoded actions while DB loads
      const fallback = getFallbackActions(currentStage, buyerName);
      setRecommendedActions(fallback);
      setShowActions(true);
    };

    setMessages([]);
    setShowActions(true);
    setHasTriggeredInitial(false);
    loadActions();
  }, [buyer.id, currentStage, buyerName, dbStage, mapDbActionsToRecommended]);

  // Handle initial action/command from URL params
  useEffect(() => {
    if (hasTriggeredInitial) return;

    const actionParam = searchParams.get('action') || initialAction;
    const commandParam = searchParams.get('command') || initialCommand;

    if (commandParam) {
      setHasTriggeredInitial(true);
      // Trigger the command directly
      setTimeout(() => {
        triggerCommand(commandParam, "artifact");
      }, 100);
    } else if (actionParam) {
      setHasTriggeredInitial(true);
      // Map action to appropriate command
      const actionCommand = getCommandForAction(actionParam, buyerName);
      if (actionCommand) {
        setTimeout(() => {
          triggerCommand(actionCommand.command, actionCommand.type);
        }, 100);
      }
    }
  }, [searchParams, initialAction, initialCommand, hasTriggeredInitial, buyerName]);

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

  const triggerCommand = useCallback(async (command: string, type: "artifact" | "thinking") => {
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
      id: `${type}-${Date.now()}`,
      type: type,
      content: "",
      timestamp: new Date(),
      status: "streaming",
    }]);

    try {
      if (type === "thinking") {
        await streamThinking(command, buyer);
      } else {
        await streamArtifact(command, buyer);
      }
    } catch {
      // Error handled by hook
    }
  }, [buyer, streamArtifact, streamThinking, clearStream]);

  const handleSend = useCallback(async () => {
    if (!commandInput.trim() || isStreaming) return;

    const command = commandInput.trim();
    const intent = determineIntent(command);
    onSendCommand(command);
    setCommandInput("");
    
    await triggerCommand(command, intent);
  }, [commandInput, isStreaming, onSendCommand, triggerCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecommendationClick = useCallback(async (action: RecommendedAction) => {
    await triggerCommand(action.command, action.type);
  }, [triggerCommand]);

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

  const handleSaveArtifact = async (messageId: string, visibility: "internal" | "shared") => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.content) return;

    try {
      // Generate a title from the first line or first 50 chars
      const firstLine = message.content.split('\n')[0];
      const title = firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine;

      await createArtifact({
        buyer_id: buyer.id,
        stage_id: dbStage?.id || null,
        artifact_type: "agent-generated",
        title,
        content: message.content,
        visibility,
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId 
            ? { ...msg, status: "saved" as const, savedVisibility: visibility } 
            : msg
        )
      );
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f9fafb]">
      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
          
          {/* Stage Context */}
          <p className="text-xs text-muted-foreground/40 mb-8">
            {dbStage ? (
              <span>Stage {currentStage}: {dbStage.stage_name}</span>
            ) : stageLoading ? (
              <span>Loading stage data...</span>
            ) : null}
          </p>

          {/* Recommended Actions - Plain Text */}
          {showActions && messages.length === 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-10">
                <h2 className="text-2xl md:text-3xl font-medium text-foreground">What would you like to do for {buyerName}?</h2>
                {stageLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {stageLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 bg-muted/30 rounded animate-pulse w-3/4" />
                  ))}
                </div>
              ) : (
                <div className="space-y-0">
                  {recommendedActions.slice(0, 4).map((action, idx) => (
                    <button
                      key={action.id}
                      onClick={() => handleRecommendationClick(action)}
                      disabled={isStreaming}
                      className={cn(
                        "w-full text-left py-4 text-lg text-foreground/70 hover:text-foreground transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        idx < 3 && "border-b border-border/10"
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message Stream */}
          <div className="space-y-12 md:space-y-16">
            {messages.map((message) => (
              <MessageBlock
                key={message.id}
                message={message}
                isStreaming={message.status === "streaming"}
                isSaving={isCreating}
                onApprove={() => handleApproveArtifact(message.id)}
                onDiscard={() => handleDiscardArtifact(message.id)}
                onSaveInternal={() => handleSaveArtifact(message.id, "internal")}
                onSaveShared={() => handleSaveArtifact(message.id, "shared")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Input */}
      <div className="border-t border-border/20 bg-[#f9fafb]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6">
          <div className="relative max-w-3xl">
            <textarea
              placeholder={`Tell AgentGPT what to do for ${buyerName}...`}
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
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
              onClick={handleSend}
              disabled={!commandInput.trim() || isStreaming}
              className={cn(
                "absolute right-4 bottom-4",
                "text-muted-foreground/40 hover:text-foreground transition-colors",
                "disabled:opacity-20 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBlock({
  message,
  isStreaming,
  isSaving,
  onApprove,
  onDiscard,
  onSaveInternal,
  onSaveShared,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  isSaving: boolean;
  onApprove: () => void;
  onDiscard: () => void;
  onSaveInternal: () => void;
  onSaveShared: () => void;
}) {
  if (message.type === "user") {
    return (
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">You</p>
        <p className="text-xl font-medium text-foreground leading-relaxed">{message.content}</p>
      </div>
    );
  }

  if (message.type === "thinking") {
    return (
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">
          AgentGPT
        </p>
        <div className="text-base leading-[1.75] text-foreground/80">
          {isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <StreamingText
              content={message.content}
              isComplete={!isStreaming}
              className="text-base leading-[1.75]"
            />
          )}
        </div>
      </div>
    );
  }

  if (message.type === "artifact") {
    const isPending = message.status !== "complete" && message.status !== "saved" && !isStreaming;
    const isSaved = message.status === "saved";
    
    return (
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">
          Draft
          {isPending && <span className="ml-2 text-warning normal-case">· Ready to save</span>}
          {isSaved && message.savedVisibility === "internal" && (
            <span className="ml-2 text-muted-foreground normal-case flex items-center gap-1 inline-flex">
              · <Lock className="h-3 w-3" /> Saved (internal)
            </span>
          )}
          {isSaved && message.savedVisibility === "shared" && (
            <span className="ml-2 text-success normal-case flex items-center gap-1 inline-flex">
              · <Eye className="h-3 w-3" /> Saved & shared with buyer
            </span>
          )}
        </p>
        
        <div className="text-base leading-[1.75] text-foreground mb-8">
          {isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <StreamingText
              content={message.content}
              isComplete={!isStreaming}
              className="text-base leading-[1.75]"
            />
          )}
        </div>

        {isPending && (
          <div className="flex items-center gap-4 pt-6 border-t border-border/10">
            <button 
              className="text-sm border border-border/30 text-foreground px-4 py-2 hover:bg-muted/50 flex items-center gap-2 transition-colors disabled:opacity-50" 
              onClick={onSaveInternal}
              disabled={isSaving}
              style={{ borderRadius: '2px' }}
            >
              <Lock className="h-4 w-4" />
              Save as Internal
            </button>
            <button 
              className="text-sm bg-foreground text-background px-4 py-2 hover:bg-foreground/90 flex items-center gap-2 transition-colors disabled:opacity-50" 
              onClick={onSaveShared}
              disabled={isSaving}
              style={{ borderRadius: '2px' }}
            >
              <Share2 className="h-4 w-4" />
              Save & Share with Buyer
            </button>
            <button
              className="text-sm text-muted-foreground/40 hover:text-destructive transition-colors"
              onClick={onDiscard}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

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

// Generate command string from database action
function generateCommandFromDbAction(action: NextAction, buyerName: string): string {
  const firstName = buyerName.split(" ")[0];
  
  // Map action IDs to specific commands
  const commandMap: Record<string, string> = {
    "schedule-consultation": `Create a task to schedule a consultation call with ${buyerName}`,
    "prep-consultation": `Prepare a consultation agenda for my upcoming call with ${firstName}`,
    "create-strategy-brief": `Create a buyer strategy brief for ${buyerName} based on their preferences and goals`,
    "share-process-overview": `Draft a home buying process overview to share with ${firstName}`,
  };

  // Check if we have a specific command for this action ID
  if (commandMap[action.id]) {
    return commandMap[action.id];
  }

  // Generate command from label if no specific mapping
  const actionVerb = action.type === "task" ? "Create a task to" : "Generate";
  return `${actionVerb} ${action.label.toLowerCase()} for ${buyerName}`;
}

// Get icon based on database action type and label
function getIconForDbAction(action: NextAction): React.ElementType {
  const label = action.label.toLowerCase();
  
  if (label.includes("schedule") || label.includes("call")) return MessageSquare;
  if (label.includes("prep") || label.includes("agenda") || label.includes("checklist")) return ClipboardList;
  if (label.includes("strategy") || label.includes("brief")) return FileText;
  if (label.includes("overview") || label.includes("process")) return Info;
  if (label.includes("offer") || label.includes("price")) return DollarSign;
  if (label.includes("property") || label.includes("home")) return Home;
  if (label.includes("market") || label.includes("comp")) return BarChart3;
  
  // Default icons by type
  return action.type === "task" ? ClipboardList : Sparkles;
}

function getCommandForAction(action: string, buyerName: string): { command: string; type: "artifact" | "thinking" } | null {
  const firstName = buyerName.split(" ")[0];
  
  const actionMap: Record<string, { command: string; type: "artifact" | "thinking" }> = {
    "needs-attention": {
      command: `Review open tasks and pending items for ${buyerName} and suggest next steps`,
      type: "artifact"
    },
    "review-approvals": {
      command: `Show pending approvals for ${buyerName} that need my review`,
      type: "artifact"
    },
    "weekly-summary": {
      command: `Generate a weekly activity summary for ${buyerName}`,
      type: "artifact"
    },
    "create-buyer-intro": {
      command: `Draft an introduction and set expectations for a new buyer`,
      type: "artifact"
    },
  };

  return actionMap[action] || null;
}

function getFallbackActions(stage: Stage, buyerName: string): RecommendedAction[] {
  const firstName = buyerName.split(" ")[0];

  const baseActions: Partial<Record<Stage, RecommendedAction[]>> = {
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
