import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RefreshCw,
  FileText,
  Home,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
} from "lucide-react";
import type { Buyer, Stage } from "@/types";
import { STAGES } from "@/types";

interface WorkspaceAISummaryProps {
  buyer: Buyer;
}

export function WorkspaceAISummary({ buyer }: WorkspaceAISummaryProps) {
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

  // Mock metrics
  const keyMetrics = {
    propertiesViewed: 12,
    propertiesSaved: 4,
    offersSubmitted: 1,
    daysActive: 18,
  };

  // Recent events for timeline summary
  const recentEvents = [
    { action: "Property added to shortlist", detail: "123 Oak Street", time: "2 hours ago" },
    { action: "Comp analysis generated", detail: "3 comparable properties", time: "Yesterday" },
    { action: "Viewing scheduled", detail: "Saturday at 2:00 PM", time: "2 days ago" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* AI Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Workspace Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated summary of current workspace state
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={Eye} 
          label="Properties Viewed" 
          value={keyMetrics.propertiesViewed} 
        />
        <MetricCard 
          icon={Home} 
          label="Saved Properties" 
          value={keyMetrics.propertiesSaved} 
        />
        <MetricCard 
          icon={DollarSign} 
          label="Active Offers" 
          value={keyMetrics.offersSubmitted} 
        />
        <MetricCard 
          icon={TrendingUp} 
          label="Days Active" 
          value={keyMetrics.daysActive} 
        />
      </div>

      {/* AI Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Current Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">{buyer.name}</strong> is currently in{" "}
            <strong className="text-foreground">Stage {buyer.currentStage}: {stage.title}</strong>.{" "}
            {buyer.marketContext && (
              <>They're actively searching for <strong className="text-foreground">{buyer.marketContext.toLowerCase()}</strong>. </>
            )}
            With {keyMetrics.propertiesSaved} saved properties and {keyMetrics.offersSubmitted} active offer(s),{" "}
            {buyer.financingConfirmed 
              ? "they're pre-approved and ready to move quickly on attractive listings."
              : "pre-approval is still pending—consider following up on financing status."}
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Buyer Profile */}
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
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {buyer.financingConfirmed ? "Pre-Approved" : "Pending"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{buyer.email}</p>
              </div>
              {buyer.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{buyer.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="font-medium">{formatDate(buyer.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Active</p>
                <p className="font-medium">{formatDate(buyer.lastActivity)}</p>
              </div>
            </div>
            {buyer.marketContext && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="font-medium">Search Criteria: </span>
                <span className="text-muted-foreground">{buyer.marketContext}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Timeline Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.time}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              View full timeline in the Timeline tab
            </p>
          </CardContent>
        </Card>
      </div>
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
