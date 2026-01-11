import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Clock, 
  Home, 
  DollarSign, 
  FileText, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { STAGES } from "@/types";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
import { mockBuyers } from "@/data/mockData";

// Components
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceOverview } from "@/components/workspace/WorkspaceOverview";
import { WorkspaceTimeline } from "@/components/workspace/WorkspaceTimeline";
import { WorkspaceProperties } from "@/components/workspace/WorkspaceProperties";
import { WorkspaceOffers } from "@/components/workspace/WorkspaceOffers";
import { WorkspaceTasks } from "@/components/workspace/WorkspaceTasks";
import { WorkspaceMessages } from "@/components/workspace/WorkspaceMessages";
import { TopBar } from "@/components/dashboard/TopBar";

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Workspace not found</h2>
          <p className="text-muted-foreground mb-4">The workspace you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/workspace")}>Go to Workspaces</Button>
        </div>
      </div>
    );
  }

  const userRole = currentUser.role;
  const isBroker = (userRole as string) === "broker";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Workspace Sidebar */}
      <WorkspaceSidebar collapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 pt-14",
          sidebarCollapsed ? "ml-16" : "ml-72"
        )}
      >
        {/* Workspace Header */}
        <WorkspaceHeader workspace={workspace} userRole={userRole} />

        {/* Tabbed Content */}
        <main className="p-6">
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
  );
}
