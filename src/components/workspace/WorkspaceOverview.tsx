import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Mail,
  Phone,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";

interface WorkspaceOverviewProps {
  buyer: Buyer;
}

export function WorkspaceOverview({ buyer }: WorkspaceOverviewProps) {
  const stage = STAGES[buyer.currentStage];
  const progress = ((buyer.currentStage + 1) / 6) * 100;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getBuyerTypeLabel = (type?: string) => {
    switch (type) {
      case "first-time":
        return "First-Time";
      case "move-up":
        return "Move-Up";
      case "investor":
        return "Investor";
      case "downsizing":
        return "Downsizing";
      default:
        return "Standard";
    }
  };

  // Mock data for agent-centric overview
  const pendingApprovals = [
    { id: 1, type: "AI Draft", title: "Price reduction notification email", priority: "high" },
    { id: 2, type: "Document", title: "Pre-approval letter update", priority: "medium" },
  ];

  const openTasks = [
    { id: 1, title: "Schedule property tour - 123 Oak St", dueDate: new Date(), priority: "high" },
    { id: 2, title: "Follow up on inspection report", dueDate: new Date(Date.now() + 86400000), priority: "medium" },
    { id: 3, title: "Review offer terms with buyer", dueDate: new Date(Date.now() + 172800000), priority: "low" },
  ];

  const recentActivity = [
    { action: "Viewed property", detail: "456 Maple Ave", time: "2 hours ago" },
    { action: "Sent message", detail: "Question about closing costs", time: "5 hours ago" },
    { action: "Document uploaded", detail: "Bank statement", time: "Yesterday" },
  ];

  const keyMetrics = {
    propertiesViewed: 12,
    propertiesSaved: 4,
    offersSubmitted: 1,
    daysActive: 18,
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.propertiesViewed}</p>
                <p className="text-xs text-muted-foreground">Properties Viewed</p>
              </div>
              <Home className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.propertiesSaved}</p>
                <p className="text-xs text-muted-foreground">Saved Properties</p>
              </div>
              <CheckSquare className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.offersSubmitted}</p>
                <p className="text-xs text-muted-foreground">Offers Submitted</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.daysActive}</p>
                <p className="text-xs text-muted-foreground">Days Active</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Buyer Summary & Stage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Buyer Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Buyer Profile</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {getBuyerTypeLabel(buyer.buyerType)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{buyer.email}</span>
                </div>
                {buyer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{buyer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started {formatDate(buyer.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last active {formatDate(buyer.lastActivity)}</span>
                </div>
              </div>
              {buyer.marketContext && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="font-medium">Search Focus: </span>
                  <span className="text-muted-foreground">{buyer.marketContext}</span>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={buyer.financingConfirmed ? "default" : "secondary"} className="gap-1">
                  {buyer.financingConfirmed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {buyer.financingConfirmed ? "Financing Confirmed" : "Pending Financing"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Current Stage Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{stage.icon}</span>
                  Stage {buyer.currentStage}: {stage.title}
                </CardTitle>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2 mb-4" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">Your Tasks</h4>
                  <ul className="space-y-1.5">
                    {stage.agentTasks.slice(0, 3).map((task, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">Buyer Tasks</h4>
                  <ul className="space-y-1.5">
                    {stage.buyerTasks.slice(0, 3).map((task, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Open Tasks
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {openTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      task.priority === "high" ? "bg-destructive" : 
                      task.priority === "medium" ? "bg-yellow-500" : "bg-muted-foreground"
                    }`} />
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Activity */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Pending Approvals
                <Badge variant="secondary" className="ml-auto">{pendingApprovals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                    {item.priority === "high" && (
                      <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="default" className="h-7 text-xs flex-1">Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1">Review</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {buyer.name} is actively searching in the <strong>{buyer.marketContext || "target market"}</strong> area. 
                They have {keyMetrics.propertiesSaved} saved properties and {keyMetrics.offersSubmitted} active offer(s). 
                {buyer.financingConfirmed 
                  ? " Pre-approval is confirmed. Ready to move quickly on attractive listings."
                  : " Pre-approval still pending. Consider following up on financing status."}
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Generate Detailed Analysis
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
