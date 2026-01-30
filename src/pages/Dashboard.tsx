import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StageOverview } from "@/components/dashboard/StageOverview";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { BuyerList } from "@/components/dashboard/BuyerList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useBuyers } from "@/hooks/useBuyers";
import { useBuyersByStage, type ActionItem } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Map stage name to stage number
const stageNameToNumber: Record<string, number> = {
  "Readiness & Expectations": 0,
  "Financing & Capability": 1,
  "Market Intelligence & Search Setup": 2,
  "Touring, Filtering & Convergence": 3,
  "Offer Strategy & Submission": 4,
  "Negotiation & Contract": 5,
  "Due Diligence & Inspections": 6,
  "Appraisal & Lending": 7,
  "Final Walkthrough & Preparation": 8,
  "Closing & Post-Close": 9,
  "Home Search": 1,
};

// Transform DB buyer to local Buyer type for BuyerList
import type { Buyer as LocalBuyer, Stage } from "@/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);

  const { buyers: dbBuyers, isLoading } = useBuyers();

  // Transform DB buyers to local format
  const buyers: LocalBuyer[] = dbBuyers.map(buyer => ({
    id: buyer.id,
    name: buyer.name,
    email: buyer.email || "",
    phone: buyer.phone || undefined,
    currentStage: (stageNameToNumber[buyer.current_stage || ""] ?? 1) as Stage,
    createdAt: new Date(buyer.created_at),
    lastActivity: new Date(buyer.updated_at),
    financingConfirmed: buyer.pre_approval_status === "Approved",
    buyerType: buyer.buyer_type as LocalBuyer["buyerType"],
    pre_approval_status: buyer.pre_approval_status,
    pre_approval_amount: buyer.pre_approval_amount,
    budget_min: buyer.budget_min,
    budget_max: buyer.budget_max,
    preferred_cities: buyer.preferred_cities,
    property_types: buyer.property_types,
    min_beds: buyer.min_beds,
    min_baths: buyer.min_baths,
    must_haves: buyer.must_haves,
    nice_to_haves: buyer.nice_to_haves,
    agent_notes: buyer.agent_notes,
  }));

  // Filter buyers by search and stage
  const filteredBuyers = buyers.filter((buyer) => {
    const matchesSearch =
      buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === null || buyer.currentStage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleSelectBuyer = (buyerId: string) => {
    setSelectedBuyers((prev) =>
      prev.includes(buyerId)
        ? prev.filter((id) => id !== buyerId)
        : [...prev, buyerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBuyers.length === filteredBuyers.length) {
      setSelectedBuyers([]);
    } else {
      setSelectedBuyers(filteredBuyers.map((b) => b.id));
    }
  };

  const handleActionClick = (action: ActionItem) => {
    if (action.buyerId) {
      navigate(`/workspace/${action.buyerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
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
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Content Area */}
        <main className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Stage Overview */}
              <div className="mb-6">
                <StageOverview
                  selectedStage={selectedStage}
                  onStageClick={setSelectedStage}
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                {/* Action Queue */}
                <div className="lg:h-[calc(100vh-320px)]">
                  <ActionQueue onActionClick={handleActionClick} />
                </div>

                {/* Buyer List */}
                <BuyerList
                  buyers={filteredBuyers}
                  selectedBuyers={selectedBuyers}
                  onSelectBuyer={handleSelectBuyer}
                  onSelectAll={handleSelectAll}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Quick Actions */}
      <QuickActions
        selectedCount={selectedBuyers.length}
        onOpenWorkspace={() => {
          if (selectedBuyers.length === 1) {
            navigate(`/workspace/${selectedBuyers[0]}`);
          }
        }}
        onAdvanceStage={() => {
          console.log("Advance stage for:", selectedBuyers);
        }}
        onApproveContent={() => {
          console.log("Approve content for:", selectedBuyers);
        }}
        onAssignBuyer={() => {
          navigate("/add-buyer");
        }}
      />
    </div>
  );
}
