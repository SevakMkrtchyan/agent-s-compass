import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
  Home, 
  Search,
  MapPin,
  Bed,
  Bath,
  Square,
  ExternalLink,
  Heart,
  Loader2,
  Users
} from "lucide-react";
import { useAllProperties } from "@/hooks/useAllProperties";

export default function GlobalProperties() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price-desc");

  const { properties, isLoading } = useAllProperties();

  const filteredProperties = properties
    .filter((property) => {
      const matchesSearch = property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || property.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "recent": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-200";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "sold": 
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
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
            <h1 className="text-2xl font-bold text-foreground">Properties & Comps</h1>
            <p className="text-muted-foreground mt-1">View all properties across all buyer workspaces</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by address or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Loading properties...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProperties.length === 0 && (
            <div className="text-center py-16">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              {searchQuery || filterStatus !== "all" ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground">No properties match your filters</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStatus("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">No properties added yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Properties will appear here when you add them to buyer workspaces.
                  </p>
                  <Button size="sm" onClick={() => navigate("/add-property")}>
                    Add Property
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Property Grid */}
          {!isLoading && filteredProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-muted">
                    {property.images[0] ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge 
                      className={cn("absolute top-3 left-3 capitalize", getStatusColor(property.status))}
                    >
                      {property.status}
                    </Badge>
                    {property.buyerAssignments.some(a => a.favorited) && (
                      <div className="absolute top-3 right-3 p-2 bg-background/80 rounded">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">
                        {formatPrice(property.price)}
                      </h3>
                      {property.pricePerSqft && (
                        <span className="text-xs text-muted-foreground">
                          ${property.pricePerSqft}/sqft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm truncate">{property.address}, {property.city}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {property.bedrooms} beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {property.bathrooms} baths
                      </span>
                      <span className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        {property.sqft.toLocaleString()} sqft
                      </span>
                    </div>

                    {/* Buyer Assignments */}
                    {property.buyerAssignments.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Users className="h-3 w-3" />
                          Assigned to:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {property.buyerAssignments.slice(0, 3).map((assignment, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:bg-secondary/80"
                              onClick={() => navigate(`/workspace/${assignment.buyerId}`)}
                            >
                              {assignment.buyerName}
                              {assignment.favorited && (
                                <Heart className="h-2 w-2 ml-1 fill-red-500 text-red-500" />
                              )}
                            </Badge>
                          ))}
                          {property.buyerAssignments.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{property.buyerAssignments.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        if (property.buyerAssignments.length === 1) {
                          navigate(`/workspace/${property.buyerAssignments[0].buyerId}?tab=properties`);
                        } else if (property.buyerAssignments.length > 1) {
                          // Navigate to first buyer's workspace
                          navigate(`/workspace/${property.buyerAssignments[0].buyerId}?tab=properties`);
                        } else {
                          // Property not assigned - go to add property flow
                          navigate("/add-property");
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {property.buyerAssignments.length > 0 ? "View in Workspace" : "Assign to Buyer"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
