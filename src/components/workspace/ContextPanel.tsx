import { 
  Home, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckSquare,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Eye,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";
import { STAGES } from "@/types";
import type { StageGroup, ConversationItem, AIExplanation } from "@/types/conversation";

interface ContextPanelProps {
  currentStage: Stage;
  buyerName: string;
  buyerType?: string;
  financingConfirmed: boolean;
  marketContext?: string;
  stages: StageGroup[];
  onOpenDeepView: (view: "timeline" | "properties" | "offers" | "tasks") => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
}

export function ContextPanel({
  currentStage,
  buyerName,
  buyerType,
  financingConfirmed,
  marketContext,
  stages,
  onOpenDeepView,
  onApprove,
  onReject,
}: ContextPanelProps) {
  const stage = STAGES[currentStage];

  // Get pending approvals
  const pendingApprovals = stages.flatMap(s => 
    s.items.filter(item => 
      item.type === "ai-explanation" && 
      (item as AIExplanation).approvalStatus === "pending"
    )
  ) as AIExplanation[];

  // Mock metrics
  const metrics = {
    propertiesViewed: 12,
    savedProperties: 4,
    activeOffers: 1,
    openTasks: 3,
    daysActive: 18,
  };

  // Mock open tasks
  const openTasks = [
    { id: 1, title: "Schedule viewing - 123 Oak St", priority: "high" as const },
    { id: 2, title: "Review inspection report", priority: "medium" as const },
    { id: 3, title: "Follow up on financing", priority: "low" as const },
  ];

  const getBuyerTypeLabel = (type?: string) => {
    switch (type) {
      case "first-time": return "First-Time Buyer";
      case "move-up": return "Move-Up Buyer";
      case "investor": return "Investor";
      case "downsizing": return "Downsizing";
      default: return "Standard";
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Stage Header */}
      <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{stage.icon}</span>
          <div>
            <p className="text-xs text-muted-foreground">Current Stage</p>
            <h3 className="font-semibold">{stage.title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant={financingConfirmed ? "default" : "secondary"} className="text-xs gap-1">
            {financingConfirmed ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {financingConfirmed ? "Pre-Approved" : "Financing Pending"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getBuyerTypeLabel(buyerType)}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Key Metrics */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard icon={Eye} label="Viewed" value={metrics.propertiesViewed} />
              <MetricCard icon={Home} label="Saved" value={metrics.savedProperties} />
              <MetricCard icon={DollarSign} label="Offers" value={metrics.activeOffers} />
              <MetricCard icon={TrendingUp} label="Days" value={metrics.daysActive} />
            </div>
          </div>

          <Separator />

          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    Pending Approvals
                  </h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {pendingApprovals.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {pendingApprovals.slice(0, 2).map((item) => (
                    <Card key={item.id} className="border-yellow-500/30 bg-yellow-500/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="h-3 w-3 text-yellow-600" />
                          <span className="text-xs font-medium">AI Explanation</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {item.content.slice(0, 80)}...
                        </p>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            className="h-6 text-[10px] flex-1 gap-1"
                            onClick={() => onApprove(item.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-[10px] gap-1"
                            onClick={() => onReject(item.id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Open Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Open Tasks
              </h4>
              <Badge variant="secondary" className="text-[10px]">
                {metrics.openTasks}
              </Badge>
            </div>
            <div className="space-y-1">
              {openTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onOpenDeepView("tasks")}
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full flex-shrink-0",
                    task.priority === "high" && "bg-destructive",
                    task.priority === "medium" && "bg-yellow-500",
                    task.priority === "low" && "bg-muted-foreground"
                  )} />
                  <span className="text-xs flex-1 truncate">{task.title}</span>
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 h-7 text-xs gap-1"
              onClick={() => onOpenDeepView("tasks")}
            >
              View All Tasks <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Quick Actions
            </h4>
            <div className="space-y-1">
              <QuickActionButton 
                icon={Home} 
                label="Add Property" 
                onClick={() => onOpenDeepView("properties")} 
              />
              <QuickActionButton 
                icon={DollarSign} 
                label="Create Offer" 
                onClick={() => onOpenDeepView("offers")} 
              />
              <QuickActionButton 
                icon={Upload} 
                label="Upload Document" 
                onClick={() => onOpenDeepView("tasks")} 
              />
              <QuickActionButton 
                icon={Clock} 
                label="View Timeline" 
                onClick={() => onOpenDeepView("timeline")} 
              />
            </div>
          </div>

          {/* Market Context */}
          {marketContext && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Search Criteria
                </h4>
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                  {marketContext}
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
}) {
  return (
    <div className="p-2 rounded-lg bg-muted/50 flex items-center gap-2">
      <div className="h-7 w-7 rounded-md bg-background flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// Quick Action Button
function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <Button 
      variant="outline" 
      className="w-full justify-start h-8 text-xs gap-2"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
