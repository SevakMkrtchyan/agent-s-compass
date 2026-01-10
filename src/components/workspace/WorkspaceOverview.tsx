import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Mail,
  Phone,
  Home,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Buyer, STAGES } from "@/types";
import { stageEducationalContent } from "@/data/mockData";

interface WorkspaceOverviewProps {
  buyer: Buyer;
}

export function WorkspaceOverview({ buyer }: WorkspaceOverviewProps) {
  const stage = STAGES[buyer.currentStage];
  const stageContent = stageEducationalContent[buyer.currentStage as keyof typeof stageEducationalContent];
  const progress = ((buyer.currentStage + 1) / 6) * 100;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getBuyerTypeLabel = (type?: string) => {
    switch (type) {
      case "first-time":
        return "First-Time Buyer";
      case "move-up":
        return "Move-Up Buyer";
      case "investor":
        return "Investor";
      case "downsizing":
        return "Downsizing";
      default:
        return "Not specified";
    }
  };

  return (
    <div className="space-y-6">
      {/* Buyer Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {buyer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">{buyer.name}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {getBuyerTypeLabel(buyer.buyerType)}
                </p>
              </div>
            </div>
            <Badge
              variant={buyer.financingConfirmed ? "default" : "secondary"}
              className="gap-1"
            >
              {buyer.financingConfirmed ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {buyer.financingConfirmed ? "Financing Confirmed" : "Pending Financing"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{buyer.email}</span>
            </div>
            {buyer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{buyer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Started {formatDate(buyer.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Active {formatDate(buyer.lastActivity)}</span>
            </div>
          </div>

          {buyer.marketContext && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 text-sm">
              <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Search Focus: </span>
                <span className="text-muted-foreground">{buyer.marketContext}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Stage Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">{stage.icon}</span>
              Stage {buyer.currentStage}: {stage.title}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2 mb-4" />
          <p className="text-muted-foreground mb-4">{stageContent.content}</p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Agent Tasks */}
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium text-sm mb-3 text-foreground">Agent Tasks</h4>
              <ul className="space-y-2">
                {stage.agentTasks.map((task, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Buyer Tasks */}
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium text-sm mb-3 text-foreground">Buyer Tasks</h4>
              <ul className="space-y-2">
                {stage.buyerTasks.map((task, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tips for This Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {stageContent.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-accent">{index + 1}</span>
                </div>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
