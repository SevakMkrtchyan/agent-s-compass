import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BuyerList } from "@/components/dashboard/BuyerList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Filter, X } from "lucide-react";
import { mockBuyers } from "@/data/mockData";
import { STAGES } from "@/types";
import { cn } from "@/lib/utils";

export default function Buyers() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);

  // Filter buyers
  const filteredBuyers = mockBuyers.filter((buyer) => {
    const matchesSearch =
      buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage =
      selectedStage === "all" || buyer.currentStage === parseInt(selectedStage);
    const matchesBuyerType =
      selectedBuyerType === "all" || buyer.buyerType === selectedBuyerType;
    return matchesSearch && matchesStage && matchesBuyerType;
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

  const clearFilters = () => {
    setSelectedStage("all");
    setSelectedBuyerType("all");
    setSelectedStatus("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedStage !== "all" ||
    selectedBuyerType !== "all" ||
    selectedStatus !== "all" ||
    searchQuery !== "";

  // Count buyers by stage
  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.stage] = mockBuyers.filter((b) => b.currentStage === stage.stage).length;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className={cn(
          "transition-all duration-300 pt-0",
          sidebarCollapsed ? "ml-16" : "ml-56"
        )}
      >
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Buyers
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your buyers and their home buying journey
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Buyer
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters:</span>
            </div>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.stage} value={stage.stage.toString()}>
                    <span className="flex items-center gap-2">
                      <span>{stage.icon}</span>
                      {stage.title}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {stageCounts[stage.stage]}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBuyerType} onValueChange={setSelectedBuyerType}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Buyer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="first-time">First-Time Buyer</SelectItem>
                <SelectItem value="move-up">Move-Up Buyer</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="downsizing">Downsizing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="awaiting-approval">Awaiting Approval</SelectItem>
                <SelectItem value="buyer-reviewing">Buyer Reviewing</SelectItem>
                <SelectItem value="ready-to-advance">Ready to Advance</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              Showing {filteredBuyers.length} of {mockBuyers.length} buyers
            </div>
          </div>

          {/* Buyer List */}
          <BuyerList
            buyers={filteredBuyers}
            selectedBuyers={selectedBuyers}
            onSelectBuyer={handleSelectBuyer}
            onSelectAll={handleSelectAll}
          />
        </main>
      </div>
    </div>
  );
}
