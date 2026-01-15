import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  FileText, 
  Home as HomeIcon,
  DollarSign,
  BarChart3,
  Sparkles,
  ArrowLeft,
  Pin,
  Clock,
  X,
  Filter,
  ChevronRight,
  Search,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { whiteLabelConfig } from "@/config/whiteLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
import { STAGES } from "@/types";
import { WORKSPACE_STATUS_CONFIG, type WorkspaceStatus, type Workspace } from "@/types/workspace";

interface SidebarProps {
  collapsed: boolean;
  buyerContext?: {
    id: string;
    name: string;
  } | null;
  onBackToDashboard?: () => void;
}

// Minimal navigation items
const globalNavItems = [
  { title: "Agent", url: "/agentgpt", icon: Sparkles },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: FileText },
  { title: "Properties", url: "/properties", icon: HomeIcon },
  { title: "Offers", url: "/offers", icon: DollarSign },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export function Sidebar({ collapsed, buyerContext, onBackToDashboard }: SidebarProps) {
  const navigate = useNavigate();

  // If buyer is selected, show Buyer Rolodex
  if (buyerContext) {
    return (
      <BuyerRolodex
        collapsed={collapsed}
        currentBuyerId={buyerContext.id}
        onBackToDashboard={onBackToDashboard}
      />
    );
  }

  // Minimal global sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#f9fafb] text-foreground flex flex-col transition-all duration-200 z-50 border-r border-border/30",
        collapsed ? "w-[58px]" : "w-[240px]"
      )}
    >
      {/* Logo Header */}
      <div className={cn(
        "flex items-center h-14 border-b border-border/30",
        collapsed ? "justify-center px-2" : "px-4 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-foreground/70">
            {whiteLabelConfig.brokerage.shortName}
          </span>
        </div>
        {!collapsed && (
          <span className="text-sm font-medium text-foreground truncate">
            {whiteLabelConfig.brokerage.name}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {globalNavItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                  "text-foreground/60 hover:text-foreground hover:bg-muted/50",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-muted/50 text-foreground"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - User section */}
      <div className={cn(
        "border-t border-border/30 p-3",
        collapsed ? "flex justify-center" : ""
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground/70">JS</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-foreground/70">JS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">John Smith</p>
              <p className="text-xs text-muted-foreground truncate">Agent</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// Buyer Rolodex Component (shown when buyer is selected)
interface BuyerRolodexProps {
  collapsed: boolean;
  currentBuyerId: string;
  onBackToDashboard?: () => void;
}

function BuyerRolodex({ collapsed, currentBuyerId, onBackToDashboard }: BuyerRolodexProps) {
  const navigate = useNavigate();
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
    const isActive = currentBuyerId === workspace.buyerId || currentBuyerId === workspace.id;

    return (
      <button
        onClick={() => navigate(`/workspace/${workspace.id}`)}
        className={cn(
          "w-full text-left p-2.5 rounded-lg transition-all group",
          isActive
            ? "bg-muted/70 text-foreground"
            : "hover:bg-muted/50 text-foreground/70"
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium",
            isActive ? "bg-foreground/10 text-foreground" : "bg-muted text-foreground/50"
          )}>
            {workspace.buyerName.split(" ").map((n) => n[0]).join("")}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{workspace.buyerName}</span>
                {workspace.isPinned && (
                  <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground truncate">
                  Stage {workspace.currentStage}
                </span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <span className="text-xs text-muted-foreground">{formatLastActivity(workspace.lastActivity)}</span>
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
        "fixed left-0 top-0 h-screen bg-[#f9fafb] text-foreground flex flex-col transition-all duration-200 z-50 border-r border-border/30",
        collapsed ? "w-[58px]" : "w-[240px]"
      )}
    >
      {/* Back to Dashboard */}
      <div className={cn(
        "h-14 border-b border-border/30 flex items-center",
        collapsed ? "justify-center px-2" : "px-3"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToDashboard}
          className={cn(
            "text-foreground/60 hover:text-foreground hover:bg-muted/50",
            collapsed ? "w-8 h-8 p-0" : "gap-2"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Back</span>}
        </Button>
      </div>

      {/* Search & Filters */}
      {!collapsed && (
        <div className="p-3 border-b border-border/30">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyers..."
              className="pl-8 h-8 text-sm bg-muted/30 border-0 text-foreground placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              Filter
            </span>
            <ChevronRight className={cn("h-3 w-3 transition-transform", showFilters && "rotate-90")} />
          </Button>

          {showFilters && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as WorkspaceStatus | "all")}>
                <SelectTrigger className="h-7 text-xs bg-muted/30 border-0 text-foreground">
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
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
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
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
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
            <div className="p-4 text-center text-muted-foreground/50 text-sm">
              No buyers found
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
