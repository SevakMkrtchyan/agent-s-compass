import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Home,
  DollarSign,
  MessageSquare,
  User,
  Bot,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WorkspaceTimelineProps {
  buyer: Buyer;
}

interface TimelineEvent {
  id: string;
  type: "task" | "document" | "offer" | "message" | "stage" | "property";
  title: string;
  description?: string;
  timestamp: Date;
  stage: number;
  actor: "agent" | "buyer" | "ai" | "system";
  status?: "completed" | "pending" | "in-progress";
}

// Mock timeline events
const mockTimelineEvents: TimelineEvent[] = [
  { id: "1", type: "stage", title: "Started Stage 0: Pre-Approval", timestamp: new Date("2024-01-10"), stage: 0, actor: "system" },
  { id: "2", type: "document", title: "Pre-approval letter uploaded", timestamp: new Date("2024-01-11"), stage: 0, actor: "buyer", status: "completed" },
  { id: "3", type: "task", title: "Review buyer criteria", description: "Confirmed budget and location preferences", timestamp: new Date("2024-01-11"), stage: 0, actor: "agent", status: "completed" },
  { id: "4", type: "stage", title: "Advanced to Stage 1: Property Search", timestamp: new Date("2024-01-12"), stage: 1, actor: "system" },
  { id: "5", type: "property", title: "Added 123 Oak Street to workspace", timestamp: new Date("2024-01-13"), stage: 1, actor: "agent" },
  { id: "6", type: "property", title: "Added 456 Maple Avenue to workspace", timestamp: new Date("2024-01-13"), stage: 1, actor: "agent" },
  { id: "7", type: "message", title: "AI draft: Property comparison email", description: "Pending approval", timestamp: new Date("2024-01-14"), stage: 1, actor: "ai", status: "pending" },
  { id: "8", type: "task", title: "Schedule property tours", description: "Weekend showing confirmed", timestamp: new Date("2024-01-15"), stage: 1, actor: "agent", status: "completed" },
];

export function WorkspaceTimeline({ buyer }: WorkspaceTimelineProps) {
  const [expandedStages, setExpandedStages] = useState<number[]>([buyer.currentStage]);

  const toggleStage = (stage: number) => {
    setExpandedStages(prev => 
      prev.includes(stage) 
        ? prev.filter(s => s !== stage) 
        : [...prev, stage]
    );
  };

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "task": return FileText;
      case "document": return FileText;
      case "offer": return DollarSign;
      case "message": return MessageSquare;
      case "stage": return CheckCircle2;
      case "property": return Home;
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

  // Group events by stage
  const eventsByStage = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    mockTimelineEvents.forEach(event => {
      if (!grouped[event.stage]) grouped[event.stage] = [];
      grouped[event.stage].push(event);
    });
    return grouped;
  }, []);

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      {/* Stage Stepper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Journey Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {STAGES.map((stage, index) => {
              const isCompleted = index < buyer.currentStage;
              const isCurrent = index === buyer.currentStage;
              const isLocked = index > buyer.currentStage;
              const hasEvents = eventsByStage[index]?.length > 0;

              return (
                <button
                  key={stage.stage}
                  onClick={() => !isLocked && hasEvents && toggleStage(index)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    isCurrent && "bg-primary/10 border border-primary/30",
                    isCompleted && "hover:bg-muted",
                    isLocked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    isLocked && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stage.stage}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isLocked && "text-muted-foreground"
                    )}>
                      {stage.title}
                    </p>
                    {hasEvents && !isLocked && (
                      <p className="text-xs text-muted-foreground">
                        {eventsByStage[index].length} events
                      </p>
                    )}
                  </div>
                  {hasEvents && !isLocked && (
                    expandedStages.includes(index) 
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">All Activity</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {STAGES.slice(0, buyer.currentStage + 1).reverse().map((stage) => {
                const stageEvents = eventsByStage[stage.stage] || [];
                const isExpanded = expandedStages.includes(stage.stage);

                return (
                  <Collapsible 
                    key={stage.stage} 
                    open={isExpanded}
                    onOpenChange={() => toggleStage(stage.stage)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-xl">{stage.icon}</span>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">Stage {stage.stage}: {stage.title}</p>
                          <p className="text-xs text-muted-foreground">{stageEvents.length} events</p>
                        </div>
                        {isExpanded 
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-2 space-y-2 border-l-2 border-muted pl-4">
                        {stageEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((event) => {
                          const Icon = getEventIcon(event.type);
                          return (
                            <div 
                              key={event.id} 
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                event.status === "completed" && "bg-primary/10 text-primary",
                                event.status === "pending" && "bg-yellow-500/10 text-yellow-600",
                                !event.status && "bg-muted text-muted-foreground"
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  {getActorBadge(event.actor)}
                                  {event.status === "pending" && (
                                    <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-600">
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatTime(event.timestamp)}
                                </p>
                              </div>
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
