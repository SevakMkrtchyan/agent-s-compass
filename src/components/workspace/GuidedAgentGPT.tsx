import { useState, useEffect, useCallback } from "react";
import { 
  ChevronDown,
  ChevronUp,
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
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAgentGPT } from "@/hooks/useAgentGPT";
import { useToast } from "@/hooks/use-toast";
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

// Current UI state
type AgentGPTMode = "guided" | "artifact" | "thinking" | "loading";

interface PendingArtifact {
  id: string;
  content: string;
  stageTitle: string;
  timestamp: Date;
}

interface ThinkingResponse {
  id: string;
  content: string;
  timestamp: Date;
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
  onOpenDetails,
  prefillCommand,
}: GuidedAgentGPTProps) {
  const [commandInput, setCommandInput] = useState("");
  const [mode, setMode] = useState<AgentGPTMode>("loading");
  const [pendingArtifact, setPendingArtifact] = useState<PendingArtifact | null>(null);
  const [thinkingResponse, setThinkingResponse] = useState<ThinkingResponse | null>(null);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);

  const { isLoading, error, fetchRecommendedActions, generateArtifact, generateThinking, clearError } = useAgentGPT();
  const { toast } = useToast();

  // Get current stage info
  const currentStageData = STAGES[currentStage];

  // Fetch recommended actions when buyer changes
  useEffect(() => {
    const loadActions = async () => {
      setMode("loading");
      try {
        const actions = await fetchRecommendedActions(buyer);
        if (actions.length > 0) {
          // Add icons based on type/content
          const actionsWithIcons = actions.map(action => ({
            ...action,
            icon: getIconForAction(action),
          }));
          setRecommendedActions(actionsWithIcons);
        } else {
          // Fallback to stage-based actions
          setRecommendedActions(getFallbackActions(currentStage, buyerName));
        }
        setMode("guided");
      } catch (err) {
        console.error("Failed to fetch actions:", err);
        setRecommendedActions(getFallbackActions(currentStage, buyerName));
        setMode("guided");
      }
    };

    loadActions();
  }, [buyer.id, fetchRecommendedActions]);

  // Handle prefill from external sources
  useEffect(() => {
    if (prefillCommand) {
      setCommandInput(prefillCommand);
    }
  }, [prefillCommand]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "AgentGPT Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Determine intent from command
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
    if (!commandInput.trim() || isLoading) return;

    const command = commandInput.trim();
    const intent = determineIntent(command);
    onSendCommand(command);
    setCommandInput("");
    setMode("loading");

    try {
      if (intent === "thinking") {
        const content = await generateThinking(command, buyer);
        setThinkingResponse({
          id: `think-${Date.now()}`,
          content,
          timestamp: new Date(),
        });
        setMode("thinking");
      } else {
        const content = await generateArtifact(command, buyer);
        setPendingArtifact({
          id: `artifact-${Date.now()}`,
          content,
          stageTitle: currentStageData.title,
          timestamp: new Date(),
        });
        setMode("artifact");
      }
    } catch (err) {
      // Error already handled by hook
      setMode("guided");
    }
  }, [commandInput, isLoading, buyer, currentStageData, onSendCommand, generateArtifact, generateThinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecommendationClick = useCallback(async (action: RecommendedAction) => {
    setMode("loading");

    try {
      if (action.type === "thinking") {
        const content = await generateThinking(action.command, buyer);
        setThinkingResponse({
          id: `think-${Date.now()}`,
          content,
          timestamp: new Date(),
        });
        setMode("thinking");
      } else {
        const content = await generateArtifact(action.command, buyer);
        setPendingArtifact({
          id: `artifact-${Date.now()}`,
          content,
          stageTitle: currentStageData.title,
          timestamp: new Date(),
        });
        setMode("artifact");
      }
    } catch (err) {
      setMode("guided");
    }
  }, [buyer, currentStageData, generateArtifact, generateThinking]);

  const handleApproveArtifact = () => {
    if (pendingArtifact) {
      onApprove(pendingArtifact.id);
      setPendingArtifact(null);
      // Refresh actions after approval
      fetchRecommendedActions(buyer).then(actions => {
        if (actions.length > 0) {
          setRecommendedActions(actions.map(a => ({ ...a, icon: getIconForAction(a) })));
        }
      });
      setMode("guided");
    }
  };

  const handleDiscardArtifact = () => {
    setPendingArtifact(null);
    setMode("guided");
  };

  const handleDismissThinking = () => {
    setThinkingResponse(null);
    setMode("guided");
  };

  // Get activity log from stages
  const activityLog = stages
    .flatMap(s => s.items.filter(item => 
      item.type === "system-event" || 
      (item.type === "ai-explanation" && (item as AIExplanation).approvalStatus === "approved")
    ))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* System Guardrails - Subtle */}
      <div className="px-6 pt-4">
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          AI-assisted recommendations. You make the final decisions.
        </p>
      </div>

      {/* Main Content - Centered Decision Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl space-y-6">
          
          {/* Loading State */}
          {mode === "loading" && (
            <Card className="border border-border/60 shadow-sm bg-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-sm text-muted-foreground">Analyzing context...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE A: Guided Mode - Recommended Actions */}
          {mode === "guided" && (
            <Card className="border border-border/60 shadow-sm bg-card">
              <CardHeader className="pb-2 pt-5">
                <h2 className="text-base font-semibold text-foreground">Next actions</h2>
              </CardHeader>
              <CardContent className="pb-5">
                <div className="space-y-1">
                  {/* Primary actions - first 3 only */}
                  {recommendedActions.slice(0, 3).map((action) => {
                    const Icon = action.icon || Sparkles;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleRecommendationClick(action)}
                        disabled={isLoading}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group",
                          "hover:bg-muted/60 disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          action.type === "artifact" 
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-sm text-foreground flex-1">
                          {action.label}
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </button>
                    );
                  })}
                  
                  {/* Escape hatch - Something else */}
                  <button
                    onClick={() => {
                      const input = document.querySelector('textarea');
                      if (input) input.focus();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group",
                      "hover:bg-muted/40"
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-transparent text-muted-foreground/50">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                      Something else…
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE B: Artifact Mode - Single Structured Card */}
          {mode === "artifact" && pendingArtifact && (
            <Card className="border border-warning/40 shadow-sm overflow-hidden">
              <CardHeader className="bg-warning/5 pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Draft for review</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Stage: {pendingArtifact.stageTitle}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-warning border-warning/40 text-xs font-medium">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-5">
                <div className="bg-muted/40 rounded-lg p-4 mb-5 max-h-[300px] overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {pendingArtifact.content}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {/* Would open edit modal */}}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={handleApproveArtifact}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={handleDiscardArtifact}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE C: Thinking Mode - Internal Explanation (Visually Demoted) */}
          {mode === "thinking" && thinkingResponse && (
            <Card className="border border-muted/50 shadow-sm overflow-hidden bg-muted/20">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Internal note</span>
                  <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground/70">
                    Private
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="bg-background/60 rounded-lg p-3 mb-3 max-h-[300px] overflow-y-auto">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {thinkingResponse.content}
                  </p>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={handleDismissThinking}
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Command Input - Clean & Minimal */}
          <div className="space-y-1.5">
            <div className="relative">
              <Textarea
                placeholder="Tell the agent what you want to do…"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={cn(
                  "min-h-[48px] max-h-[100px] resize-none pr-12 text-sm",
                  "bg-muted/30 border-0 focus:bg-background focus:ring-1 focus:ring-accent/30",
                  "rounded-lg",
                  "placeholder:text-muted-foreground/50",
                  "disabled:opacity-50"
                )}
                rows={1}
              />
              <Button 
                onClick={handleSend} 
                disabled={!commandInput.trim() || isLoading} 
                size="icon" 
                variant="ghost"
                className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-md text-muted-foreground hover:text-accent disabled:opacity-30"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {mode === "guided" && (
              <p className="text-[11px] text-muted-foreground/50 text-center">
                or select an action above
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Context Layer - Minimal Footer */}
      <div className="border-t border-border/50 bg-muted/20">
        <div className="max-w-xl mx-auto px-6 py-2 flex items-center justify-center gap-4">
          {/* Transaction Context - Single Collapsed Trigger */}
          <Collapsible open={contextExpanded} onOpenChange={setContextExpanded}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                {contextExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                <span>View transaction context</span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute left-0 right-0 bottom-full mb-1 mx-auto max-w-2xl px-6">
              <div className="bg-card border border-muted rounded-lg p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-lg">{currentStageData.icon}</div>
                  <div>
                    <p className="text-sm font-medium">Stage {currentStage}: {currentStageData.title}</p>
                    <p className="text-xs text-muted-foreground">{buyerName}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Financing: {buyer.financingConfirmed ? "Confirmed" : "Pending"}</p>
                  {buyer.buyerType && <p>Buyer Type: {buyer.buyerType}</p>}
                  {buyer.marketContext && <p>Market: {buyer.marketContext}</p>}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={onOpenDetails}
                >
                  Open full details
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <span className="text-muted-foreground/30">·</span>

          {/* Activity Log Trigger */}
          <Collapsible open={activityLogOpen} onOpenChange={setActivityLogOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                <Clock className="h-3 w-3" />
                <span>Recent activity</span>
                {activityLog.length > 0 && (
                  <span className="text-[10px]">({activityLog.length})</span>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute left-0 right-0 bottom-full mb-1 mx-auto max-w-2xl px-6">
              <div className="bg-card border border-muted rounded-lg p-3 shadow-lg">
                {activityLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1">No recent activity</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {activityLog.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors cursor-pointer text-xs"
                      >
                        <div className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">
                          {item.type === "system-event" ? item.title : "Approved artifact"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "Just now";
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
  const firstName = buyerName.split(' ')[0];
  
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
