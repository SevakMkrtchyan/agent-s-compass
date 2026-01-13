import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Edit3,
  FileText,
  Home,
  Lightbulb,
  Send,
  Sparkles,
  Trash2,
  Zap,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      {/* System Guardrails Banner */}
      <div className="px-6 pt-4">
        <Alert className="border-muted bg-muted/30 py-2">
          <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
          <AlertDescription className="text-xs text-muted-foreground">
            AgentGPT provides educational explanations. Licensed agents make final decisions.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content - Centered Decision Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl space-y-6">
          
          {/* STATE A: Guided Mode - Recommended Actions */}
          {mode === "guided" && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-transparent shadow-lg">
              <CardHeader className="pb-4 pt-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold">AgentGPT</h2>
                <p className="text-sm text-muted-foreground">
                  Here's what I recommend next for this transaction.
                </p>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="space-y-2">
                  {recommendedActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleRecommendationClick(action)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all group",
                          "bg-background/80 hover:bg-primary/5 border border-transparent hover:border-primary/20",
                          "hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          action.type === "artifact" 
                            ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {action.label}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    What should happen next?
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE B: Artifact Mode - Single Structured Card */}
          {mode === "artifact" && pendingArtifact && (
            <Card className="border-2 border-warning/30 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-warning/10 via-background to-transparent pb-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">🤖 AI-Generated Client Artifact</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Drafted for Stage: {pendingArtifact.stageTitle}
                    </p>
                  </div>
                  <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                    Draft – Pending Approval
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <div className="bg-muted/30 rounded-xl p-4 mb-6">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {pendingArtifact.content}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 h-11"
                    onClick={() => {/* Would open edit modal */}}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    className="flex-1 gap-2 h-11"
                    onClick={handleApproveArtifact}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Publish
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="gap-2 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDiscardArtifact}
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE C: Thinking Mode - Internal Explanation */}
          {mode === "thinking" && thinkingResponse && (
            <Card className="border-2 border-dashed border-muted shadow-lg overflow-hidden">
              <CardHeader className="bg-muted/20 pb-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">🧠 AgentGPT — Internal Explanation</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Agent-only • Not visible to client
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Internal Only
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <div className="bg-background rounded-xl p-4 mb-6 border">
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {thinkingResponse.content}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full gap-2 h-11"
                  onClick={handleDismissThinking}
                >
                  <ArrowRight className="h-4 w-4" />
                  Continue to Next Action
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Command Input - Always Visible */}
          <div className="relative">
            <Textarea
              placeholder="Tell AgentGPT what you want to do…"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-[64px] max-h-[140px] resize-none pr-14 text-base",
                "bg-background border-2 border-muted focus:border-primary/50",
                "rounded-2xl shadow-sm",
                "placeholder:text-muted-foreground/60"
              )}
              rows={1}
            />
            <Button 
              onClick={handleSend} 
              disabled={!commandInput.trim()} 
              size="icon" 
              className="absolute right-3 bottom-3 h-10 w-10 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Context Layer - Collapsed by Default */}
      <div className="border-t bg-card/50">
        <div className="max-w-2xl mx-auto px-6">
          {/* Transaction Summary */}
          <Collapsible open={contextExpanded} onOpenChange={setContextExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Transaction Summary</span>
                  <Badge variant="outline" className="text-[10px] ml-1">
                    Stage {currentStage} · {currentStageData.title}
                  </Badge>
                </span>
                {contextExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pb-4 space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl">{currentStageData.icon}</div>
                  <div>
                    <p className="text-sm font-medium">Stage {currentStage}: {currentStageData.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Working with {buyerName}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={onOpenDetails}
                >
                  <FileText className="h-4 w-4" />
                  View full details
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Activity Log */}
          <Collapsible open={activityLogOpen} onOpenChange={setActivityLogOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-3 border-t text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>View recent activity</span>
                  {activityLog.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {activityLog.length}
                    </Badge>
                  )}
                </span>
                {activityLogOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pb-4 space-y-1">
                {activityLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No recent activity</p>
                ) : (
                  activityLog.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <span className="text-xs flex-1">
                        {item.type === "system-event" ? item.title : "Approved artifact"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
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

// Get recommended actions based on stage context
function getRecommendedActions(stage: Stage, buyerName: string): RecommendedAction[] {
  const baseActions: Record<Stage, RecommendedAction[]> = {
    0: [
      { id: "1", label: "Set buyer expectations", description: "Generate educational overview for buyer", command: "Draft buyer introduction and set expectations for the home buying journey", icon: MessageSquare, type: "artifact" },
      { id: "2", label: "Confirm financing status", description: "Request pre-approval documentation", command: "Create task to confirm financing and pre-approval status", icon: FileText, type: "artifact" },
      { id: "3", label: "Explain market conditions", description: "Educate buyer on current market", command: "Why is understanding market conditions important for buyers?", icon: Brain, type: "thinking" },
      { id: "4", label: "What should I watch for?", description: "Internal guidance on buyer readiness", command: "What should I watch for when onboarding a new buyer?", icon: Brain, type: "thinking" },
    ],
    1: [
      { id: "1", label: `Draft update for ${buyerName.split(' ')[0]}`, description: "Summarize new listing opportunities", command: `Draft buyer update about new listings matching ${buyerName}'s criteria`, icon: MessageSquare, type: "artifact" },
      { id: "2", label: "Generate property comps", description: "Compare properties under consideration", command: "Generate comparable sales analysis for saved properties", icon: BarChart3, type: "artifact" },
      { id: "3", label: "Explain days on market", description: "Educate buyer on DOM significance", command: `Explain "days on market" concept to ${buyerName}`, icon: MessageSquare, type: "artifact" },
      { id: "4", label: "What are the risks?", description: "Internal risk assessment", command: "What are the risks I should consider for this buyer's search?", icon: Brain, type: "thinking" },
    ],
    2: [
      { id: "1", label: "Prepare offer strategy", description: "Draft competitive offer approach", command: "Prepare offer strategy summary for buyer review", icon: DollarSign, type: "artifact" },
      { id: "2", label: "Generate offer scenarios", description: "Compare pricing strategies", command: "Generate offer scenarios with different price points", icon: BarChart3, type: "artifact" },
      { id: "3", label: "Explain contingencies", description: "Educate on offer protections", command: "Draft explanation of key contingencies for buyer", icon: MessageSquare, type: "artifact" },
      { id: "4", label: "Why is escalation risky?", description: "Internal strategy guidance", command: "Why is an escalation clause risky in this market?", icon: Brain, type: "thinking" },
    ],
    3: [
      { id: "1", label: "Inspection summary", description: "Explain inspection findings", command: "Draft inspection findings summary for buyer", icon: FileText, type: "artifact" },
      { id: "2", label: "Create repair request", description: "Prepare negotiation items", command: "Generate repair request list based on inspection", icon: FileText, type: "artifact" },
      { id: "3", label: "Timeline update", description: "Confirm closing milestones", command: "Create closing timeline update for buyer", icon: MessageSquare, type: "artifact" },
      { id: "4", label: "What are common issues?", description: "Internal inspection guidance", command: "What are common inspection issues I should watch for?", icon: Brain, type: "thinking" },
    ],
    4: [
      { id: "1", label: "Final walkthrough prep", description: "Prepare walkthrough checklist", command: "Generate final walkthrough checklist", icon: Home, type: "artifact" },
      { id: "2", label: "Closing cost breakdown", description: "Explain buyer costs", command: "Draft closing costs explanation for buyer", icon: DollarSign, type: "artifact" },
      { id: "3", label: "What to verify at closing?", description: "Internal closing guidance", command: "What should I verify before closing?", icon: Brain, type: "thinking" },
    ],
    5: [
      { id: "1", label: "Post-closing resources", description: "Provide homeowner information", command: "Generate post-closing resources and next steps", icon: Home, type: "artifact" },
      { id: "2", label: "Request review", description: "Ask for testimonial", command: "Create task to request buyer review and referrals", icon: MessageSquare, type: "artifact" },
      { id: "3", label: "What's next for retention?", description: "Internal follow-up guidance", command: "What's the best approach for client retention?", icon: Brain, type: "thinking" },
    ],
  };

  return baseActions[stage] || baseActions[1];
}
