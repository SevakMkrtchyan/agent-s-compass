import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { 
  MessageCircle, 
  LayoutGrid, 
  Home, 
  DollarSign, 
  FolderOpen,
  Info,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Portal Components
import { PortalChat } from "@/components/portal/PortalChat";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { PortalProperties } from "@/components/portal/PortalProperties";
import { PortalOffers } from "@/components/portal/PortalOffers";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { PortalSidebar } from "@/components/portal/PortalSidebar";

export interface PortalBuyer {
  id: string;
  name: string;
  email: string | null;
  current_stage: string | null;
  budget_min: number | null;
  budget_max: number | null;
  pre_approval_status: string | null;
  pre_approval_amount: number | null;
  preferred_cities: string[] | null;
  property_types: string[] | null;
  min_beds: number | null;
  min_baths: number | null;
  must_haves: string | null;
  nice_to_haves: string | null;
  portal_token: string | null;
  conservative_min: number | null;
  conservative_max: number | null;
  target_min: number | null;
  target_max: number | null;
  stretch_min: number | null;
  stretch_max: number | null;
}

type PortalTab = "chat" | "dashboard" | "properties" | "offers" | "documents";

const PORTAL_TABS: { id: PortalTab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "dashboard", label: "Progress", icon: LayoutGrid },
  { id: "properties", label: "Properties", icon: Home },
  { id: "offers", label: "Offers", icon: DollarSign },
  { id: "documents", label: "Documents", icon: FolderOpen },
];

// Map stage name to stage number and emoji
const getStageInfo = (stageName: string | null): { number: number; emoji: string; name: string } => {
  const stageMap: Record<string, { number: number; emoji: string }> = {
    "Readiness & Expectations": { number: 0, emoji: "🎯" },
    "Financing & Capability": { number: 1, emoji: "💰" },
    "Market Intelligence & Search Setup": { number: 2, emoji: "🔍" },
    "Touring, Filtering & Convergence": { number: 3, emoji: "🏠" },
    "Offer Strategy & Submission": { number: 4, emoji: "📝" },
    "Negotiation & Contract": { number: 5, emoji: "🤝" },
    "Due Diligence & Inspections": { number: 6, emoji: "🔬" },
    "Appraisal & Lending": { number: 7, emoji: "📊" },
    "Final Walkthrough & Preparation": { number: 8, emoji: "✅" },
    "Closing & Post-Close": { number: 9, emoji: "🎉" },
  };
  
  const info = stageMap[stageName || ""] || { number: 1, emoji: "📋" };
  return { ...info, name: stageName || "Getting Started" };
};

export default function BuyerPortal() {
  const { buyerId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [buyer, setBuyer] = useState<PortalBuyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTab>("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function verifyAccess() {
      if (!buyerId || !token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("buyers")
          .select("id, name, email, current_stage, budget_min, budget_max, pre_approval_status, pre_approval_amount, preferred_cities, property_types, min_beds, min_baths, must_haves, nice_to_haves, portal_token, conservative_min, conservative_max, target_min, target_max, stretch_min, stretch_max")
          .eq("id", buyerId)
          .eq("portal_token", token)
          .single();

        if (error || !data) {
          console.error("Portal access denied:", error);
          setIsAuthenticated(false);
        } else {
          setBuyer(data as PortalBuyer);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Portal verification failed:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAccess();
  }, [buyerId, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !buyer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This portal link is invalid or has expired. Please contact your real estate agent for a new access link.
          </p>
        </div>
      </div>
    );
  }

  const stageInfo = getStageInfo(buyer.current_stage);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <PortalSidebar 
        collapsed={sidebarCollapsed}
        buyerName={buyer.name}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-200 min-h-screen",
          sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
        )}
      >
        {/* Top Bar - matches agent TopBar exactly */}
        <header className="h-14 bg-[#f9fafb] border-b border-border/30 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-foreground/70" />
              <span className="font-medium text-sm text-foreground">AgentGPT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground/70">
                {buyer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Workspace Layout - matches agent workspace */}
        <div className="h-[calc(100vh-56px)] flex flex-col">
          {/* Header Bar with buyer info */}
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
                  · {stageInfo.emoji} Stage {stageInfo.number}: {stageInfo.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation - matches agent workspace */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PortalTab)} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border/30 bg-[#f9fafb] flex-shrink-0">
              <TabsList className="h-auto bg-transparent px-4 gap-1">
                {PORTAL_TABS.map((tab) => {
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

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 m-0 p-0 overflow-hidden">
              <PortalChat buyer={buyer} />
            </TabsContent>

            {/* Dashboard/Progress Tab */}
            <TabsContent value="dashboard" className="flex-1 m-0 overflow-auto p-6">
              <PortalDashboard buyer={buyer} />
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="flex-1 m-0 overflow-auto p-6">
              <PortalProperties buyerId={buyer.id} />
            </TabsContent>

            {/* Offers Tab */}
            <TabsContent value="offers" className="flex-1 m-0 overflow-auto p-6">
              <PortalOffers buyerId={buyer.id} />
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="flex-1 m-0 overflow-auto p-6">
              <PortalDocuments buyerId={buyer.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
