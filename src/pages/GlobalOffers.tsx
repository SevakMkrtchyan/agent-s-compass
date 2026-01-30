import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DollarSign, 
  Search,
  Calendar,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OfferWithDetails {
  id: string;
  propertyAddress: string;
  buyerName: string;
  buyerId: string;
  amount: number;
  listPrice: number;
  status: string;
  date: string;
}

export default function GlobalOffers() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("offers")
          .select(`
            id,
            offer_amount,
            status,
            created_at,
            buyer:buyers(id, name),
            property:properties(id, address, city, state, price)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const transformed: OfferWithDetails[] = (data || []).map((o: any) => ({
          id: o.id,
          propertyAddress: o.property 
            ? `${o.property.address}, ${o.property.city}, ${o.property.state}`
            : "Unknown Property",
          buyerName: o.buyer?.name || "Unknown Buyer",
          buyerId: o.buyer?.id || "",
          amount: Number(o.offer_amount),
          listPrice: o.property?.price ? Number(o.property.price) : Number(o.offer_amount),
          status: o.status.toLowerCase(),
          date: new Date(o.created_at).toISOString().split("T")[0],
        }));

        setOffers(transformed);
      } catch (err) {
        console.error("Error fetching offers:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOffers();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch = 
      offer.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || offer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground";
      case "submitted": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "countered": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "accepted": return "bg-green-500/10 text-green-600 border-green-200";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-200";
      case "withdrawn": return "bg-gray-500/10 text-gray-600 border-gray-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getOfferDiff = (amount: number, listPrice: number) => {
    const diff = ((amount - listPrice) / listPrice) * 100;
    if (diff > 0) return { icon: TrendingUp, text: `+${diff.toFixed(1)}%`, color: "text-green-600" };
    if (diff < 0) return { icon: TrendingDown, text: `${diff.toFixed(1)}%`, color: "text-red-600" };
    return { icon: Minus, text: "At list", color: "text-muted-foreground" };
  };

  // Stats
  const stats = {
    total: offers.length,
    active: offers.filter(o => ["submitted", "countered"].includes(o.status)).length,
    accepted: offers.filter(o => o.status === "accepted").length,
    totalValue: offers.reduce((sum, o) => sum + o.amount, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className={cn(
        "transition-all duration-200 min-h-screen",
        sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
      )}>
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Offers</h1>
            <p className="text-muted-foreground mt-1">Track all offers across buyer workspaces</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Offers</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Active Offers</div>
                <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Accepted</div>
                <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-2xl font-bold">${(stats.totalValue / 1000000).toFixed(2)}M</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by property or buyer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="countered">Countered</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Offers List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All Offers ({filteredOffers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOffers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No offers found
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOffers.map((offer) => {
                    const diff = getOfferDiff(offer.amount, offer.listPrice);
                    const DiffIcon = diff.icon;
                    
                    return (
                      <div
                        key={offer.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">
                              ${offer.amount.toLocaleString()}
                            </span>
                            <span className={cn("flex items-center gap-1 text-sm", diff.color)}>
                              <DiffIcon className="h-3 w-3" />
                              {diff.text}
                            </span>
                            <Badge className={getStatusColor(offer.status)}>
                              {offer.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {offer.propertyAddress}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{offer.buyerName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {offer.date}
                            </span>
                            <span>•</span>
                            <span>List: ${offer.listPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/workspace/${offer.buyerId}`)}
                          className="gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
