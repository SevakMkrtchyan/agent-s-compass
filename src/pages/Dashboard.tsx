import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StageOverview } from "@/components/dashboard/StageOverview";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { BuyerList } from "@/components/dashboard/BuyerList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { mockBuyers } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);

  // Filter buyers by search and stage
  const filteredBuyers = mockBuyers.filter((buyer) => {
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

  const handleActionClick = (action: { buyerId?: string }) => {
    if (action.buyerId) {
      navigate(`/buyer/${action.buyerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 pt-0",
          sidebarCollapsed ? "ml-16" : "ml-56"
        )}
      >

        {/* Content Area */}
        <main className="p-6">
          {/* Stage Overview */}
          <div className="mb-6">
            <StageOverview
              buyers={mockBuyers}
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
        </main>
      </div>

      {/* Quick Actions */}
      <QuickActions
        selectedCount={selectedBuyers.length}
        onOpenWorkspace={() => {
          if (selectedBuyers.length === 1) {
            navigate(`/buyer/${selectedBuyers[0]}`);
          }
        }}
        onAdvanceStage={() => {
          console.log("Advance stage for:", selectedBuyers);
        }}
        onApproveContent={() => {
          console.log("Approve content for:", selectedBuyers);
        }}
        onAssignBuyer={() => {
          console.log("Assign new buyer");
        }}
      />
    </div>
  );
}
