import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  Eye,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";

interface WorkspaceOverviewProps {
  buyer: Buyer;
}

export function WorkspaceOverview({ buyer }: WorkspaceOverviewProps) {
  const stage = STAGES[buyer.currentStage];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getBuyerTypeLabel = (type?: string) => {
    switch (type) {
      case "first-time": return "First-Time";
      case "move-up": return "Move-Up";
      case "investor": return "Investor";
      case "downsizing": return "Downsizing";
      default: return "Standard";
    }
  };

  // Mock data for agent-centric overview
  const pendingApprovals = [
    { id: 1, type: "AI Draft", title: "Price reduction notification email", priority: "high" },
    { id: 2, type: "Document", title: "Pre-approval letter update", priority: "medium" },
  ];

  const openTasks = [
    { id: 1, title: "Schedule property tour - 123 Oak St", dueDate: new Date(), priority: "high", category: "showing" },
    { id: 2, title: "Follow up on inspection report", dueDate: new Date(Date.now() + 86400000), priority: "medium", category: "document" },
    { id: 3, title: "Review offer terms with buyer", dueDate: new Date(Date.now() + 172800000), priority: "low", category: "offer" },
  ];

  const recentActivity = [
    { action: "Viewed property", detail: "456 Maple Ave", time: "2 hours ago", type: "property" },
    { action: "Sent message", detail: "Question about closing costs", time: "5 hours ago", type: "message" },
    { action: "Document uploaded", detail: "Bank statement", time: "Yesterday", type: "document" },
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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.propertiesViewed}</p>
                <p className="text-xs text-muted-foreground">Properties Viewed</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.propertiesSaved}</p>
                <p className="text-xs text-muted-foreground">Saved Properties</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.offersSubmitted}</p>
                <p className="text-xs text-muted-foreground">Active Offers</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{keyMetrics.daysActive}</p>
                <p className="text-xs text-muted-foreground">Days Active</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Buyer Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Buyer Profile</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getBuyerTypeLabel(buyer.buyerType)}
                  </Badge>
                  <Badge variant={buyer.financingConfirmed ? "default" : "secondary"} className="text-xs gap-1">
                    {buyer.financingConfirmed ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {buyer.financingConfirmed ? "Pre-Approved" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
                  <span>Active {formatDate(buyer.lastActivity)}</span>
                </div>
              </div>
              {buyer.marketContext && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="font-medium">Search Criteria: </span>
                  <span className="text-muted-foreground">{buyer.marketContext}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Open Tasks
                  <Badge variant="secondary" className="ml-1">{openTasks.length}</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {openTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      task.priority === "high" ? "bg-destructive" : 
                      task.priority === "medium" ? "bg-yellow-500" : "bg-muted-foreground"
                    }`} />
                    <span className="text-sm">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{task.category}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Status Summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Workspace Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{buyer.name}</strong> is currently in{" "}
                <strong className="text-foreground">Stage {buyer.currentStage}: {stage.title}</strong>.{" "}
                {buyer.marketContext && <>They're actively searching for <strong className="text-foreground">{buyer.marketContext.toLowerCase()}</strong>. </>}
                With {keyMetrics.propertiesSaved} saved properties and {keyMetrics.offersSubmitted} active offer(s),{" "}
                {buyer.financingConfirmed 
                  ? "they're pre-approved and ready to move quickly on attractive listings."
                  : "pre-approval is still pending—consider following up on financing status."}
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-xs gap-1 flex-1">
                  <Sparkles className="h-3 w-3" />
                  Generate Analysis
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1 flex-1">
                  <FileText className="h-3 w-3" />
                  Draft Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          {pendingApprovals.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Pending Approvals
                  <Badge variant="secondary" className="ml-auto">{pendingApprovals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-background border">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      {item.priority === "high" && (
                        <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-2">{item.title}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="h-7 text-xs flex-1">Approve</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-1">Review</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs mt-2">
                View Full Activity Log
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
                <Home className="h-4 w-4" />
                Add Property
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
                <DollarSign className="h-4 w-4" />
                Create Offer
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
                <FileText className="h-4 w-4" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
