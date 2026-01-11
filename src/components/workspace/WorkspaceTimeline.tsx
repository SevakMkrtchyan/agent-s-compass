import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Home,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Bot,
  AlertCircle,
  Filter,
  FileCheck,
  Send,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WorkspaceTimelineProps {
  buyer: Buyer;
}

interface TimelineEvent {
  id: string;
  type: "task" | "document" | "offer" | "message" | "stage" | "property" | "ai-draft" | "approval";
  title: string;
  description?: string;
  timestamp: Date;
  stage: number;
  actor: "agent" | "buyer" | "ai" | "system";
  status?: "completed" | "pending" | "in-progress" | "approved" | "rejected";
}

// Mock timeline events - workflow-focused
const mockTimelineEvents: TimelineEvent[] = [
  { id: "1", type: "stage", title: "Workspace created", timestamp: new Date("2024-01-10T09:00:00"), stage: 0, actor: "system", status: "completed" },
  { id: "2", type: "document", title: "Pre-approval letter uploaded", description: "First National Bank - $500K limit", timestamp: new Date("2024-01-11T10:30:00"), stage: 0, actor: "buyer", status: "completed" },
  { id: "3", type: "task", title: "Buyer criteria confirmed", description: "$400-500K, 3+ bed, suburban", timestamp: new Date("2024-01-11T14:00:00"), stage: 0, actor: "agent", status: "completed" },
  { id: "4", type: "stage", title: "Advanced to Home Search", timestamp: new Date("2024-01-12T09:00:00"), stage: 1, actor: "system", status: "completed" },
  { id: "5", type: "property", title: "123 Oak Street added", description: "$425,000 - 4 bed, 2.5 bath", timestamp: new Date("2024-01-13T11:00:00"), stage: 1, actor: "agent", status: "completed" },
  { id: "6", type: "property", title: "456 Maple Avenue added", description: "$398,000 - 3 bed, 2 bath", timestamp: new Date("2024-01-13T11:15:00"), stage: 1, actor: "agent", status: "completed" },
  { id: "7", type: "ai-draft", title: "Property comparison email", description: "Draft awaiting approval", timestamp: new Date("2024-01-14T09:00:00"), stage: 1, actor: "ai", status: "pending" },
  { id: "8", type: "message", title: "Buyer message received", description: "Requested weekend showing", timestamp: new Date("2024-01-14T16:30:00"), stage: 1, actor: "buyer", status: "completed" },
  { id: "9", type: "task", title: "Property tours scheduled", description: "Saturday 2-5pm confirmed", timestamp: new Date("2024-01-15T10:00:00"), stage: 1, actor: "agent", status: "completed" },
  { id: "10", type: "ai-draft", title: "Follow-up SMS draft", description: "Tour reminder for Saturday", timestamp: new Date("2024-01-15T14:00:00"), stage: 1, actor: "ai", status: "pending" },
  { id: "11", type: "document", title: "MLS listing sheet", description: "123 Oak Street details", timestamp: new Date("2024-01-15T15:00:00"), stage: 1, actor: "agent", status: "completed" },
];

type FilterType = "all" | "tasks" | "documents" | "ai" | "messages";

export function WorkspaceTimeline({ buyer }: WorkspaceTimelineProps) {
  const [expandedStages, setExpandedStages] = useState<number[]>([buyer.currentStage]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const toggleStage = (stage: number) => {
    setExpandedStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "task": return FileCheck;
      case "document": return FileText;
      case "offer": return DollarSign;
      case "message": return MessageSquare;
      case "stage": return CheckCircle2;
      case "property": return Home;
      case "ai-draft": return Bot;
      case "approval": return CheckCircle2;
      default: return Circle;
    }
  };

  const getActorBadge = (actor: TimelineEvent["actor"]) => {
    switch (actor) {
      case "agent": return <Badge variant="outline" className="text-[10px]">Agent</Badge>;
      case "buyer": return <Badge variant="secondary" className="text-[10px]">Buyer</Badge>;
      case "ai": return <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">AI</Badge>;
      case "system": return null;
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

  // Filter events based on active filter
  const filterEvents = (events: TimelineEvent[]) => {
    if (activeFilter === "all") return events;
    if (activeFilter === "tasks") return events.filter(e => e.type === "task");
    if (activeFilter === "documents") return events.filter(e => e.type === "document");
    if (activeFilter === "ai") return events.filter(e => e.type === "ai-draft" || e.type === "approval");
    if (activeFilter === "messages") return events.filter(e => e.type === "message");
    return events;
  };

  // Group events by stage
  const eventsByStage = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    mockTimelineEvents.forEach(event => {
      if (!grouped[event.stage]) grouped[event.stage] = [];
      grouped[event.stage].push(event);
    });
    return grouped;
  }, []);

  // Count pending items
  const pendingCount = useMemo(() => {
    return mockTimelineEvents.filter(e => e.status === "pending").length;
  }, []);

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      {/* Left: Stage Rail - Minimal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Stages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-0.5">
            {STAGES.map((stage, index) => {
              const isCompleted = index < buyer.currentStage;
              const isCurrent = index === buyer.currentStage;
              const isLocked = index > buyer.currentStage;
              const eventCount = eventsByStage[index]?.length || 0;

              return (
                <button
                  key={stage.stage}
                  onClick={() => !isLocked && toggleStage(index)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                    isCurrent && "bg-primary/10",
                    !isCurrent && !isLocked && "hover:bg-muted",
                    isLocked && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {/* Status indicator */}
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 border-2",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isLocked && "border-muted-foreground/30 bg-transparent text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="text-[10px] font-medium">{index}</span>
                    )}
                  </div>
                  
                  {/* Stage name only */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isCurrent && "text-primary",
                      isLocked && "text-muted-foreground"
                    )}>
                      {stage.title}
                    </p>
                  </div>
                  
                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right: Workflow Timeline */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Workflow Timeline
              </CardTitle>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            
            {/* Filter tabs */}
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              {(["all", "tasks", "documents", "ai", "messages"] as FilterType[]).map((filter) => (
                <Badge 
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"} 
                  className={cn(
                    "text-xs cursor-pointer capitalize",
                    activeFilter !== filter && "hover:bg-muted"
                  )}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter === "ai" ? "AI Drafts" : filter}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-[620px]">
            <div className="p-4 space-y-3">
              {STAGES.slice(0, buyer.currentStage + 1).reverse().map((stage) => {
                const stageEvents = filterEvents(eventsByStage[stage.stage] || []);
                const isExpanded = expandedStages.includes(stage.stage);
                const isCurrent = stage.stage === buyer.currentStage;
                const pendingInStage = stageEvents.filter(e => e.status === "pending").length;

                if (stageEvents.length === 0 && activeFilter !== "all") return null;

                return (
                  <Collapsible 
                    key={stage.stage} 
                    open={isExpanded}
                    onOpenChange={() => toggleStage(stage.stage)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isCurrent ? "bg-primary/5 border border-primary/20" : "bg-muted/30 hover:bg-muted/50"
                      )}>
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-xs flex-shrink-0",
                          isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {stage.stage < buyer.currentStage ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            stage.stage
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{stage.title}</p>
                            {isCurrent && <Badge className="text-[10px] h-4">Active</Badge>}
                            {pendingInStage > 0 && (
                              <Badge variant="outline" className="text-[10px] h-4 border-yellow-500/50 text-yellow-600">
                                {pendingInStage} pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{stageEvents.length} events</p>
                        </div>
                        {isExpanded 
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="ml-5 mt-2 space-y-1 border-l-2 border-muted pl-4 pb-2">
                        {stageEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((event) => {
                          const Icon = getEventIcon(event.type);
                          const isPending = event.status === "pending";
                          const isAIDraft = event.type === "ai-draft";
                          
                          return (
                            <div 
                              key={event.id} 
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                isPending ? "bg-yellow-500/5 border border-yellow-500/20" : "hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                event.status === "completed" && "bg-primary/10 text-primary",
                                isPending && "bg-yellow-500/10 text-yellow-600",
                                event.status === "in-progress" && "bg-blue-500/10 text-blue-600",
                                !event.status && "bg-muted text-muted-foreground"
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  {getActorBadge(event.actor)}
                                  {isPending && (
                                    <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-600">
                                      <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(event.timestamp)}
                                </p>
                              </div>
                              
                              {/* Actions for AI drafts */}
                              {isAIDraft && isPending && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button size="sm" variant="default" className="h-7 text-xs px-2.5 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Actions for documents */}
                              {event.type === "document" && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 flex-shrink-0">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
