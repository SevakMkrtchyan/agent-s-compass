import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Search, 
  Pin, 
  Clock, 
  ChevronRight, 
  Home,
  FileText,
  CheckSquare,
  Settings,
  Filter,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
import { STAGES } from "@/types";
import { WORKSPACE_STATUS_CONFIG, type WorkspaceStatus, type Workspace } from "@/types/workspace";

interface WorkspaceSidebarProps {
  collapsed: boolean;
}

export function WorkspaceSidebar({ collapsed }: WorkspaceSidebarProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const isBroker = (currentUser.role as string) === "broker";

  // Filter workspaces based on role
  const accessibleWorkspaces = useMemo(() => {
    if (isBroker) {
      return mockWorkspaces; // Brokers see all
    }
    // Agents see only their assigned workspaces
    return mockWorkspaces.filter((ws) =>
      ws.assignedAgents.some((agent) => agent.id === currentUser.id)
    );
  }, [isBroker]);

  // Apply search and status filters
  const filteredWorkspaces = useMemo(() => {
    return accessibleWorkspaces.filter((ws) => {
      const matchesSearch =
        ws.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || ws.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [accessibleWorkspaces, searchQuery, statusFilter]);

  // Sort: pinned first, then by last activity
  const sortedWorkspaces = useMemo(() => {
    return [...filteredWorkspaces].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
  }, [filteredWorkspaces]);

  const pinnedWorkspaces = sortedWorkspaces.filter((ws) => ws.isPinned);
  const recentWorkspaces = sortedWorkspaces.filter((ws) => !ws.isPinned);

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

  const WorkspaceItem = ({ workspace }: { workspace: Workspace }) => {
    const isActive = workspaceId === workspace.id;
    const stage = STAGES[workspace.currentStage];
    const statusConfig = WORKSPACE_STATUS_CONFIG[workspace.status];

    return (
      <button
        onClick={() => navigate(`/workspace/${workspace.id}`)}
        className={cn(
          "w-full text-left p-3 rounded-lg transition-all group",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold",
            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent text-sidebar-foreground"
          )}>
            {workspace.buyerName.split(" ").map((n) => n[0]).join("")}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{workspace.buyerName}</span>
                {workspace.isPinned && (
                  <Pin className="h-3 w-3 text-sidebar-primary flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs opacity-70 truncate">
                  {stage.icon} Stage {workspace.currentStage}
                </span>
                <span className="text-xs opacity-50">•</span>
                <span className="text-xs opacity-70">{formatLastActivity(workspace.lastActivity)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5 py-0 h-4 border", statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
                {workspace.openTasks > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-sidebar-accent">
                    {workspace.openTasks} tasks
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-40 border-r border-sidebar-border",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-sidebar-foreground mb-3">Workspaces</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyers..."
              className="pl-9 h-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              Filter
            </span>
            <ChevronRight className={cn("h-3 w-3 transition-transform", showFilters && "rotate-90")} />
          </Button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-sidebar-border">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as WorkspaceStatus | "all")}>
                <SelectTrigger className="h-8 bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under-contract">Under Contract</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Workspace List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Pinned Section */}
          {pinnedWorkspaces.length > 0 && !collapsed && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                <Pin className="h-3 w-3" />
                Pinned
              </div>
              <div className="space-y-1">
                {pinnedWorkspaces.map((ws) => (
                  <WorkspaceItem key={ws.id} workspace={ws} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          {recentWorkspaces.length > 0 && (
            <div>
              {!collapsed && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Recent
                </div>
              )}
              <div className="space-y-1">
                {recentWorkspaces.map((ws) => (
                  <WorkspaceItem key={ws.id} workspace={ws} />
                ))}
              </div>
            </div>
          )}

          {/* Collapsed view - just avatars */}
          {collapsed && (
            <div className="space-y-2 p-1">
              {sortedWorkspaces.map((ws) => (
                <WorkspaceItem key={ws.id} workspace={ws} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {sortedWorkspaces.length === 0 && !collapsed && (
            <div className="p-4 text-center text-sidebar-foreground/50 text-sm">
              No workspaces found
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-2">
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => navigate("/tasks")}
            >
              <CheckSquare className="h-4 w-4" />
              All Tasks
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </div>
      )}
    </aside>
  );
}
