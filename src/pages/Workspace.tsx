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
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Workspace Layout - Full Height */}
        <div className="h-[calc(100vh-56px)] flex flex-col">
          {/* Minimal Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-[#f9fafb]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-foreground/10 flex items-center justify-center">
                <span className="text-xs font-medium text-foreground">
                  {workspace.buyerName.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">{workspace.buyerName}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  · Stage {workspace.currentStage}: {STAGES[workspace.currentStage].title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setDetailsOpen(true)}>
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Minimal Tab Navigation */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkspaceTab)} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border/30 bg-[#f9fafb] flex-shrink-0">
              <TabsList className="h-auto bg-transparent px-4 gap-1">
                {WORKSPACE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "h-10 px-4 gap-2 text-sm transition-all border-b-2 border-transparent -mb-px rounded-none",
                        "data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none",
                        "text-muted-foreground hover:text-foreground bg-transparent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
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