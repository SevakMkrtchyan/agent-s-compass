import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Clock, 
  Home, 
  DollarSign, 
  FileText, 
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
import { mockBuyers } from "@/data/mockData";
import { generateMockConversation } from "@/data/conversationData";
import type { StageGroup } from "@/types/conversation";
import type { Stage } from "@/types";

// Layout Components
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

// Workspace Components
import { WorkspaceRolodex } from "@/components/workspace/WorkspaceRolodex";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { ConversationStream } from "@/components/workspace/ConversationStream";
import { ContextPanel } from "@/components/workspace/ContextPanel";

// Deep View Components (tabs demoted to sheets)
import { WorkspaceTimeline } from "@/components/workspace/WorkspaceTimeline";
import { WorkspaceProperties } from "@/components/workspace/WorkspaceProperties";
import { WorkspaceOffers } from "@/components/workspace/WorkspaceOffers";
import { WorkspaceTasks } from "@/components/workspace/WorkspaceTasks";

type DeepView = "timeline" | "properties" | "offers" | "tasks" | null;

const DEEP_VIEW_CONFIG = {
  timeline: { title: "Timeline", icon: Clock },
  properties: { title: "Properties & Comps", icon: Home },
  offers: { title: "Offers", icon: DollarSign },
  tasks: { title: "Tasks & Documents", icon: FileText },
};

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rolodexCollapsed, setRolodexCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDeepView, setActiveDeepView] = useState<DeepView>(null);
  const [deepViewFullscreen, setDeepViewFullscreen] = useState(false);

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

  // Handle sending messages
  const handleSendMessage = useCallback((content: string) => {
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

  // Handle opening deep views
  const handleOpenDeepView = useCallback((view: DeepView) => {
    setActiveDeepView(view);
    setDeepViewFullscreen(false);
  }, []);

  // Handle closing deep view
  const handleCloseDeepView = useCallback(() => {
    setActiveDeepView(null);
    setDeepViewFullscreen(false);
  }, []);

  // If no workspace found
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
      {/* Admin Sidebar */}
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

        {/* Workspace Layout */}
        <div className="flex h-[calc(100vh-56px)]">
          {/* Rolodex Panel */}
          <WorkspaceRolodex 
            collapsed={rolodexCollapsed} 
            onToggle={() => setRolodexCollapsed(!rolodexCollapsed)} 
          />

          {/* Main Workspace Area - Split Pane */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Header */}
            <WorkspaceHeader workspace={workspace} userRole={userRole} />

            {/* Split Pane: Conversation (65-70%) + Context (30-35%) */}
            <div className="flex-1 flex overflow-hidden">
              {/* LEFT: Conversation Stream (Primary) */}
              <div className="flex-1 min-w-0" style={{ flex: "0 0 68%" }}>
                <ConversationStream
                  stages={conversationStages}
                  currentStage={workspace.currentStage}
                  onExpandStage={handleExpandStage}
                  onSendMessage={handleSendMessage}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onExpandBlock={handleExpandBlock}
                  onOpenDeepView={handleOpenDeepView}
                />
              </div>

              {/* RIGHT: Context Panel (Secondary) */}
              <div className="flex-shrink-0" style={{ flex: "0 0 32%" }}>
                <ContextPanel
                  currentStage={workspace.currentStage}
                  buyerName={workspace.buyerName}
                  buyerType={workspace.buyerType}
                  financingConfirmed={workspace.financingConfirmed}
                  marketContext={workspace.marketContext}
                  stages={conversationStages}
                  onOpenDeepView={handleOpenDeepView}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep View Sheet (Secondary Navigation) */}
      <Sheet open={activeDeepView !== null} onOpenChange={() => handleCloseDeepView()}>
        <SheetContent 
          side="right" 
          className={cn(
            "p-0 flex flex-col",
            deepViewFullscreen ? "w-full max-w-full sm:max-w-full" : "w-[600px] sm:max-w-[600px]"
          )}
        >
          <SheetHeader className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                {activeDeepView && (
                  <>
                    {(() => {
                      const Icon = DEEP_VIEW_CONFIG[activeDeepView].icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    {DEEP_VIEW_CONFIG[activeDeepView].title}
                  </>
                )}
              </SheetTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setDeepViewFullscreen(!deepViewFullscreen)}
                >
                  {deepViewFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleCloseDeepView}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-4">
            {activeDeepView === "timeline" && <WorkspaceTimeline buyer={buyer} />}
            {activeDeepView === "properties" && <WorkspaceProperties buyerId={workspace.buyerId} />}
            {activeDeepView === "offers" && <WorkspaceOffers buyerId={workspace.buyerId} />}
            {activeDeepView === "tasks" && <WorkspaceTasks buyer={buyer} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
