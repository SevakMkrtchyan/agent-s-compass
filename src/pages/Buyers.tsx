import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Filter, X, Search, Edit2, Trash2, Mail, Phone, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuyers, type Buyer } from "@/hooks/useBuyers";
import { BuyerProfileModal } from "@/components/buyer/BuyerProfileModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function Buyers() {
  const navigate = useNavigate();
  const { buyers, isLoading, deleteBuyer } = useBuyers();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [deletingBuyerId, setDeletingBuyerId] = useState<string | null>(null);

  // Filter buyers
  const filteredBuyers = buyers.filter((buyer) => {
    const matchesSearch =
      buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (buyer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStage =
      selectedStage === "all" || buyer.current_stage === selectedStage;
    const matchesStatus =
      selectedStatus === "all" || buyer.pre_approval_status === selectedStatus;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedStage("all");
    setSelectedStatus("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedStage !== "all" ||
    selectedStatus !== "all" ||
    searchQuery !== "";

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const handleDeleteBuyer = async (id: string) => {
    await deleteBuyer.mutateAsync(id);
    setDeletingBuyerId(null);
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case "Home Search":
        return "bg-blue-100 text-blue-700";
      case "Offer Strategy":
        return "bg-amber-100 text-amber-700";
      case "Under Contract":
        return "bg-purple-100 text-purple-700";
      case "Closing Preparation":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Pre-Approved":
        return "bg-green-100 text-green-700";
      case "In Progress":
        return "bg-yellow-100 text-yellow-700";
      case "Not Started":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
            <Button className="gap-2" onClick={() => navigate("/add-buyer")}>
              <Plus className="h-4 w-4" />
              Add Buyer
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buyers..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
            </div>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Home Search">Home Search</SelectItem>
                <SelectItem value="Offer Strategy">Offer Strategy</SelectItem>
                <SelectItem value="Under Contract">Under Contract</SelectItem>
                <SelectItem value="Closing Preparation">Closing Preparation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Pre-Approval Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Pre-Approved">Pre-Approved</SelectItem>
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
              {isLoading ? "Loading..." : `${filteredBuyers.length} buyer${filteredBuyers.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Buyer Table */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Pre-Approval</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredBuyers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {buyers.length === 0 ? (
                        <div className="space-y-2">
                          <p>No buyers yet</p>
                          <Button variant="outline" size="sm" onClick={() => navigate("/add-buyer")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first buyer
                          </Button>
                        </div>
                      ) : (
                        "No buyers match your filters"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuyers.map((buyer) => (
                    <TableRow
                      key={buyer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/workspace/${buyer.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {buyer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium">{buyer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {buyer.email && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {buyer.email}
                            </div>
                          )}
                          {buyer.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {buyer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {buyer.budget_min || buyer.budget_max ? (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            {formatCurrency(buyer.budget_min)} - {formatCurrency(buyer.budget_max)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs", getStageColor(buyer.current_stage))}>
                          {buyer.current_stage || "Not Set"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs", getStatusColor(buyer.pre_approval_status))}>
                          {buyer.pre_approval_status || "Not Started"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(buyer.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBuyer(buyer);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingBuyerId(buyer.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>

      {/* Edit Buyer Modal */}
      {editingBuyer && (
        <BuyerProfileModal
          buyer={editingBuyer}
          open={!!editingBuyer}
          onOpenChange={(open) => !open && setEditingBuyer(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingBuyerId} onOpenChange={(open) => !open && setDeletingBuyerId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Buyer</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this buyer? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeletingBuyerId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingBuyerId && handleDeleteBuyer(deletingBuyerId)}
              disabled={deleteBuyer.isPending}
            >
              {deleteBuyer.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
