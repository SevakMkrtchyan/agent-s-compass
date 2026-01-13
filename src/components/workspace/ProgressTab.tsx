import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Home, 
  DollarSign,
  ArrowRight,
  Bot,
  Sparkles,
  ChevronRight,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";
import { STAGES } from "@/types";
import type { StageGroup, AIExplanation, SystemEvent, ComponentBlock } from "@/types/conversation";

interface ProgressTabProps {
  stages: StageGroup[];
  currentStage: Stage;
  buyerName: string;
  onPrefillAgentGPT: (command: string) => void;
  onOpenDetails: () => void;
}

export function ProgressTab({
  stages,
  currentStage,
  buyerName,
  onPrefillAgentGPT,
  onOpenDetails,
}: ProgressTabProps) {
  const currentStageData = STAGES[currentStage];

  // Extract approved artifacts
  const approvedArtifacts = stages.flatMap(stage => 
    stage.items.filter(item => 
      item.type === "ai-explanation" && 
      (item as AIExplanation).approvalStatus === "approved"
    )
  ) as AIExplanation[];

  // Extract system events
  const systemEvents = stages.flatMap(stage =>
    stage.items.filter(item => item.type === "system-event")
  ) as SystemEvent[];

  // Extract component blocks
  const componentBlocks = stages.flatMap(stage =>
    stage.items.filter(item => item.type === "component-block")
  ) as ComponentBlock[];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const handleItemClick = (action: string, context?: string) => {
    const command = context 
      ? `${action} for ${context}` 
      : action;
    onPrefillAgentGPT(command);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Current Stage Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentStageData.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Stage</p>
                  <CardTitle className="text-lg">{currentStageData.title}</CardTitle>
                </div>
              </div>
              <Badge>Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              {buyerName} is in the {currentStageData.title.toLowerCase()} phase of their home buying journey.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="gap-2"
                onClick={() => handleItemClick("Generate next steps")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate next steps
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="gap-2"
                onClick={() => handleItemClick(`Draft stage update for ${buyerName}`)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Modify with AgentGPT
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stage Journey */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Stage Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {stages.map((stage, index) => {
                const stageInfo = STAGES[stage.stageId];
                const isComplete = stage.status === "completed";
                const isCurrent = stage.status === "current";
                const isLocked = stage.status === "locked";

                return (
                  <button
                    key={stage.stageId}
                    onClick={() => !isLocked && handleItemClick(`Show details for Stage ${stage.stageId}`, stage.title)}
                    disabled={isLocked}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group",
                      isComplete && "hover:bg-muted/50",
                      isCurrent && "bg-primary/10 border border-primary/20",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm",
                      isComplete && "bg-success/20 text-success",
                      isCurrent && "bg-primary/20 text-primary",
                      isLocked && "bg-muted text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        stageInfo.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        isCurrent && "text-primary"
                      )}>
                        {stageInfo.title}
                      </p>
                      {stage.startedAt && (
                        <p className="text-xs text-muted-foreground">
                          {stage.completedAt 
                            ? `Completed ${formatTime(stage.completedAt)}`
                            : `Started ${formatTime(stage.startedAt)}`
                          }
                        </p>
                      )}
                    </div>
                    {!isLocked && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Approved Artifacts */}
        {approvedArtifacts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Published Artifacts
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {approvedArtifacts.length} visible to buyer
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {approvedArtifacts.slice(0, 5).map((artifact) => (
                  <button
                    key={artifact.id}
                    onClick={() => handleItemClick("Modify artifact", artifact.content.slice(0, 30))}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20 text-left hover:bg-success/10 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-full flex items-center justify-center bg-success/20 text-success shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{artifact.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Published {formatTime(artifact.approvedAt || artifact.timestamp)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
              {approvedArtifacts.length > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  onClick={() => handleItemClick("Show all published artifacts")}
                >
                  View all {approvedArtifacts.length} artifacts
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Events */}
        {systemEvents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {systemEvents.slice(0, 8).map((event) => {
                  const getEventIcon = () => {
                    switch (event.eventType) {
                      case "stage-advanced": return <CheckCircle className="h-3.5 w-3.5 text-success" />;
                      case "offer-submitted": return <DollarSign className="h-3.5 w-3.5 text-primary" />;
                      case "document-uploaded": return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
                      case "property-added": return <Home className="h-3.5 w-3.5 text-primary" />;
                      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
                    }
                  };

                  return (
                    <button
                      key={event.id}
                      onClick={() => handleItemClick(`Explain event: ${event.title}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      {getEventIcon()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Actions via AgentGPT</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <ActionButton 
                label="Advance Stage" 
                onClick={() => handleItemClick("Advance to next stage with summary")} 
              />
              <ActionButton 
                label="Generate Update" 
                onClick={() => handleItemClick(`Generate buyer update for ${buyerName}`)} 
              />
              <ActionButton 
                label="Create Task" 
                onClick={() => handleItemClick("Create new task")} 
              />
              <ActionButton 
                label="Explain to Buyer" 
                onClick={() => handleItemClick("Explain current status to buyer")} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>Progress is the canonical system-of-record.</p>
          <p>All changes flow through AgentGPT.</p>
        </div>
      </div>
    </ScrollArea>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-9 text-xs gap-1.5 justify-start"
      onClick={onClick}
    >
      <Sparkles className="h-3 w-3 text-primary" />
      {label}
    </Button>
  );
}