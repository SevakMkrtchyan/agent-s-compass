import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pin, Clock, ChevronRight, UserPlus } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { mockWorkspaces } from "@/data/workspaceData";
import { STAGES } from "@/types";
import { WORKSPACE_STATUS_CONFIG } from "@/types/workspace";

export default function WorkspaceList() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort workspaces
  const filteredWorkspaces = mockWorkspaces.filter(ws =>
    ws.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ws.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedWorkspaces = [...filteredWorkspaces].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.lastActivity.getTime() - a.lastActivity.getTime();
  });

  const pinnedWorkspaces = sortedWorkspaces.filter(ws => ws.isPinned);
  const recentWorkspaces = sortedWorkspaces.filter(ws => !ws.isPinned);

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar collapsed={sidebarCollapsed} />

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-200",
        sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
      )}>
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Workspaces</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a buyer workspace to view details
                </p>
              </div>
              <Button onClick={() => navigate("/add-buyer")} className="gap-2">
                <UserPlus className="h-4 w-4" />
                New Buyer
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-10"
              />
            </div>

            {/* Workspaces List */}
            <div className="space-y-6">
              {/* Pinned Section */}
              {pinnedWorkspaces.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </div>
                  <div className="grid gap-3">
                    {pinnedWorkspaces.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        formatLastActivity={formatLastActivity}
                        onClick={() => navigate(`/workspace/${workspace.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Section */}
              {recentWorkspaces.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    Recent
                  </div>
                  <div className="grid gap-3">
                    {recentWorkspaces.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        formatLastActivity={formatLastActivity}
                        onClick={() => navigate(`/workspace/${workspace.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sortedWorkspaces.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No workspaces found</p>
                  <Button
                    variant="link"
                    onClick={() => navigate("/add-buyer")}
                    className="mt-2"
                  >
                    Create your first workspace
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface WorkspaceCardProps {
  workspace: typeof mockWorkspaces[0];
  formatLastActivity: (date: Date) => string;
  onClick: () => void;
}

function WorkspaceCard({ workspace, formatLastActivity, onClick }: WorkspaceCardProps) {
  const stageInfo = STAGES[workspace.currentStage];
  const statusConfig = WORKSPACE_STATUS_CONFIG[workspace.status];

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-border/50 bg-card hover:border-foreground/20 hover:bg-muted/30 transition-all group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-foreground/70 shrink-0">
          {workspace.buyerName.split(" ").map(n => n[0]).join("")}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{workspace.buyerName}</span>
            {workspace.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${statusConfig.color}20`,
                color: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>Stage {workspace.currentStage}: {stageInfo?.title}</span>
            <span>·</span>
            <span>{formatLastActivity(workspace.lastActivity)}</span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-foreground/50 transition-colors" />
      </div>
    </button>
  );
}
