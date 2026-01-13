import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Users, 
  Send, 
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { mockWorkspaces } from "@/data/workspaceData";
import { STAGES } from "@/types";

// Quick action suggestions for no-buyer context
const globalQuickActions = [
  { id: "1", label: "Create new buyer workspace", icon: Users, command: "Create a new buyer workspace" },
  { id: "2", label: "Review pending approvals", icon: AlertCircle, command: "Show all pending approvals across buyers" },
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
          <div className="max-w-2xl mx-auto px-6 py-12">
            {/* Welcome Header */}
            <div className="mb-10 text-center">
              <h1 className="text-2xl font-semibold mb-2 text-foreground">What can I help you with?</h1>
              <p className="text-muted-foreground text-sm">
                Manage transactions, review approvals, and track your pipeline
              </p>
            </div>

            {/* Command Input - Clean Spotlight Style */}
            <div className="mb-10">
              <div className="relative">
                <Input
                  placeholder="Ask anything or describe what you need…"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="h-12 text-sm pl-4 pr-12 rounded-lg bg-muted/40 border-0 focus:bg-background focus:ring-1 focus:ring-accent/30"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-md text-muted-foreground hover:text-accent disabled:opacity-30"
                  disabled={!commandInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2 text-center">
                or select an action below
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                {globalQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.command)}
                      className="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buyers Needing Attention */}
            {buyersNeedingAttention.length > 0 && (
              <Card className="mb-6 border-border/60 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Needs attention
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] bg-muted">
                      {buyersNeedingAttention.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4 space-y-0.5">
                  {buyersNeedingAttention.map((ws) => {
                    return (
                      <button
                        key={ws.id}
                        onClick={() => handleSelectBuyer(ws.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center text-xs font-semibold text-warning">
                          {ws.buyerName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm text-foreground">{ws.buyerName}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ws.openTasks} open tasks · Stage {ws.currentStage}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent buyers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 space-y-0.5">
                {recentActivity.map((ws) => {
                  const stage = STAGES[ws.currentStage];
                  return (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectBuyer(ws.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {ws.buyerName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm text-foreground">{ws.buyerName}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stage.title} · {formatLastActivity(ws.lastActivity)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
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