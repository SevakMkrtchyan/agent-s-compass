import { 
  X, 
  Clock, 
  CheckSquare, 
  FileText, 
  AlertTriangle,
  Home,
  DollarSign,
  TrendingUp,
  Eye,
  CheckCircle,
  Edit3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";
import { STAGES } from "@/types";
import type { StageGroup, AIExplanation } from "@/types/conversation";

interface DetailsInspectorProps {
  open: boolean;
  onClose: () => void;
  currentStage: Stage;
  buyerName: string;
  buyerType?: string;
  financingConfirmed: boolean;
  marketContext?: string;
  stages: StageGroup[];
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onPrefillAgentGPT: (command: string) => void;
}

export function DetailsInspector({
  open,
  onClose,
  currentStage,
  buyerName,
  buyerType,
  financingConfirmed,
  marketContext,
  stages,
  onApprove,
  onReject,
  onPrefillAgentGPT,
}: DetailsInspectorProps) {
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
    { id: 1, title: "Schedule viewing - 123 Oak St", priority: "high" as const, dueDate: new Date() },
    { id: 2, title: "Review inspection report", priority: "medium" as const, dueDate: new Date(Date.now() + 86400000) },
    { id: 3, title: "Follow up on financing", priority: "low" as const, dueDate: new Date(Date.now() + 172800000) },
  ];

  // Mock documents
  const documents = [
    { id: 1, name: "Pre-Approval Letter.pdf", uploadedAt: new Date(Date.now() - 86400000 * 5) },
    { id: 2, name: "Buyer Agency Agreement.pdf", uploadedAt: new Date(Date.now() - 86400000 * 10) },
  ];

  // Mock timeline events
  const timelineEvents = [
    { id: 1, title: "Offer submitted", timestamp: new Date(Date.now() - 3600000 * 2) },
    { id: 2, title: "Property viewed", timestamp: new Date(Date.now() - 86400000) },
    { id: 3, title: "Stage advanced to Home Search", timestamp: new Date(Date.now() - 86400000 * 3) },
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Details</SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 space-y-4">
            {/* Current Stage */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{stage.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Stage</p>
                    <h3 className="font-semibold">{stage.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <MetricItem icon={Eye} label="Viewed" value={metrics.propertiesViewed} />
                  <MetricItem icon={Home} label="Saved" value={metrics.savedProperties} />
                  <MetricItem icon={DollarSign} label="Offers" value={metrics.activeOffers} />
                  <MetricItem icon={TrendingUp} label="Days Active" value={metrics.daysActive} />
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <Card className="border-warning/30">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      Pending Approvals
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {pendingApprovals.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {pendingApprovals.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-warning/5 border border-warning/20">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-warning" />
                        <span className="text-xs font-medium">AI Artifact</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.content.slice(0, 80)}...
                      </p>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-6 text-[10px] gap-1"
                          onClick={() => onReject(item.id)}
                        >
                          <Edit3 className="h-2.5 w-2.5" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-6 text-[10px] flex-1 gap-1"
                          onClick={() => onApprove(item.id)}
                        >
                          <CheckCircle className="h-2.5 w-2.5" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Open Tasks */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    Tasks
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {metrics.openTasks}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {openTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onPrefillAgentGPT(`Update on task: ${task.title}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0",
                      task.priority === "high" && "bg-destructive",
                      task.priority === "medium" && "bg-warning",
                      task.priority === "low" && "bg-muted-foreground"
                    )} />
                    <span className="text-xs flex-1 truncate">{task.title}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onPrefillAgentGPT(`Summarize document: ${doc.name}`)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Timeline */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1">
                {timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 p-2 text-left"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    <span className="text-xs flex-1">{event.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Search Criteria */}
            {marketContext && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Search Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground">
                    {marketContext}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function MetricItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
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