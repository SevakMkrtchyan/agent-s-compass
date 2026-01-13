import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bot, 
  Sparkles, 
  Users, 
  ArrowRight, 
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Home,
  DollarSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { mockWorkspaces } from "@/data/workspaceData";
import { STAGES } from "@/types";

// Quick action suggestions for no-buyer context
const globalQuickActions = [
  { id: "1", label: "Create new buyer workspace", icon: Users, command: "Create a new buyer workspace" },
  { id: "2", label: "Review pending approvals", icon: AlertTriangle, command: "Show all pending approvals across buyers" },
  { id: "3", label: "Generate weekly summary", icon: FileText, command: "Generate weekly activity summary" },
  { id: "4", label: "View pipeline analytics", icon: TrendingUp, command: "Show pipeline health metrics" },
];

export default function AgentGPT() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandInput, setCommandInput] = useState("");

  // Get buyers that need attention
  const buyersNeedingAttention = mockWorkspaces
    .filter(ws => ws.openTasks > 0)
    .slice(0, 5);

  // Get recent activity
  const recentActivity = mockWorkspaces
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, 5);

  const handleSelectBuyer = useCallback((workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`);
  }, [navigate]);

  const handleQuickAction = (command: string) => {
    setCommandInput(command);
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Sidebar (no buyer context) */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-200 min-h-screen",
          sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
        )}
      >
        {/* Top Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Main Content Area */}
        <ScrollArea className="h-[calc(100vh-56px)]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Welcome Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">AgentGPT</h1>
              <p className="text-muted-foreground">
                Your AI-powered assistant for managing buyer transactions
              </p>
            </div>

            {/* System Guardrails */}
            <Alert className="mb-6 border-muted bg-muted/30">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-xs text-muted-foreground">
                AgentGPT provides educational explanations. Licensed agents make final decisions.
              </AlertDescription>
            </Alert>

            {/* Command Input - Spotlight Style */}
            <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="relative">
                  <Input
                    placeholder="Tell AgentGPT what you want to do…"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    className="h-14 text-base pl-12 pr-12 rounded-xl border-2 border-muted focus:border-primary/50 bg-background"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Button
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg"
                    disabled={!commandInput.trim()}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Start typing or select a buyer to begin
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What should happen next?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {globalQuickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.command)}
                        className="flex items-center gap-3 p-3 rounded-xl text-left bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Buyers Needing Attention */}
            {buyersNeedingAttention.length > 0 && (
              <Card className="mb-6 border-warning/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Needs Attention
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {buyersNeedingAttention.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {buyersNeedingAttention.map((ws) => {
                    const stage = STAGES[ws.currentStage];
                    return (
                      <button
                        key={ws.id}
                        onClick={() => handleSelectBuyer(ws.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-muted/50 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center text-sm font-semibold text-warning">
                          {ws.buyerName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{ws.buyerName}</span>
                            <Badge variant="outline" className="text-[10px]">
                              Stage {ws.currentStage}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {ws.openTasks > 0 && (
                              <span>{ws.openTasks} open tasks</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Buyers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {recentActivity.map((ws) => {
                  const stage = STAGES[ws.currentStage];
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectBuyer(ws.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                        {ws.buyerName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{ws.buyerName}</span>
                          <span className="text-xs text-muted-foreground">
                            {stage.icon} {stage.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Last active {formatLastActivity(ws.lastActivity)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}