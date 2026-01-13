import { useState, useRef } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Lock, 
  Edit3, 
  Send,
  Sparkles,
  Home,
  FileText,
  DollarSign,
  CheckSquare,
  User,
  Bot,
  MoreHorizontal,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Brain,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Zap,
  ChevronUp,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { 
  StageGroup, 
  ConversationItem, 
  HumanMessage, 
  AIExplanation, 
  SystemEvent, 
  ComponentBlock,
} from "@/types/conversation";
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
}

export function GuidedAgentGPT({
  stages,
  currentStage,
  buyerName,
  onExpandStage,
  onSendCommand,
  onApprove,
  onReject,
  onExpandBlock,
  onOpenDetails,
  onPrefillFromProgress,
}: GuidedAgentGPTProps) {
  const [commandInput, setCommandInput] = useState("");
  const [showFullJourney, setShowFullJourney] = useState(false);
  const [internalExplanationsCollapsed, setInternalExplanationsCollapsed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current stage info
  const currentStageData = STAGES[currentStage];
  const currentStageGroup = stages.find(s => s.stageId === currentStage);

  // Generate recommended actions based on stage and context
  const recommendedActions: RecommendedAction[] = getRecommendedActions(currentStage, buyerName);

  const handleSend = () => {
    if (commandInput.trim()) {
      onSendCommand(commandInput.trim());
      setCommandInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecommendationClick = (action: RecommendedAction) => {
    setCommandInput(action.command);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getStageIcon = (stageId: Stage) => {
    const icons = ["🎯", "🏠", "📝", "📋", "✅", "🎉"];
    return icons[stageId] || "📌";
  };

  // Filter stages for display
  const visibleStages = showFullJourney 
    ? stages 
    : stages.filter(s => s.status === "current");

  // Render individual conversation items
  const renderItem = (item: ConversationItem, stageTitle: string) => {
    switch (item.type) {
      case "human-message":
        return <HumanMessageBubble key={item.id} message={item} formatTime={formatTime} />;
      case "ai-explanation":
        return (
          <AIOutputBlock 
            key={item.id} 
            explanation={item} 
            stageTitle={stageTitle}
            formatTime={formatTime}
            onApprove={() => onApprove(item.id)}
            onReject={() => onReject(item.id)}
            isInternalCollapsed={internalExplanationsCollapsed.has(item.id)}
            onToggleCollapse={() => {
              const newSet = new Set(internalExplanationsCollapsed);
              if (newSet.has(item.id)) {
                newSet.delete(item.id);
              } else {
                newSet.add(item.id);
              }
              setInternalExplanationsCollapsed(newSet);
            }}
          />
        );
      case "system-event":
        return <SystemEventItem key={item.id} event={item} formatTime={formatTime} />;
      case "component-block":
        return (
          <ComponentBlockItem 
            key={item.id} 
            block={item} 
            stageTitle={stageTitle}
            onExpand={() => onExpandBlock(item.id)}
            onOpenDetails={onOpenDetails}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* System Guardrails Banner */}
      <Alert className="mx-6 mt-6 mb-4 border-muted bg-muted/30">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-xs text-muted-foreground">
          AgentGPT provides educational explanations. Licensed agents make final decisions.
        </AlertDescription>
      </Alert>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="py-4 max-w-3xl mx-auto">
          
          {/* Current Stage Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{getStageIcon(currentStage)}</span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Stage</p>
                <h2 className="text-xl font-semibold">{currentStageData.title}</h2>
              </div>
              <Badge className="ml-auto">Active</Badge>
            </div>
          </div>

          {/* Recommended Actions - Lemonade Style */}
          <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">What should happen next?</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2">
                {recommendedActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleRecommendationClick(action)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl text-left transition-all group",
                        "bg-background hover:bg-primary/5 border border-transparent hover:border-primary/20",
                        "hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        action.type === "artifact" 
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {action.label}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stage Record */}
          {currentStageGroup && currentStageGroup.items.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Stage Activity</h4>
                <Badge variant="secondary" className="text-[10px]">
                  {currentStageGroup.items.length} items
                </Badge>
              </div>
              <div className="space-y-4">
                {currentStageGroup.items.map((item) => 
                  renderItem(item, currentStageGroup.title)
                )}
              </div>
            </div>
          )}

          {/* View Full Journey Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullJourney(!showFullJourney)}
            className="w-full mb-4 text-muted-foreground hover:text-foreground"
          >
            {showFullJourney ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide full journey
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View full journey
              </>
            )}
          </Button>

          {/* Full Journey (Past/Future Stages) */}
          {showFullJourney && (
            <div className="space-y-3 mb-6">
              {stages.filter(s => s.status !== "current").map((stage) => (
                <StageGroupSection
                  key={stage.stageId}
                  stage={stage}
                  currentStage={currentStage}
                  onExpand={() => onExpandStage(stage.stageId)}
                  renderItem={(item) => renderItem(item, stage.title)}
                  getStageIcon={getStageIcon}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* AgentGPT Command Input - Spotlight Style */}
      <div className="border-t bg-card p-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Textarea
              placeholder="Tell AgentGPT what you want to do…"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-[56px] max-h-[140px] resize-none pr-28 text-base",
                "bg-background border-2 border-muted focus:border-primary/50",
                "rounded-2xl shadow-sm",
                "placeholder:text-muted-foreground/60"
              )}
              rows={1}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                title="Generate with AI"
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={!commandInput.trim()} 
                size="icon" 
                className="h-9 w-9 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Get recommended actions based on stage context
function getRecommendedActions(stage: Stage, buyerName: string): RecommendedAction[] {
  const baseActions: Record<Stage, RecommendedAction[]> = {
    0: [
      { id: "1", label: "Set buyer expectations", description: "Generate educational overview for buyer", command: "Draft buyer introduction and set expectations for the home buying journey", icon: MessageSquare, type: "artifact" },
      { id: "2", label: "Confirm financing status", description: "Request pre-approval documentation", command: "Create task to confirm financing and pre-approval status", icon: FileText, type: "artifact" },
      { id: "3", label: "Explain market conditions", description: "Educate buyer on current market", command: "Why is understanding market conditions important for buyers?", icon: Brain, type: "thinking" },
    ],
    1: [
      { id: "1", label: `Draft update for ${buyerName.split(' ')[0]}`, description: "Summarize new listing opportunities", command: `Draft buyer update about new listings matching ${buyerName}'s criteria`, icon: MessageSquare, type: "artifact" },
      { id: "2", label: "Generate property comps", description: "Compare properties under consideration", command: "Generate comparable sales analysis for saved properties", icon: BarChart3, type: "artifact" },
      { id: "3", label: "Explain days on market", description: "Educate buyer on DOM significance", command: `Explain "days on market" concept to ${buyerName}`, icon: Brain, type: "thinking" },
      { id: "4", label: "Schedule showings", description: "Coordinate property viewings", command: "Create task to schedule viewings for top properties", icon: Home, type: "artifact" },
    ],
    2: [
      { id: "1", label: "Prepare offer strategy", description: "Draft competitive offer approach", command: "Prepare offer strategy summary for buyer review", icon: DollarSign, type: "artifact" },
      { id: "2", label: "Generate offer scenarios", description: "Compare pricing strategies", command: "Generate offer scenarios with different price points", icon: BarChart3, type: "artifact" },
      { id: "3", label: "Explain contingencies", description: "Educate on offer protections", command: "What are the key contingencies buyers should consider?", icon: Brain, type: "thinking" },
    ],
    3: [
      { id: "1", label: "Inspection summary", description: "Explain inspection findings", command: "Draft inspection findings summary for buyer", icon: FileText, type: "artifact" },
      { id: "2", label: "Create repair request", description: "Prepare negotiation items", command: "Generate repair request list based on inspection", icon: CheckSquare, type: "artifact" },
      { id: "3", label: "Timeline update", description: "Confirm closing milestones", command: "Create closing timeline update for buyer", icon: MessageSquare, type: "artifact" },
    ],
    4: [
      { id: "1", label: "Final walkthrough prep", description: "Prepare walkthrough checklist", command: "Generate final walkthrough checklist", icon: CheckSquare, type: "artifact" },
      { id: "2", label: "Closing cost breakdown", description: "Explain buyer costs", command: "Draft closing costs explanation for buyer", icon: DollarSign, type: "artifact" },
    ],
    5: [
      { id: "1", label: "Post-closing resources", description: "Provide homeowner information", command: "Generate post-closing resources and next steps", icon: Home, type: "artifact" },
      { id: "2", label: "Request review", description: "Ask for testimonial", command: "Create task to request buyer review and referrals", icon: MessageSquare, type: "artifact" },
    ],
  };

  return baseActions[stage] || baseActions[1];
}

// Stage Group Section Component
function StageGroupSection({
  stage,
  currentStage,
  onExpand,
  renderItem,
  getStageIcon,
}: {
  stage: StageGroup;
  currentStage: Stage;
  onExpand: () => void;
  renderItem: (item: ConversationItem) => React.ReactNode;
  getStageIcon: (stageId: Stage) => string;
}) {
  const isLocked = stage.status === "locked";
  const isCompleted = stage.status === "completed";

  return (
    <Collapsible open={stage.isExpanded && !isLocked} onOpenChange={onExpand}>
      <CollapsibleTrigger asChild disabled={isLocked}>
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
            isCompleted && "bg-muted/30 hover:bg-muted/50 border border-transparent",
            isLocked && "opacity-50 cursor-not-allowed bg-muted/20 border border-dashed border-muted-foreground/20"
          )}
        >
          {isLocked ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : stage.isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}

          <span className="text-xl">{getStageIcon(stage.stageId)}</span>

          <div className="flex-1">
            <span className="font-medium text-sm">
              Stage {stage.stageId}: {stage.title}
            </span>
          </div>

          {isCompleted && (
            <Badge variant="outline" className="text-xs gap-1 bg-success/10 text-success border-success/20">
              <Check className="h-3 w-3" />
              Complete
            </Badge>
          )}
          {isLocked && (
            <Badge variant="secondary" className="text-xs">Locked</Badge>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-12 pr-3 py-3 space-y-4 border-l-2 border-muted ml-6 mt-1">
          {stage.items.map(renderItem)}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Human Message Bubble
function HumanMessageBubble({ 
  message, 
  formatTime 
}: { 
  message: HumanMessage; 
  formatTime: (d: Date) => string;
}) {
  const isBuyer = message.sender === "buyer";

  return (
    <div className={cn("flex gap-3", isBuyer ? "flex-row" : "flex-row-reverse")}>
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        isBuyer ? "bg-muted" : "bg-primary"
      )}>
        <User className={cn("h-4 w-4", isBuyer ? "text-muted-foreground" : "text-primary-foreground")} />
      </div>
      <div className={cn(
        "max-w-[75%] rounded-2xl px-4 py-2",
        isBuyer ? "bg-muted rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{message.senderName}</span>
          <span className={cn("text-[10px]", isBuyer ? "text-muted-foreground" : "text-primary-foreground/70")}>
            {formatTime(message.timestamp)}
          </span>
          {message.sender === "buyer" && (
            <Badge variant="outline" className="text-[8px] h-4 bg-muted/50">
              From Buyer Portal
            </Badge>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

// AI Output Block - Handles both Internal (thinking) and Artifacts (doing)
function AIOutputBlock({ 
  explanation, 
  stageTitle,
  formatTime,
  onApprove,
  onReject,
  isInternalCollapsed,
  onToggleCollapse,
}: { 
  explanation: AIExplanation; 
  stageTitle: string;
  formatTime: (d: Date) => string;
  onApprove: () => void;
  onReject: () => void;
  isInternalCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const isPending = explanation.approvalStatus === "pending";
  const isApproved = explanation.approvalStatus === "approved" && explanation.isVisibleToBuyer;
  
  // Determine if this is internal thinking or buyer-facing artifact
  // For now, check if content starts with thinking-style phrases
  const contentLower = explanation.content.toLowerCase();
  const isInternal = contentLower.startsWith("this is because") || 
                     contentLower.includes("the reason") ||
                     explanation.approvalStatus === undefined;

  // TYPE A: Internal Conversation (Thinking)
  if (isInternal) {
    return (
      <Collapsible open={!isInternalCollapsed} onOpenChange={onToggleCollapse}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-muted/20 transition-colors border-dashed">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  🧠 AgentGPT — Internal Explanation
                </span>
                <Badge variant="secondary" className="text-[8px] ml-auto">
                  Not visible to buyer
                </Badge>
                {isInternalCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-1 border-dashed bg-muted/10">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation.content}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-3">
                {formatTime(explanation.timestamp)}
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // TYPE B: AI-Generated Artifact (Doing)
  return (
    <Card className={cn(
      "overflow-hidden",
      isPending && "border-warning/30 shadow-sm",
      isApproved && "border-success/30"
    )}>
      <CardHeader className="p-3 pb-2 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">🤖 AI-Generated Buyer Artifact</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Generated by AgentGPT for Stage: {stageTitle}
              </p>
            </div>
          </div>
          
          {isPending && (
            <Badge className="text-[10px] bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
              Draft – Pending Approval
            </Badge>
          )}
          {isApproved && (
            <Badge className="text-[10px] bg-success/20 text-success border-success/30 hover:bg-success/30">
              Approved & Visible to Buyer
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <p className="text-sm leading-relaxed">{explanation.content}</p>
        
        {isPending && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 flex-1" onClick={onReject}>
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 flex-1" onClick={onApprove}>
              <CheckCircle className="h-3.5 w-3.5" />
              Approve & Publish
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              Discard
            </Button>
          </div>
        )}

        {isApproved && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            Published to Buyer Progress Portal • {explanation.approvedAt && formatTime(explanation.approvedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// System Event Item
function SystemEventItem({ 
  event, 
  formatTime 
}: { 
  event: SystemEvent; 
  formatTime: (d: Date) => string;
}) {
  const isStageAdvanced = event.eventType === "stage-advanced";

  if (isStageAdvanced) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-success/10 rounded-xl border border-success/20">
        <CheckCircle className="h-5 w-5 text-success" />
        <div className="flex-1">
          <span className="text-sm font-medium text-success">✅ Stage Advanced</span>
          {event.description && (
            <p className="text-xs text-success/80">{event.description}</p>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{formatTime(event.timestamp)}</span>
      </div>
    );
  }

  const getEventIcon = () => {
    switch (event.eventType) {
      case "offer-submitted": return "📤";
      case "offer-accepted": return "🎉";
      case "offer-rejected": return "❌";
      case "document-uploaded": return "📎";
      case "property-added": return "🏠";
      case "task-completed": return "✅";
      case "viewing-scheduled": return "📅";
      case "contract-signed": return "✍️";
      case "closing-complete": return "🔑";
      default: return "📌";
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-muted/30 rounded-lg border border-dashed">
      <span className="text-base">{getEventIcon()}</span>
      <div className="flex-1">
        <span className="text-sm font-medium">{event.title}</span>
        {event.description && (
          <p className="text-xs text-muted-foreground">{event.description}</p>
        )}
      </div>
      <Badge variant="outline" className="text-[9px] uppercase tracking-wide">
        System
      </Badge>
      <span className="text-[10px] text-muted-foreground">{formatTime(event.timestamp)}</span>
    </div>
  );
}

// Component Block Item
function ComponentBlockItem({ 
  block, 
  stageTitle,
  onExpand,
  onOpenDetails,
}: { 
  block: ComponentBlock;
  stageTitle: string;
  onExpand: () => void;
  onOpenDetails: () => void;
}) {
  const getBlockIcon = () => {
    switch (block.blockType) {
      case "property-card": return <Home className="h-4 w-4" />;
      case "comp-table": return <BarChart3 className="h-4 w-4" />;
      case "offer-summary": return <DollarSign className="h-4 w-4" />;
      case "task-checklist": return <CheckSquare className="h-4 w-4" />;
      case "document-preview": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const renderBlockContent = () => {
    const data = block.data as any;
    
    switch (block.blockType) {
      case "property-card":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Price:</span> ${data.price?.toLocaleString()}</div>
            <div><span className="text-muted-foreground">Bed/Bath:</span> {data.bedrooms}/{data.bathrooms}</div>
            <div><span className="text-muted-foreground">Sqft:</span> {data.sqft?.toLocaleString()}</div>
            <div><span className="text-muted-foreground">DOM:</span> {data.daysOnMarket} days</div>
          </div>
        );
      case "comp-table":
        return (
          <div className="space-y-1 text-sm">
            {data.comps?.map((comp: any, i: number) => (
              <div key={i} className="flex justify-between py-1 border-b border-dashed last:border-0">
                <span>{comp.address}</span>
                <span className="font-medium">${comp.soldPrice?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        );
      case "offer-summary":
        return (
          <div className="space-y-2">
            {data.scenarios?.map((scenario: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <span className="font-medium">{scenario.name}</span>
                  <p className="text-xs text-muted-foreground">{scenario.note}</p>
                </div>
                <span className="font-bold">${scenario.price?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        );
      case "task-checklist":
        return (
          <div className="space-y-1">
            {data.tasks?.map((task: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {task.completed ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-4 w-4 rounded border" />
                )}
                <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                  {task.name}
                </span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 pb-2 bg-muted/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium flex items-center gap-2">
              {getBlockIcon()}
              {block.title}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Generated by AgentGPT for Stage: {stageTitle}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs gap-1"
              onClick={onOpenDetails}
            >
              View Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Approve & Publish
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive gap-2">
                  <Trash2 className="h-3.5 w-3.5" />
                  Discard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
}