import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Search, 
  Pin, 
  Clock, 
  ChevronRight, 
  Filter,
  X,
  ChevronLeft
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

interface WorkspaceRolodexProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function WorkspaceRolodex({ collapsed, onToggle }: WorkspaceRolodexProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const isBroker = (currentUser.role as string) === "broker";

  // Filter workspaces based on role
  const accessibleWorkspaces = useMemo(() => {
    if (isBroker) {
      return mockWorkspaces;
    }
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
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted text-foreground/80"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {workspace.buyerName.split(" ").map((n) => n[0]).join("")}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{workspace.buyerName}</span>
                {workspace.isPinned && (
                  <Pin className="h-3 w-3 text-primary flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground truncate">
                  {stage.icon} Stage {workspace.currentStage}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{formatLastActivity(workspace.lastActivity)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] px-1.5 py-0 h-4", statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
                {workspace.openTasks > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
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
    <div
      className={cn(
        "h-full bg-card border-r border-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-sm font-semibold text-foreground">Buyers</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-muted-foreground hover:text-foreground ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search & Filters */}
      {!collapsed && (
        <div className="p-3 border-b border-border">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyers..."
              className="pl-8 h-8 text-sm bg-muted/50 border-0"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              Filter
            </span>
            <ChevronRight className={cn("h-3 w-3 transition-transform", showFilters && "rotate-90")} />
          </Button>

          {showFilters && (
            <div className="mt-2 pt-2 border-t border-border">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as WorkspaceStatus | "all")}>
                <SelectTrigger className="h-7 text-xs">
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
            <div className="mb-3">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <Pin className="h-3 w-3" />
                Pinned
              </div>
              <div className="space-y-0.5">
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
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Recent
                </div>
              )}
              <div className="space-y-0.5">
                {recentWorkspaces.map((ws) => (
                  <WorkspaceItem key={ws.id} workspace={ws} />
                ))}
              </div>
            </div>
          )}

          {/* Collapsed view */}
          {collapsed && (
            <div className="space-y-1">
              {sortedWorkspaces.map((ws) => (
                <WorkspaceItem key={ws.id} workspace={ws} />
              ))}
            </div>
          )}

          {sortedWorkspaces.length === 0 && !collapsed && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No workspaces found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
