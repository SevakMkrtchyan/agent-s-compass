import { useState, useEffect } from "react";
import { 
  ArrowRight, 
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
import type { StageGroup, AIExplanation } from "@/types/conversation";
import type { Stage } from "@/types";
import { STAGES } from "@/types";

// Recommended action types
interface RecommendedAction {
  id: string;
  label: string;
  description: string;
  command: string;
  icon: React.ElementType;
  type: "artifact" | "thinking";
}

// Current UI state
type AgentGPTMode = "guided" | "artifact" | "thinking";

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
  onSendCommand,
  onApprove,
  onOpenDetails,
  prefillCommand,
}: GuidedAgentGPTProps) {
  const [commandInput, setCommandInput] = useState("");
  const [mode, setMode] = useState<AgentGPTMode>("guided");
  const [pendingArtifact, setPendingArtifact] = useState<PendingArtifact | null>(null);
  const [thinkingResponse, setThinkingResponse] = useState<ThinkingResponse | null>(null);
  const [contextExpanded, setContextExpanded] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);

  // Get current stage info
  const currentStageData = STAGES[currentStage];

  // Generate recommended actions based on stage and context
  const recommendedActions: RecommendedAction[] = getRecommendedActions(currentStage, buyerName);

  // Handle prefill from external sources
  useEffect(() => {
    if (prefillCommand) {
      setCommandInput(prefillCommand);
    }
  }, [prefillCommand]);

  // Determine intent from command
  const determineIntent = (command: string): "artifact" | "thinking" => {
    const lowerCommand = command.toLowerCase();
    const thinkingPatterns = [
      "why", "what does", "what are the", "explain to me", 
      "help me understand", "what should i", "risks", "mean"
    ];
    
    return thinkingPatterns.some(p => lowerCommand.includes(p)) ? "thinking" : "artifact";
  };

  const handleSend = () => {
    if (!commandInput.trim()) return;

    const intent = determineIntent(commandInput);
    onSendCommand(commandInput.trim());

    if (intent === "thinking") {
      // Generate thinking response
      setThinkingResponse({
        id: `think-${Date.now()}`,
        content: generateThinkingResponse(commandInput),
        timestamp: new Date(),
      });
      setMode("thinking");
    } else {
      // Generate artifact
      setPendingArtifact({
        id: `artifact-${Date.now()}`,
        content: generateArtifactContent(commandInput, buyerName),
        stageTitle: currentStageData.title,
        timestamp: new Date(),
      });
      setMode("artifact");
    }

    setCommandInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecommendationClick = (action: RecommendedAction) => {
    if (action.type === "thinking") {
      setThinkingResponse({
        id: `think-${Date.now()}`,
        content: generateThinkingResponse(action.command),
        timestamp: new Date(),
      });
      setMode("thinking");
    } else {
      setPendingArtifact({
        id: `artifact-${Date.now()}`,
        content: generateArtifactContent(action.command, buyerName),
        stageTitle: currentStageData.title,
        timestamp: new Date(),
      });
      setMode("artifact");
    }
  };

  const handleApproveArtifact = () => {
    if (pendingArtifact) {
      onApprove(pendingArtifact.id);
      setPendingArtifact(null);
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
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleRecommendationClick(action)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group",
                          "hover:bg-muted/60"
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
                <div className="bg-muted/40 rounded-lg p-4 mb-5">
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
                <div className="bg-background/60 rounded-lg p-3 mb-3">
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
                className={cn(
                  "min-h-[48px] max-h-[100px] resize-none pr-12 text-sm",
                  "bg-muted/30 border-0 focus:bg-background focus:ring-1 focus:ring-accent/30",
                  "rounded-lg",
                  "placeholder:text-muted-foreground/50"
                )}
                rows={1}
              />
              <Button 
                onClick={handleSend} 
                disabled={!commandInput.trim()} 
                size="icon" 
                variant="ghost"
                className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-md text-muted-foreground hover:text-accent disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
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

// Generate thinking response (mock)
function generateThinkingResponse(command: string): string {
  const responses: Record<string, string> = {
    default: `Based on my analysis of the current market conditions and this buyer's profile, here's what you should consider:

1. **Market Context**: Current inventory levels are low, which means buyers face increased competition for desirable properties.

2. **Strategy Consideration**: Given the buyer's pre-approval status and timeline, a more aggressive offer strategy may be warranted for properties that meet their criteria.

3. **Risk Assessment**: The main risks to watch for include appraisal gaps in competitive bidding situations and potential inspection issues with older properties.

This is for your reference only and will not be shared with the client.`,
  };

  return responses.default;
}

// Generate artifact content (mock)
function generateArtifactContent(command: string, buyerName: string): string {
  if (command.toLowerCase().includes("comp") || command.toLowerCase().includes("comparable")) {
    return `**Comparable Sales Analysis**

Hi ${buyerName.split(" ")[0]},

I've prepared an analysis of recent comparable sales for 123 Oak Street to help inform our offer strategy:

📊 **Market Overview**
• Median sale price (last 90 days): $485,000
• Average days on market: 18 days
• Price per sq ft range: $285-$315

📍 **Comparable Properties**
1. 145 Maple Ave - Sold $479,000 (15 days on market)
2. 89 Pine Street - Sold $492,000 (12 days on market)  
3. 201 Cedar Lane - Sold $468,000 (22 days on market)

💡 **Key Takeaway**
Based on these comps, a competitive offer range would be $475,000-$495,000.

Let me know if you have any questions about this analysis.`;
  }

  if (command.toLowerCase().includes("update") || command.toLowerCase().includes("draft")) {
    return `**Market Update for ${buyerName.split(" ")[0]}**

Great news! I've identified some new listings that match your search criteria:

🏠 **New Listings This Week**
• 456 Oak Drive - 4 bed/2.5 bath, $525,000
• 789 Elm Court - 3 bed/2 bath, $475,000

Both properties are in your preferred neighborhood and within budget. I recommend scheduling viewings soon as they're likely to receive strong interest.

Would you like to tour these properties this weekend?`;
  }

  return `**Update for ${buyerName.split(" ")[0]}**

I've prepared the following update based on our current transaction status:

${command}

This draft is ready for your review. You can edit before publishing or discard if not needed.`;
}

// Get recommended actions based on stage context (max 3 primary actions)
function getRecommendedActions(stage: Stage, buyerName: string): RecommendedAction[] {
  const firstName = buyerName.split(' ')[0];
  
  const baseActions: Record<Stage, RecommendedAction[]> = {
    0: [
      { id: "1", label: "Set buyer expectations", description: "", command: "Draft buyer introduction and set expectations for the home buying journey", icon: MessageSquare, type: "artifact" },
      { id: "2", label: "Confirm financing status", description: "", command: "Create task to confirm financing and pre-approval status", icon: FileText, type: "artifact" },
      { id: "3", label: "Explain market conditions", description: "", command: "Why is understanding market conditions important for buyers?", icon: Info, type: "thinking" },
    ],
    1: [
      { id: "1", label: `Draft update for ${firstName}`, description: "", command: `Draft buyer update about new listings matching ${buyerName}'s criteria`, icon: MessageSquare, type: "artifact" },
      { id: "2", label: "Generate property comps", description: "", command: "Generate comparable sales analysis for saved properties", icon: BarChart3, type: "artifact" },
      { id: "3", label: "Explain days on market", description: "", command: `Explain "days on market" concept to ${buyerName}`, icon: MessageSquare, type: "artifact" },
    ],
    2: [
      { id: "1", label: "Prepare offer strategy", description: "", command: "Prepare offer strategy summary for buyer review", icon: DollarSign, type: "artifact" },
      { id: "2", label: "Generate offer scenarios", description: "", command: "Generate offer scenarios with different price points", icon: BarChart3, type: "artifact" },
      { id: "3", label: "Explain contingencies", description: "", command: "Draft explanation of key contingencies for buyer", icon: MessageSquare, type: "artifact" },
    ],
    3: [
      { id: "1", label: "Inspection summary", description: "", command: "Draft inspection findings summary for buyer", icon: FileText, type: "artifact" },
      { id: "2", label: "Create repair request", description: "", command: "Generate repair request list based on inspection", icon: FileText, type: "artifact" },
      { id: "3", label: "Timeline update", description: "", command: "Create closing timeline update for buyer", icon: MessageSquare, type: "artifact" },
    ],
    4: [
      { id: "1", label: "Final walkthrough prep", description: "", command: "Generate final walkthrough checklist", icon: Home, type: "artifact" },
      { id: "2", label: "Closing cost breakdown", description: "", command: "Draft closing costs explanation for buyer", icon: DollarSign, type: "artifact" },
      { id: "3", label: "What to verify at closing?", description: "", command: "What should I verify before closing?", icon: Info, type: "thinking" },
    ],
    5: [
      { id: "1", label: "Post-closing resources", description: "", command: "Generate post-closing resources and next steps", icon: Home, type: "artifact" },
      { id: "2", label: "Request review", description: "", command: "Create task to request buyer review and referrals", icon: MessageSquare, type: "artifact" },
      { id: "3", label: "What's next for retention?", description: "", command: "What's the best approach for client retention?", icon: Info, type: "thinking" },
    ],
  };

  return baseActions[stage] || baseActions[1];
}
