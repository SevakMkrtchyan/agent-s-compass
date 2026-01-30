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
  UserPlus,
  Building,
  Users,
  Loader2,
  FileStack,
  Settings,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { whiteLabelConfig } from "@/config/whiteLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuyers, type Buyer } from "@/hooks/useBuyers";
import { useAuth } from "@/hooks/useAuth";
import { type WorkspaceStatus, type Workspace } from "@/types/workspace";

// Map stage name from database to stage number
const mapStageNameToNumber = (stageName: string | null): 0 | 1 | 2 | 3 | 4 | 5 => {
  const stageMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5> = {
    "Readiness & Expectations": 0,
    "Home Search": 1,
    "Offer Strategy": 2,
    "Under Contract": 3,
    "Closing Preparation": 4,
    "Closing & Post-Close": 5,
  };
  return stageMap[stageName || "Home Search"] ?? 1;
};

// Transform a Buyer record to Workspace format for UI compatibility
const mapBuyerToWorkspace = (buyer: Buyer): Workspace => ({
  id: buyer.id,
  buyerId: buyer.id,
  buyerName: buyer.name,
  buyerEmail: buyer.email || "",
  buyerPhone: buyer.phone || undefined,
  currentStage: mapStageNameToNumber(buyer.current_stage),
  status: "active" as WorkspaceStatus,
  assignedAgents: [],
  lastActivity: new Date(buyer.updated_at),
  createdAt: new Date(buyer.created_at),
  isPinned: false,
  openTasks: 0,
  totalProperties: 0,
  totalOffers: 0,
  buyerType: buyer.buyer_type as Workspace["buyerType"],
  financingConfirmed: buyer.pre_approval_status === "Approved",
});

interface SidebarProps {
  collapsed: boolean;
  agentExpanded?: boolean;
  onAgentExpandedChange?: (expanded: boolean) => void;
  selectedBuyerId?: string | null;
}

// Navigation items - without Workspace (consolidated into Agent)
const globalNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Buyers", url: "/buyers", icon: Users },
  { title: "Tasks", url: "/tasks", icon: FileText },
  { title: "Properties", url: "/properties", icon: HomeIcon },
  { title: "Offers", url: "/offers", icon: DollarSign },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Offer Templates", url: "/offer-templates", icon: FileStack },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, agentExpanded = false, onAgentExpandedChange, selectedBuyerId }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkspaceStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const { buyers, isLoading } = useBuyers();
  const { profile, isAuthenticated } = useAuth();

  // Get user initials
  const userInitials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const userName = profile?.name || "Guest";
  const userRole = profile?.role || "Agent";

  // Check if we're on agent-related pages
  const isAgentActive = location.pathname === "/agentgpt" || location.pathname.startsWith("/workspace");

  // Transform buyers to workspace format
  const accessibleWorkspaces = useMemo(() => {
    return buyers.map(mapBuyerToWorkspace);
  }, [buyers]);

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

  const handleAgentClick = () => {
    if (agentExpanded) {
      // Collapse and go to global agent view
      onAgentExpandedChange?.(false);
      navigate("/agentgpt");
    } else {
      // Expand the rolodex
      onAgentExpandedChange?.(true);
      navigate("/agentgpt");
    }
  };

  const handleBackClick = () => {
    onAgentExpandedChange?.(false);
    navigate("/agentgpt");
  };

  const handleNavItemClick = () => {
    // Collapse agent when navigating to other tabs
    onAgentExpandedChange?.(false);
  };

  const handleBuyerClick = (workspace: Workspace) => {
    navigate(`/workspace/${workspace.id}`);
  };

  const WorkspaceItem = ({ workspace }: { workspace: Workspace }) => {
    const isActive = selectedBuyerId === workspace.buyerId || selectedBuyerId === workspace.id;

    return (
      <button
        onClick={() => handleBuyerClick(workspace)}
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
                {isActive && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
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

  // Expanded Agent View with Buyer Rolodex
  if (agentExpanded && !collapsed) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-[#f9fafb] text-foreground flex flex-col transition-all duration-200 z-50 border-r border-border/30",
          "w-[240px]"
        )}
      >
        {/* Primary Action Buttons - Always visible */}
        <div className="px-2 pt-4 space-y-2">
          <Button
            onClick={() => navigate("/add-buyer")}
            className="w-full justify-start gap-2 bg-foreground text-background hover:bg-foreground/90"
            size="default"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>New Buyer</span>
          </Button>
          <Button
            onClick={() => navigate("/add-property")}
            variant="outline"
            className="w-full justify-start gap-2 border-foreground/20 hover:bg-muted/50"
            size="default"
          >
            <Building className="h-4 w-4 shrink-0" />
            <span>Add Property</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="px-3 py-3">
          <Separator className="bg-border/50" />
        </div>

        {/* Back to Agent Header */}
        <div className="px-3 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="w-full justify-start gap-2 text-foreground/60 hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Agent</span>
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
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
        </div>

        {/* Workspace List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Loading state */}
            {isLoading && (
              <div className="p-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            )}

            {/* Pinned Section */}
            {!isLoading && pinnedWorkspaces.length > 0 && (
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
            {!isLoading && recentWorkspaces.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Recent
                </div>
                <div className="space-y-0.5">
                  {recentWorkspaces.map((ws) => (
                    <WorkspaceItem key={ws.id} workspace={ws} />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && sortedWorkspaces.length === 0 && (
              <div className="p-4 text-center text-muted-foreground/50 text-sm">
                No buyers found
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer - User section */}
        <div className="border-t border-border/30 p-3">
          <div 
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate("/settings")}
          >
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-foreground/70">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Default collapsed/global sidebar
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

      {/* Primary Action Buttons */}
      <div className={cn("px-2 pt-4", collapsed ? "space-y-1" : "space-y-2")}>
        <Button
          onClick={() => navigate("/add-buyer")}
          className={cn(
            "w-full justify-start gap-2 bg-foreground text-background hover:bg-foreground/90",
            collapsed && "justify-center px-2"
          )}
          size={collapsed ? "icon" : "default"}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New Buyer</span>}
        </Button>
        <Button
          onClick={() => navigate("/add-property")}
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 border-foreground/20 hover:bg-muted/50",
            collapsed && "justify-center px-2"
          )}
          size={collapsed ? "icon" : "default"}
        >
          <Building className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Add Property</span>}
        </Button>
      </div>

      {/* Divider */}
      <div className="px-3 py-3">
        <Separator className="bg-border/50" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {/* Agent Tab - Special expandable behavior */}
          <li>
            <button
              onClick={handleAgentClick}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                "text-foreground/60 hover:text-foreground hover:bg-muted/50",
                isAgentActive && "bg-muted/50 text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Agent</span>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    agentExpanded && "rotate-90"
                  )} />
                </>
              )}
            </button>
          </li>

          {/* Other nav items */}
          {globalNavItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                onClick={handleNavItemClick}
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
          <div 
            className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center cursor-pointer hover:bg-foreground/20 transition-colors"
            onClick={() => navigate("/settings")}
          >
            <span className="text-xs font-medium text-foreground/70">{userInitials}</span>
          </div>
        ) : (
          <div 
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => navigate("/settings")}
          >
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-foreground/70">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userRole}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
