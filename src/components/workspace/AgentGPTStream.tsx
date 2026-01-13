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
  XCircle,
  Plus,
  BarChart3,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AgentGPTStreamProps {
  stages: StageGroup[];
  currentStage: Stage;
  onExpandStage: (stageId: Stage) => void;
  onSendMessage: (content: string) => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onExpandBlock: (itemId: string) => void;
  onOpenDeepView: (view: "timeline" | "properties" | "offers" | "tasks") => void;
}

export function AgentGPTStream({
  stages,
  currentStage,
  onExpandStage,
  onSendMessage,
  onApprove,
  onReject,
  onExpandBlock,
  onOpenDeepView,
}: AgentGPTStreamProps) {
  const [commandInput, setCommandInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (commandInput.trim()) {
      onSendMessage(commandInput.trim());
      setCommandInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  // Render individual conversation items
  const renderItem = (item: ConversationItem, stageTitle: string) => {
    switch (item.type) {
      case "human-message":
        return <HumanMessageBubble key={item.id} message={item} formatTime={formatTime} />;
      case "ai-explanation":
        return (
          <AIArtifactBlock 
            key={item.id} 
            explanation={item} 
            stageTitle={stageTitle}
            formatTime={formatTime}
            onApprove={() => onApprove(item.id)}
            onReject={() => onReject(item.id)}
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
            onOpenDeepView={onOpenDeepView}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* System Guardrails Banner */}
      <Alert className="mx-4 mt-4 mb-2 border-primary/20 bg-primary/5">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs text-muted-foreground">
          AgentGPT provides educational explanations. Licensed agents make final decisions.
        </AlertDescription>
      </Alert>

      {/* Stage-Grouped Workspace Record */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-3">
          {stages.map((stage) => (
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
      </ScrollArea>

      {/* AgentGPT Command Input */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Tell AgentGPT what you want to do…"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[52px] max-h-[120px] resize-none pr-24 bg-background"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Generate with AI"
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2" onClick={() => onOpenDeepView("properties")}>
                    <Home className="h-4 w-4" />
                    Add Property
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => onOpenDeepView("properties")}>
                    <BarChart3 className="h-4 w-4" />
                    Generate Comps
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => onOpenDeepView("offers")}>
                    <DollarSign className="h-4 w-4" />
                    Create Offer Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => onOpenDeepView("tasks")}>
                    <FileText className="h-4 w-4" />
                    Upload Document
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => onOpenDeepView("timeline")}>
                    <CheckSquare className="h-4 w-4" />
                    View Timeline
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button onClick={handleSend} disabled={!commandInput.trim()} size="icon" className="h-[52px] w-[52px]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 px-1">
          AgentGPT drafts buyer-facing updates, explanations, and next steps for approval.
        </p>
      </div>
    </div>
  );
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
  const isCurrent = stage.status === "current";
  const isCompleted = stage.status === "completed";

  return (
    <Collapsible open={stage.isExpanded && !isLocked} onOpenChange={onExpand}>
      <CollapsibleTrigger asChild disabled={isLocked}>
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
            isCurrent && "bg-primary/10 border-2 border-primary/30 shadow-sm",
            isCompleted && "bg-muted/30 hover:bg-muted/50 border border-transparent",
            isLocked && "opacity-50 cursor-not-allowed bg-muted/20 border border-dashed border-muted-foreground/20"
          )}
        >
          {/* Expand/Collapse Icon */}
          {isLocked ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : stage.isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}

          {/* Stage Icon */}
          <span className="text-xl">{getStageIcon(stage.stageId)}</span>

          {/* Stage Title - Strong Visual Hierarchy */}
          <div className="flex-1">
            <span className={cn(
              "font-semibold text-base",
              isCurrent && "text-primary"
            )}>
              Stage {stage.stageId}: {stage.title}
            </span>
            {stage.startedAt && (
              <p className="text-xs text-muted-foreground">
                {stage.completedAt 
                  ? `Completed ${formatDate(stage.completedAt)}`
                  : `Started ${formatDate(stage.startedAt)}`
                }
              </p>
            )}
          </div>

          {/* Status Badge */}
          {isCompleted && (
            <Badge variant="outline" className="text-xs gap-1 bg-success/10 text-success border-success/20">
              <Check className="h-3 w-3" />
              Complete
            </Badge>
          )}
          {isCurrent && (
            <Badge className="text-xs font-medium">Active</Badge>
          )}
          {isLocked && (
            <Badge variant="secondary" className="text-xs">Locked</Badge>
          )}

          {/* Item Count */}
          {!isLocked && stage.items.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {stage.items.length}
            </span>
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
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
          {!message.isImmutable && (
            <Edit3 className="h-3 w-3 opacity-50" />
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

// AI Artifact Block - Updated with proper labeling
function AIArtifactBlock({ 
  explanation, 
  stageTitle,
  formatTime,
  onApprove,
  onReject,
}: { 
  explanation: AIExplanation; 
  stageTitle: string;
  formatTime: (d: Date) => string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = explanation.approvalStatus === "pending";
  const isApproved = explanation.approvalStatus === "approved" && explanation.isVisibleToBuyer;

  return (
    <Card className={cn(
      "overflow-hidden",
      isPending && "border-yellow-500/30 shadow-sm",
      isApproved && "border-success/30"
    )}>
      {/* Artifact Header */}
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
          
          {/* Status Badge */}
          {isPending && (
            <Badge className="text-[10px] bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30">
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
        
        {/* Action Buttons */}
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
  const getEventIcon = () => {
    switch (event.eventType) {
      case "stage-advanced": return "🚀";
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

// Component Block Item - Updated with artifact labeling
function ComponentBlockItem({ 
  block, 
  stageTitle,
  onExpand,
  onOpenDeepView,
}: { 
  block: ComponentBlock;
  stageTitle: string;
  onExpand: () => void;
  onOpenDeepView: (view: "timeline" | "properties" | "offers" | "tasks") => void;
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

  const getDeepView = (): "properties" | "offers" | "tasks" | "timeline" => {
    switch (block.blockType) {
      case "property-card":
      case "comp-table":
        return "properties";
      case "offer-summary":
        return "offers";
      case "task-checklist":
      case "document-preview":
        return "tasks";
      default:
        return "timeline";
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
            <CardTitle className="text-sm flex items-center gap-2">
              {getBlockIcon()}
              {block.title}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Generated by AgentGPT for Stage: {stageTitle}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs gap-1"
              onClick={() => onOpenDeepView(getDeepView())}
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
