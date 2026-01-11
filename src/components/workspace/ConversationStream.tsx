import { useState, useRef, useEffect } from "react";
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
  Settings,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ApprovalAction,
  Annotation 
} from "@/types/conversation";
import type { Stage } from "@/types";
import { STAGES } from "@/types";

interface ConversationStreamProps {
  stages: StageGroup[];
  currentStage: Stage;
  onExpandStage: (stageId: Stage) => void;
  onSendMessage: (content: string) => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onExpandBlock: (itemId: string) => void;
  onOpenDeepView: (view: "timeline" | "properties" | "offers" | "tasks") => void;
}

export function ConversationStream({
  stages,
  currentStage,
  onExpandStage,
  onSendMessage,
  onApprove,
  onReject,
  onExpandBlock,
  onOpenDeepView,
}: ConversationStreamProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput("");
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
  const renderItem = (item: ConversationItem) => {
    switch (item.type) {
      case "human-message":
        return <HumanMessageBubble key={item.id} message={item} formatTime={formatTime} />;
      case "ai-explanation":
        return (
          <AIExplanationBubble 
            key={item.id} 
            explanation={item} 
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
      {/* Conversation Stream */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-2">
          {stages.map((stage) => (
            <StageGroupSection
              key={stage.stageId}
              stage={stage}
              currentStage={currentStage}
              onExpand={() => onExpandStage(stage.stageId)}
              renderItem={renderItem}
              getStageIcon={getStageIcon}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type a message or ask the AI for help..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[44px] max-h-[120px] resize-none pr-24"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsGeneratingAI(true)}
                title="Generate AI Response"
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
                  <DropdownMenuItem className="gap-2" onClick={() => onOpenDeepView("offers")}>
                    <DollarSign className="h-4 w-4" />
                    Create Offer
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
          <Button onClick={handleSend} disabled={!messageInput.trim()} size="icon" className="h-[44px] w-[44px]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
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
            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
            isCurrent && "bg-primary/10 border border-primary/20",
            isCompleted && "hover:bg-muted/50",
            isLocked && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* Expand/Collapse Icon */}
          {isLocked ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : stage.isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}

          {/* Stage Icon */}
          <span className="text-lg">{getStageIcon(stage.stageId)}</span>

          {/* Stage Title */}
          <span className={cn(
            "font-medium flex-1",
            isCurrent && "text-primary"
          )}>
            Stage {stage.stageId}: {stage.title}
          </span>

          {/* Status Badge */}
          {isCompleted && (
            <Badge variant="outline" className="text-xs gap-1 bg-success/10 text-success border-success/20">
              <Check className="h-3 w-3" />
              Complete
            </Badge>
          )}
          {isCurrent && (
            <Badge className="text-xs">Current</Badge>
          )}
          {isLocked && (
            <Badge variant="secondary" className="text-xs">Locked</Badge>
          )}

          {/* Item Count */}
          {!isLocked && stage.items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {stage.items.length} items
            </span>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-8 pr-2 py-2 space-y-3">
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
          {!message.isImmutable && (
            <Edit3 className="h-3 w-3 opacity-50" />
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

// AI Explanation Bubble
function AIExplanationBubble({ 
  explanation, 
  formatTime,
  onApprove,
  onReject,
}: { 
  explanation: AIExplanation; 
  formatTime: (d: Date) => string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = explanation.approvalStatus === "pending";

  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-primary/60">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className={cn(
        "flex-1 max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3",
        "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            AI Explanation
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatTime(explanation.timestamp)}
          </span>
          {isPending && (
            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              Pending Approval
            </Badge>
          )}
          {explanation.approvalStatus === "approved" && explanation.isVisibleToBuyer && (
            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">
              Sent to Buyer
            </Badge>
          )}
        </div>
        <p className="text-sm leading-relaxed">{explanation.content}</p>
        
        {isPending && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-primary/10">
            <Button size="sm" className="h-7 text-xs gap-1 flex-1" onClick={onApprove}>
              <CheckCircle className="h-3 w-3" />
              Approve & Send
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onReject}>
              <XCircle className="h-3 w-3" />
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
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
      <span className="text-[10px] text-muted-foreground">{formatTime(event.timestamp)}</span>
    </div>
  );
}

// Component Block Item
function ComponentBlockItem({ 
  block, 
  onExpand,
  onOpenDeepView,
}: { 
  block: ComponentBlock;
  onExpand: () => void;
  onOpenDeepView: (view: "timeline" | "properties" | "offers" | "tasks") => void;
}) {
  const getBlockIcon = () => {
    switch (block.blockType) {
      case "property-card": return <Home className="h-4 w-4" />;
      case "comp-table": return <DollarSign className="h-4 w-4" />;
      case "offer-summary": return <FileText className="h-4 w-4" />;
      case "task-checklist": return <CheckSquare className="h-4 w-4" />;
      case "document-preview": return <FileText className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
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
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getBlockIcon()}
            {block.title}
          </CardTitle>
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
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Share with Buyer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
}
