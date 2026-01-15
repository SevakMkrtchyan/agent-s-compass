import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Home, 
  DollarSign, 
  Sparkles,
  CheckSquare,
  Info,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
import { mockBuyers } from "@/data/mockData";
import { generateMockConversation } from "@/data/conversationData";
import type { StageGroup } from "@/types/conversation";
import type { Stage } from "@/types";
import { STAGES } from "@/types";

// Layout Components
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { GuidedAgentGPT } from "@/components/workspace/GuidedAgentGPT";
import { ProgressTab } from "@/components/workspace/ProgressTab";
import { DetailsInspector } from "@/components/workspace/DetailsInspector";

// Deep View Components (tabs)
import { WorkspaceTimeline } from "@/components/workspace/WorkspaceTimeline";
import { WorkspaceProperties } from "@/components/workspace/WorkspaceProperties";
import { WorkspaceOffers } from "@/components/workspace/WorkspaceOffers";
import { WorkspaceTasks } from "@/components/workspace/WorkspaceTasks";

type WorkspaceTab = "agentgpt" | "progress" | "properties" | "offers" | "tasks";

const WORKSPACE_TABS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
  { id: "agentgpt", label: "Agent", icon: Sparkles },
  { id: "progress", label: "Progress", icon: LayoutGrid },
  { id: "properties", label: "Properties", icon: Home },
  { id: "offers", label: "Offers", icon: DollarSign },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
];

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("agentgpt");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [prefillCommand, setPrefillCommand] = useState("");

  // Find workspace
  const workspace = useMemo(() => {
    return mockWorkspaces.find((ws) => ws.id === workspaceId);
  }, [workspaceId]);

  // Get buyer data
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

  // Initialize conversation stages
  const [conversationStages, setConversationStages] = useState<StageGroup[]>(() => 
    generateMockConversation(workspaceId || "ws-1", workspace?.currentStage || 1)
  );

  // Handle stage expansion
  const handleExpandStage = useCallback((stageId: Stage) => {
    setConversationStages(prev => prev.map(stage => ({
      ...stage,
      isExpanded: stage.stageId === stageId ? !stage.isExpanded : stage.isExpanded
    })));
  }, []);

  // Handle sending commands
  const handleSendCommand = useCallback((content: string) => {
    const currentStageId = workspace?.currentStage || 1;
    const newMessage = {
      id: `msg-${Date.now()}`,
      type: "human-message" as const,
      timestamp: new Date(),
      stageId: currentStageId,
      sender: "agent" as const,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      isImmutable: false,
    };

    setConversationStages(prev => prev.map(stage => 
      stage.stageId === currentStageId 
        ? { ...stage, items: [...stage.items, newMessage] }
        : stage
    ));
  }, [workspace?.currentStage]);

  // Handle approvals
  const handleApprove = useCallback((itemId: string) => {
    setConversationStages(prev => prev.map(stage => ({
      ...stage,
      items: stage.items.map(item => 
        item.id === itemId && item.type === "ai-explanation"
          ? { ...item, approvalStatus: "approved" as const, isVisibleToBuyer: true, approvedAt: new Date() }
          : item
      )
    })));
  }, []);

  const handleReject = useCallback((itemId: string) => {
    // In real app, this would open an edit modal
    console.log("Edit item:", itemId);
  }, []);

  // Handle block expansion
  const handleExpandBlock = useCallback((itemId: string) => {
    setConversationStages(prev => prev.map(stage => ({
      ...stage,
      items: stage.items.map(item => 
        item.id === itemId && item.type === "component-block"
          ? { ...item, isExpanded: !item.isExpanded }
          : item
      )
    })));
  }, []);

  // Handle prefill from Progress tab
  const handlePrefillAgentGPT = useCallback((command: string) => {
    setPrefillCommand(command);
    setActiveTab("agentgpt");
  }, []);

  // Handle back to dashboard
  const handleBackToDashboard = useCallback(() => {
    navigate("/agentgpt");
  }, [navigate]);

  // If no workspace found
  if (!workspace) {
    const firstWorkspace = mockWorkspaces[0];
    if (firstWorkspace && !workspaceId) {
      navigate(`/workspace/${firstWorkspace.id}`, { replace: true });
    }
    return (
      <div className="min-h-screen bg-background">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onBackToDashboard={handleBackToDashboard}
        />
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
  const buyerContext = {
    id: workspace.buyerId,
    name: workspace.buyerName,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Buyer Rolodex Sidebar (replaces global sidebar when buyer is selected) */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        buyerContext={buyerContext}
        onBackToDashboard={handleBackToDashboard}
      />

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

        {/* Workspace Layout */}
        <div className="h-[calc(100vh-56px)] flex flex-col">
          {/* Admin Header - Buyer Context Only */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
            <div className="flex items-center gap-4">
              {/* Buyer Avatar */}
              <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {workspace.buyerName.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              
              {/* Buyer Info */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{workspace.buyerName}</h1>
                  <Badge variant={workspace.status === "active" ? "default" : "secondary"} className="text-xs">
                    {workspace.status === "active" ? "Active" : workspace.status === "under-contract" ? "Under Contract" : "Closed"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {STAGES[workspace.currentStage].icon} Stage {workspace.currentStage} · {STAGES[workspace.currentStage].title}
                </p>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setDetailsOpen(true)}
              >
                <Info className="h-4 w-4" />
                Details
              </Button>
              <Button
                size="sm"
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Advance Stage
              </Button>
            </div>
          </div>

          {/* Internal Tab Navigation - Prominent Mode Switcher */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkspaceTab)} className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-background border-b flex-shrink-0">
              <div className="px-6 py-3">
                <TabsList className="h-10 w-auto inline-flex gap-1 bg-muted/50 p-1 rounded-lg">
                  {WORKSPACE_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isAgent = tab.id === "agentgpt";
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={cn(
                          "h-8 px-4 gap-2 rounded-md font-medium text-sm transition-all",
                          "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                          "data-[state=active]:text-foreground",
                          "text-muted-foreground hover:text-foreground",
                          isAgent && "data-[state=active]:text-accent"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4",
                          isAgent && "text-accent"
                        )} />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* AgentGPT Tab - Full Bleed, No Padding */}
            <TabsContent value="agentgpt" className="flex-1 m-0 p-0 overflow-hidden">
              <GuidedAgentGPT
                stages={conversationStages}
                currentStage={workspace.currentStage}
                buyerName={workspace.buyerName}
                buyer={buyer}
                onExpandStage={handleExpandStage}
                onSendCommand={handleSendCommand}
                onApprove={handleApprove}
                onReject={handleReject}
                onExpandBlock={handleExpandBlock}
                onOpenDetails={() => setDetailsOpen(true)}
                onPrefillFromProgress={(cmd) => setPrefillCommand(cmd)}
              />
            </TabsContent>

            {/* Progress Tab - Interactive Non-Authoring */}
            <TabsContent value="progress" className="flex-1 m-0 overflow-hidden">
              <ProgressTab
                stages={conversationStages}
                currentStage={workspace.currentStage}
                buyerName={workspace.buyerName}
                onPrefillAgentGPT={handlePrefillAgentGPT}
                onOpenDetails={() => setDetailsOpen(true)}
              />
            </TabsContent>

            {/* Properties & Comps Tab */}
            <TabsContent value="properties" className="flex-1 m-0 overflow-auto p-6">
              <WorkspaceProperties buyerId={workspace.buyerId} />
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers" className="flex-1 m-0 overflow-auto p-6">
              <WorkspaceOffers buyerId={workspace.buyerId} />
            </TabsContent>

            {/* Tasks & Documents Tab */}
            <TabsContent value="tasks" className="flex-1 m-0 overflow-auto p-6">
              <WorkspaceTasks buyer={buyer} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Inspector (Slide-over) */}
      <DetailsInspector
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        currentStage={workspace.currentStage}
        buyerName={workspace.buyerName}
        buyerType={workspace.buyerType}
        financingConfirmed={workspace.financingConfirmed}
        marketContext={workspace.marketContext}
        stages={conversationStages}
        onApprove={handleApprove}
        onReject={handleReject}
        onPrefillAgentGPT={handlePrefillAgentGPT}
      />
    </div>
  );
}