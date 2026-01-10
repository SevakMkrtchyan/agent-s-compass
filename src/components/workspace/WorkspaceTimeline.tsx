import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  Bot,
  FileText,
  Home,
  MessageSquare,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";
import { cn } from "@/lib/utils";

interface WorkspaceTimelineProps {
  buyer: Buyer;
}

interface TimelineEvent {
  id: string;
  type: "stage-change" | "document" | "message" | "property" | "ai-content" | "action";
  title: string;
  description: string;
  timestamp: Date;
  stage: number;
  actor: "agent" | "buyer" | "system";
}

const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "1",
    type: "stage-change",
    title: "Workspace Created",
    description: "Agent created buyer workspace and selected buyer type",
    timestamp: new Date("2024-01-10T09:00:00"),
    stage: 0,
    actor: "agent",
  },
  {
    id: "2",
    type: "ai-content",
    title: "Orientation Generated",
    description: "AI-generated orientation content approved by agent",
    timestamp: new Date("2024-01-10T09:15:00"),
    stage: 0,
    actor: "system",
  },
  {
    id: "3",
    type: "message",
    title: "Buyer Read Orientation",
    description: "Buyer confirmed reading orientation materials",
    timestamp: new Date("2024-01-10T14:30:00"),
    stage: 0,
    actor: "buyer",
  },
  {
    id: "4",
    type: "action",
    title: "Financing Confirmed",
    description: "Buyer confirmed pre-approval status",
    timestamp: new Date("2024-01-11T10:00:00"),
    stage: 0,
    actor: "buyer",
  },
  {
    id: "5",
    type: "stage-change",
    title: "Advanced to Home Search",
    description: "Agent advanced buyer to Stage 1",
    timestamp: new Date("2024-01-11T11:00:00"),
    stage: 1,
    actor: "agent",
  },
  {
    id: "6",
    type: "property",
    title: "Properties Added",
    description: "Agent added 4 properties for buyer review",
    timestamp: new Date("2024-01-12T09:00:00"),
    stage: 1,
    actor: "agent",
  },
  {
    id: "7",
    type: "ai-content",
    title: "Comp Analysis Pending",
    description: "AI-generated comparable analysis awaiting approval",
    timestamp: new Date("2024-01-15T10:00:00"),
    stage: 1,
    actor: "system",
  },
];

export function WorkspaceTimeline({ buyer }: WorkspaceTimelineProps) {
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case "stage-change":
        return <CheckCircle2 className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "property":
        return <Home className="h-4 w-4" />;
      case "ai-content":
        return <Bot className="h-4 w-4" />;
      case "action":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getActorBadge = (actor: TimelineEvent["actor"]) => {
    switch (actor) {
      case "agent":
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <User className="h-3 w-3" />
            Agent
          </Badge>
        );
      case "buyer":
        return (
          <Badge variant="outline" className="text-xs gap-1">
            <User className="h-3 w-3" />
            Buyer
          </Badge>
        );
      case "system":
        return (
          <Badge variant="outline" className="text-xs gap-1 bg-info/10 text-info border-info/20">
            <Bot className="h-3 w-3" />
            AI
          </Badge>
        );
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
  const eventsByStage = mockTimelineEvents.reduce((acc, event) => {
    if (!acc[event.stage]) {
      acc[event.stage] = [];
    }
    acc[event.stage].push(event);
    return acc;
  }, {} as Record<number, TimelineEvent[]>);

  return (
    <div className="space-y-6">
      {/* Stage Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Journey Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {STAGES.map((stage, index) => (
              <div key={stage.stage} className="flex items-center">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-lg border-2 transition-all",
                    buyer.currentStage > stage.stage
                      ? "bg-success text-success-foreground border-success"
                      : buyer.currentStage === stage.stage
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {buyer.currentStage > stage.stage ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    stage.icon
                  )}
                </div>
                {index < STAGES.length - 1 && (
                  <div
                    className={cn(
                      "h-1 w-8 mx-1 rounded-full transition-all",
                      buyer.currentStage > stage.stage ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {mockTimelineEvents
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((event, index) => (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2",
                        event.stage === buyer.currentStage
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border"
                      )}
                    >
                      {getEventIcon(event)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {event.description}
                          </p>
                        </div>
                        {getActorBadge(event.actor)}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatTime(event.timestamp)}</span>
                        <span>•</span>
                        <span>Stage {event.stage}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
