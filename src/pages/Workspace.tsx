import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Home, 
  DollarSign, 
  Sparkles,
  CheckSquare,
  Info,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useBuyer, type Buyer } from "@/hooks/useBuyers";
import { generateMockConversation } from "@/data/conversationData";
import type { StageGroup } from "@/types/conversation";
import type { Stage, Buyer as LocalBuyer } from "@/types";
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

// Transform DB Buyer to local Buyer type for components
const mapDbBuyerToLocal = (dbBuyer: Buyer): LocalBuyer => ({
  id: dbBuyer.id,
  name: dbBuyer.name,
  email: dbBuyer.email || "",
  phone: dbBuyer.phone || undefined,
  currentStage: mapStageNameToNumber(dbBuyer.current_stage),
  createdAt: new Date(dbBuyer.created_at),
  lastActivity: new Date(dbBuyer.updated_at),
  financingConfirmed: dbBuyer.pre_approval_status === "Approved",
  buyerType: dbBuyer.buyer_type as LocalBuyer["buyerType"],
  marketContext: undefined,
  // Extended profile fields for AgentGPT context
  pre_approval_status: dbBuyer.pre_approval_status,
  pre_approval_amount: dbBuyer.pre_approval_amount,
  budget_min: dbBuyer.budget_min,
  budget_max: dbBuyer.budget_max,
  preferred_cities: dbBuyer.preferred_cities,
  property_types: dbBuyer.property_types,
  min_beds: dbBuyer.min_beds,
  min_baths: dbBuyer.min_baths,
  must_haves: dbBuyer.must_haves,
  nice_to_haves: dbBuyer.nice_to_haves,
  agent_notes: dbBuyer.agent_notes,
});

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("agentgpt");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [prefillCommand, setPrefillCommand] = useState("");

  // Get initial action/command from URL
  const initialAction = searchParams.get('action') || undefined;
  const initialCommand = searchParams.get('command') || undefined;

  // Fetch buyer from database
  const { data: dbBuyer, isLoading } = useBuyer(workspaceId);

  // Transform to local format
  const buyer = useMemo(() => {
    if (!dbBuyer) return null;
    return mapDbBuyerToLocal(dbBuyer);
  }, [dbBuyer]);

  const currentStage = buyer?.currentStage ?? 1;

  // Initialize conversation stages
  const [conversationStages, setConversationStages] = useState<StageGroup[]>(() => 
    generateMockConversation(workspaceId || "", currentStage)
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
    const newMessage = {
      id: `msg-${Date.now()}`,
      type: "human-message" as const,
      timestamp: new Date(),
      stageId: currentStage,
      sender: "agent" as const,
      senderId: "agent-1",
      senderName: "Agent",
      content,
      isImmutable: false,
    };

    setConversationStages(prev => prev.map(stage => 
      stage.stageId === currentStage 
        ? { ...stage, items: [...stage.items, newMessage] }
        : stage
    ));
  }, [currentStage]);

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

  // Handle back to global agent view
  const handleBackToAgent = useCallback(() => {
    setAgentExpanded(false);
    navigate("/agentgpt");
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar 
          collapsed={sidebarCollapsed}
          agentExpanded={agentExpanded}
          onAgentExpandedChange={setAgentExpanded}
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
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // If no buyer found
  if (!buyer) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar 
          collapsed={sidebarCollapsed}
          agentExpanded={agentExpanded}
          onAgentExpandedChange={setAgentExpanded}
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
              <h2 className="text-xl font-semibold text-foreground mb-2">Buyer not found</h2>
              <p className="text-muted-foreground mb-4">Select a buyer from the list to view their workspace.</p>
              <Button onClick={() => navigate("/buyers")}>View Buyers</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar with Buyer Rolodex (expanded when in workspace) */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        agentExpanded={agentExpanded}
        onAgentExpandedChange={setAgentExpanded}
        selectedBuyerId={workspaceId}
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
                  {buyer.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">{buyer.name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  · Stage {currentStage}: {STAGES[currentStage].title}
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
                currentStage={currentStage}
                buyerName={buyer.name}
                buyer={buyer}
                onExpandStage={handleExpandStage}
                onSendCommand={handleSendCommand}
                onApprove={handleApprove}
                onReject={handleReject}
                onExpandBlock={handleExpandBlock}
                onOpenDetails={() => setDetailsOpen(true)}
                onPrefillFromProgress={(cmd) => setPrefillCommand(cmd)}
                initialAction={initialAction}
                initialCommand={initialCommand}
              />
            </TabsContent>

            {/* Progress Tab - Interactive Non-Authoring */}
            <TabsContent value="progress" className="flex-1 m-0 overflow-hidden">
              <ProgressTab
                stages={conversationStages}
                currentStage={currentStage}
                buyerName={buyer.name}
                buyerId={buyer.id}
                onPrefillAgentGPT={handlePrefillAgentGPT}
                onOpenDetails={() => setDetailsOpen(true)}
              />
            </TabsContent>

            {/* Properties & Comps Tab */}
            <TabsContent value="properties" className="flex-1 m-0 overflow-auto p-6">
              <WorkspaceProperties 
                buyerId={buyer.id} 
                onAgentCommand={handlePrefillAgentGPT}
              />
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers" className="flex-1 m-0 overflow-auto p-6">
              <WorkspaceOffers buyerId={buyer.id} onAgentCommand={handlePrefillAgentGPT} />
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
        currentStage={currentStage}
        buyerName={buyer.name}
        buyerType={buyer.buyerType}
        financingConfirmed={buyer.financingConfirmed}
        marketContext={buyer.marketContext}
        stages={conversationStages}
        onApprove={handleApprove}
        onReject={handleReject}
        onPrefillAgentGPT={handlePrefillAgentGPT}
      />
    </div>
  );
}
