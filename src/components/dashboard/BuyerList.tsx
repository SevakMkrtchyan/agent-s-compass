import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  List, 
  ArrowUpDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Buyer, STAGES } from "@/types";
import { BuyerCard } from "@/components/buyer/BuyerCard";

interface BuyerListProps {
  buyers: Buyer[];
  selectedBuyers: string[];
  onSelectBuyer: (buyerId: string) => void;
  onSelectAll: () => void;
}

type ViewMode = "table" | "card";
type SortField = "name" | "stage" | "lastActivity";

const statusConfig = {
  "awaiting-approval": {
    label: "Awaiting Approval",
    icon: AlertCircle,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  "buyer-reviewing": {
    label: "Buyer Reviewing",
    icon: Clock,
    className: "bg-info/10 text-info border-info/20",
  },
  "ready-to-advance": {
    label: "Ready to Advance",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
};

export function BuyerList({ 
  buyers, 
  selectedBuyers, 
  onSelectBuyer, 
  onSelectAll 
}: BuyerListProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortField, setSortField] = useState<SortField>("lastActivity");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedBuyers = [...buyers].sort((a, b) => {
    const modifier = sortAsc ? 1 : -1;
    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name) * modifier;
      case "stage":
        return (a.currentStage - b.currentStage) * modifier;
      case "lastActivity":
        return (new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()) * modifier;
      default:
        return 0;
    }
  });

  const getRandomStatus = (buyerId: string) => {
    const statuses = ["awaiting-approval", "buyer-reviewing", "ready-to-advance"] as const;
    const index = parseInt(buyerId) % 3;
    return statuses[index];
  };

  const allSelected = buyers.length > 0 && selectedBuyers.length === buyers.length;

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">Buyers</h3>
          <Badge variant="secondary" className="text-xs">
            {buyers.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Buyer
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Property</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("stage")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Stage
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("lastActivity")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Last Activity
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBuyers.map((buyer) => {
              const status = getRandomStatus(buyer.id);
              const statusInfo = statusConfig[status];
              const StatusIcon = statusInfo.icon;
              const stage = STAGES.find((s) => s.stage === buyer.currentStage);

              return (
                <TableRow
                  key={buyer.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/buyer/${buyer.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedBuyers.includes(buyer.id)}
                      onCheckedChange={() => onSelectBuyer(buyer.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-sm font-medium text-foreground">
                          {buyer.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{buyer.name}</p>
                        <p className="text-xs text-muted-foreground">{buyer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {buyer.currentStage >= 1 ? "123 Main St" : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{stage?.icon}</span>
                      <span className="text-sm">{stage?.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("gap-1", statusInfo.className)}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(buyer.lastActivity).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBuyers.map((buyer) => (
            <BuyerCard
              key={buyer.id}
              buyer={buyer}
              onSelect={() => navigate(`/buyer/${buyer.id}`)}
            />
          ))}
        </div>
      )}

      {buyers.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No buyers found</p>
        </div>
      )}
    </div>
  );
}
