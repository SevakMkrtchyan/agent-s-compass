import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  User,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { stageEducationalContent } from "@/data/mockData";

interface WorkspaceTimelineProps {
  buyer: Buyer;
}

interface TimelineEvent {
  id: string;
  type: "task" | "document" | "offer" | "message" | "stage" | "property" | "ai";
  title: string;
  description?: string;
  timestamp: Date;
  stage: number;
  actor: "agent" | "buyer" | "ai" | "system";
  status?: "completed" | "pending" | "in-progress";
}

// Mock timeline events
const mockTimelineEvents: TimelineEvent[] = [
  { id: "1", type: "stage", title: "Workspace Created - Pre-Approval", timestamp: new Date("2024-01-10T09:00:00"), stage: 0, actor: "system", status: "completed" },
  { id: "2", type: "document", title: "Pre-approval letter uploaded", description: "Lender: First National Bank", timestamp: new Date("2024-01-11T10:30:00"), stage: 0, actor: "buyer", status: "completed" },
  { id: "3", type: "task", title: "Buyer criteria review completed", description: "Budget: $400-500K, 3+ bed, suburban", timestamp: new Date("2024-01-11T14:00:00"), stage: 0, actor: "agent", status: "completed" },
  { id: "4", type: "stage", title: "Advanced to Home Search", timestamp: new Date("2024-01-12T09:00:00"), stage: 1, actor: "system", status: "completed" },
  { id: "5", type: "property", title: "Added 123 Oak Street", description: "$425,000 - 4 bed, 2.5 bath", timestamp: new Date("2024-01-13T11:00:00"), stage: 1, actor: "agent" },
  { id: "6", type: "property", title: "Added 456 Maple Avenue", description: "$398,000 - 3 bed, 2 bath", timestamp: new Date("2024-01-13T11:15:00"), stage: 1, actor: "agent" },
  { id: "7", type: "ai", title: "Property comparison email drafted", description: "Awaiting agent approval", timestamp: new Date("2024-01-14T09:00:00"), stage: 1, actor: "ai", status: "pending" },
  { id: "8", type: "message", title: "Buyer requested weekend showing", description: "Preferred: Saturday afternoon", timestamp: new Date("2024-01-14T16:30:00"), stage: 1, actor: "buyer" },
  { id: "9", type: "task", title: "Property tours scheduled", description: "Saturday 2-5pm confirmed", timestamp: new Date("2024-01-15T10:00:00"), stage: 1, actor: "agent", status: "completed" },
];

export function WorkspaceTimeline({ buyer }: WorkspaceTimelineProps) {
  const [expandedStages, setExpandedStages] = useState<number[]>([buyer.currentStage]);
  const stageContent = stageEducationalContent[buyer.currentStage as keyof typeof stageEducationalContent];
  const progress = ((buyer.currentStage + 1) / STAGES.length) * 100;

  const toggleStage = (stage: number) => {
    setExpandedStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
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
      case "ai": return Bot;
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
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      {/* Left: Stage Navigation & Education */}
      <div className="space-y-6">
        {/* Journey Progress */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Journey Progress</CardTitle>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="space-y-1">
              {STAGES.map((stage, index) => {
                const isCompleted = index < buyer.currentStage;
                const isCurrent = index === buyer.currentStage;
                const isLocked = index > buyer.currentStage;
                const hasEvents = eventsByStage[index]?.length > 0;

                return (
                  <button
                    key={stage.stage}
                    onClick={() => !isLocked && toggleStage(index)}
                    disabled={isLocked}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                      isCurrent && "bg-primary/10 border border-primary/30",
                      isCompleted && !isCurrent && "hover:bg-muted",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground",
                      isLocked && "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : stage.stage}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isLocked && "text-muted-foreground"
                      )}>
                        {stage.title}
                      </p>
                      {hasEvents && !isLocked && (
                        <p className="text-xs text-muted-foreground">{eventsByStage[index].length} events</p>
                      )}
                    </div>
                    {isCurrent && <Badge variant="default" className="text-[10px]">Current</Badge>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Stage Details - Education lives here */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-xl">{STAGES[buyer.currentStage].icon}</span>
              {STAGES[buyer.currentStage].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{stageContent.content}</p>
            
            {/* Agent Tasks for this Stage */}
            <div className="p-3 rounded-lg border bg-muted/30">
              <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Agent Tasks
              </h4>
              <ul className="space-y-1.5">
                {STAGES[buyer.currentStage].agentTasks.map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Buyer Tasks for this Stage */}
            <div className="p-3 rounded-lg border bg-muted/30">
              <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Buyer Actions
              </h4>
              <ul className="space-y-1.5">
                {STAGES[buyer.currentStage].buyerTasks.map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stage Tips */}
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <h4 className="font-medium text-xs text-primary mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Stage Tips
              </h4>
              <ul className="space-y-1.5">
                {stageContent.tips.slice(0, 3).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-medium">{index + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Activity Timeline */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Activity Timeline
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">All</Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">Tasks</Badge>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">Docs</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[650px]">
            <div className="p-4 space-y-4">
              {STAGES.slice(0, buyer.currentStage + 1).reverse().map((stage) => {
                const stageEvents = eventsByStage[stage.stage] || [];
                const isExpanded = expandedStages.includes(stage.stage);
                const isCurrent = stage.stage === buyer.currentStage;

                return (
                  <Collapsible 
                    key={stage.stage} 
                    open={isExpanded}
                    onOpenChange={() => toggleStage(stage.stage)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        isCurrent ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"
                      )}>
                        <span className="text-xl">{stage.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">Stage {stage.stage}: {stage.title}</p>
                            {isCurrent && <Badge variant="default" className="text-[10px]">Active</Badge>}
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
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-muted pl-4 pb-2">
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
                                event.status === "in-progress" && "bg-blue-500/10 text-blue-600",
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
                              {event.status === "pending" && event.actor === "ai" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="default" className="h-6 text-[10px] px-2">Approve</Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2">View</Button>
                                </div>
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
