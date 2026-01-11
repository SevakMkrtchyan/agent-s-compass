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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { STAGES } from "@/types";
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
import { WorkspaceMessages } from "@/components/workspace/WorkspaceMessages";

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

          {/* Workspace Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Workspace Header */}
            <WorkspaceHeader workspace={workspace} userRole={userRole} />

            {/* Tabbed Content */}
            <main className="flex-1 overflow-auto p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 bg-muted/50">
                  <TabsTrigger value="overview" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="gap-2">
                    <Home className="h-4 w-4" />
                    Properties & Comps
                  </TabsTrigger>
                  <TabsTrigger value="offers" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    Offers
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Tasks & Documents
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages & AI
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0">
                  <WorkspaceOverview buyer={buyer} />
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <WorkspaceTimeline buyer={buyer} />
                </TabsContent>

                <TabsContent value="properties" className="mt-0">
                  <WorkspaceProperties buyerId={workspace.buyerId} />
                </TabsContent>

                <TabsContent value="offers" className="mt-0">
                  <WorkspaceOffers buyerId={workspace.buyerId} />
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <WorkspaceTasks buyer={buyer} />
                </TabsContent>

                <TabsContent value="messages" className="mt-0">
                  <WorkspaceMessages workspaceId={workspace.id} userRole={userRole} />
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
