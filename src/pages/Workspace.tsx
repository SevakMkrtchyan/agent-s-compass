import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Clock, 
  Home, 
  DollarSign, 
  FileText, 
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
import { mockBuyers } from "@/data/mockData";

// Layout Components
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

// Workspace Components
import { WorkspaceRolodex } from "@/components/workspace/WorkspaceRolodex";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceOverview } from "@/components/workspace/WorkspaceOverview";
import { WorkspaceTimeline } from "@/components/workspace/WorkspaceTimeline";
import { WorkspaceProperties } from "@/components/workspace/WorkspaceProperties";
import { WorkspaceOffers } from "@/components/workspace/WorkspaceOffers";
import { WorkspaceTasks } from "@/components/workspace/WorkspaceTasks";
import { WorkspaceAIEducation } from "@/components/workspace/WorkspaceAIEducation";

const WORKSPACE_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "properties", label: "Properties & Comps", icon: Home },
  { id: "offers", label: "Offers", icon: DollarSign },
  { id: "tasks", label: "Tasks & Documents", icon: FileText },
  { id: "messages", label: "Messages & AI Guidance", icon: MessageSquare },
] as const;

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rolodexCollapsed, setRolodexCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Find workspace
  const workspace = useMemo(() => {
    return mockWorkspaces.find((ws) => ws.id === workspaceId);
  }, [workspaceId]);

  // Get buyer data for existing components
  const buyer = useMemo(() => {
    if (!workspace) return mockBuyers[0];
    return mockBuyers.find((b) => b.id === workspace.buyerId) || {
      id: workspace.buyerId,
      name: workspace.buyerName,
      email: workspace.buyerEmail,
      phone: workspace.buyerPhone,
      currentStage: workspace.currentStage,
      createdAt: workspace.createdAt,
      lastActivity: workspace.lastActivity,
      financingConfirmed: workspace.financingConfirmed,
      buyerType: workspace.buyerType,
      marketContext: workspace.marketContext,
    };
  }, [workspace]);

  // If no workspace found, redirect to first workspace or show empty state
  if (!workspace) {
    const firstWorkspace = mockWorkspaces[0];
    if (firstWorkspace && !workspaceId) {
      navigate(`/workspace/${firstWorkspace.id}`, { replace: true });
    }
    return (
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} />
        <div className={cn(
          "transition-all duration-200 min-h-screen",
          sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
        )}>
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
          />
          <div className="flex items-center justify-center h-[calc(100vh-56px)]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">No workspace selected</h2>
              <p className="text-muted-foreground mb-4">Select a buyer from the list to view their workspace.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userRole = currentUser.role;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Sidebar - Always visible */}
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

        {/* Workspace Layout: Rolodex + Content */}
        <div className="flex h-[calc(100vh-56px)]">
          {/* Rolodex Panel - Buyer List */}
          <WorkspaceRolodex 
            collapsed={rolodexCollapsed} 
            onToggle={() => setRolodexCollapsed(!rolodexCollapsed)} 
          />

          {/* Workspace Content Shell */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            {/* Workspace Header - Compact */}
            <WorkspaceHeader workspace={workspace} userRole={userRole} />

            {/* Tab-based Workspace Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              {/* Prominent Tab Navigation Bar - Always visible */}
              <div className="bg-card border-b flex-shrink-0">
                <div className="px-6">
                  <TabsList className="h-11 w-full justify-start gap-0 bg-transparent p-0 rounded-none border-0">
                    {WORKSPACE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className={cn(
                            "h-11 px-4 gap-2 rounded-none border-b-2 border-transparent relative",
                            "data-[state=active]:border-primary data-[state=active]:bg-transparent",
                            "data-[state=active]:text-foreground data-[state=active]:shadow-none",
                            "text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
                            "font-medium text-sm"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
              </div>

              {/* Tab Content Area - Scrollable */}
              <div className="flex-1 overflow-auto">
                <TabsContent value="overview" className="m-0 p-6 min-h-full">
                  <WorkspaceOverview buyer={buyer} />
                </TabsContent>

                <TabsContent value="timeline" className="m-0 p-6 min-h-full">
                  <WorkspaceTimeline buyer={buyer} />
                </TabsContent>

                <TabsContent value="properties" className="m-0 p-6 min-h-full">
                  <WorkspaceProperties buyerId={workspace.buyerId} />
                </TabsContent>

                <TabsContent value="offers" className="m-0 p-6 min-h-full">
                  <WorkspaceOffers buyerId={workspace.buyerId} />
                </TabsContent>

                <TabsContent value="tasks" className="m-0 p-6 min-h-full">
                  <WorkspaceTasks buyer={buyer} />
                </TabsContent>

                <TabsContent value="messages" className="m-0 p-6 min-h-full">
                  <WorkspaceAIEducation buyer={buyer} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
