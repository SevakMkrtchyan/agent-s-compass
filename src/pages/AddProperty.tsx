import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, MapPin, Bed, Bath, Square, Calendar, 
  ExternalLink, Check, Filter, ChevronDown, ChevronUp, X,
  Loader2, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { mockBuyers } from "@/data/mockData";
import { usePropertySearch } from "@/hooks/usePropertySearch";
import { MLSProperty } from "@/types/property";
import { STAGES } from "@/types";

type Step = "search" | "details";

export default function AddProperty() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { search, results, isSearching, clearResults } = usePropertySearch();
  
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<MLSProperty | null>(null);

  // Filter state
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState<string>("any");
  const [minBaths, setMinBaths] = useState<string>("any");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("active");

  // Property assignment state
  const [assignedBuyers, setAssignedBuyers] = useState<string[]>([]);
  const [buyerStatuses, setBuyerStatuses] = useState<Record<string, { viewed: boolean; scheduled: boolean; favorited: boolean }>>({});
  const [agentNotes, setAgentNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    await search({
      location: searchQuery,
      minPrice: minPrice ? parseInt(minPrice.replace(/,/g, "")) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice.replace(/,/g, "")) : undefined,
      minBeds: minBeds !== "any" ? parseInt(minBeds) : undefined,
      minBaths: minBaths !== "any" ? parseInt(minBaths) : undefined,
      propertyType: propertyTypes.length > 0 ? propertyTypes : undefined,
      status: statusFilter,
    });
  };

  const handleSelectProperty = (property: MLSProperty) => {
    setSelectedProperty(property);
    setStep("details");
  };

  const handleBuyerToggle = (buyerId: string) => {
    setAssignedBuyers(prev => {
      if (prev.includes(buyerId)) {
        const { [buyerId]: _, ...rest } = buyerStatuses;
        setBuyerStatuses(rest);
        return prev.filter(id => id !== buyerId);
      } else {
        setBuyerStatuses(prev => ({
          ...prev,
          [buyerId]: { viewed: false, scheduled: false, favorited: false }
        }));
        return [...prev, buyerId];
      }
    });
  };

  const handleStatusChange = (buyerId: string, field: "viewed" | "scheduled" | "favorited") => {
    setBuyerStatuses(prev => ({
      ...prev,
      [buyerId]: {
        ...prev[buyerId],
        [field]: !prev[buyerId]?.[field]
      }
    }));
  };

  const handlePropertyTypeToggle = (type: string) => {
    setPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSave = async () => {
    if (!selectedProperty) return;
    setIsSaving(true);

    // TODO: Save to database
    await new Promise(resolve => setTimeout(resolve, 800));

    const assignedNames = assignedBuyers
      .map(id => mockBuyers.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    toast({
      title: "Property saved",
      description: assignedNames 
        ? `Property saved and assigned to ${assignedNames}. AI analysis will generate automatically.`
        : "Property saved as unassigned",
    });

    setIsSaving(false);
    navigate("/properties");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPriceInput = (value: string) => {
    const num = value.replace(/[^\d]/g, "");
    if (!num) return "";
    return parseInt(num).toLocaleString();
  };

  const propertyTypeOptions = [
    { value: "single_family", label: "Single Family" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "multi_family", label: "Multi-Family" },
    { value: "land", label: "Land" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border/30 flex items-center px-6 bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step === "details" ? setStep("search") : navigate(-1)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "details" ? "Back to Search" : "Back"}
        </Button>
        <div className="ml-4">
          <h1 className="text-lg font-medium text-foreground">Add Property</h1>
          <p className="text-xs text-muted-foreground">
            {step === "search" ? "Search MLS listings to add to your workspace" : "Assign property to buyers"}
          </p>
        </div>
      </header>

      {step === "search" ? (
        <div className="max-w-5xl mx-auto py-8 px-6">
          {/* Search Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by address, city, or ZIP..."
                  className="pl-10 h-11"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="h-11 px-6">
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 text-muted-foreground"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-card">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Price Range */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Min Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        value={minPrice}
                        onChange={(e) => setMinPrice(formatPriceInput(e.target.value))}
                        placeholder="0"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Max Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(formatPriceInput(e.target.value))}
                        placeholder="Any"
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Bedrooms</Label>
                    <Select value={minBeds} onValueChange={setMinBeds}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Bathrooms</Label>
                    <Select value={minBaths} onValueChange={setMinBaths}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Property Types */}
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Property Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypeOptions.map(type => (
                      <button
                        key={type.value}
                        onClick={() => handlePropertyTypeToggle(type.value)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-md border transition-colors",
                          propertyTypes.includes(type.value)
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-foreground border-border hover:border-foreground/50"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSearch} disabled={isSearching}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <Skeleton className="aspect-video" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {results.length} properties found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((property) => (
                  <PropertySearchCard 
                    key={property.id} 
                    property={property} 
                    onSelect={() => handleSelectProperty(property)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">No properties found</p>
              <p className="text-sm">Enter a location to search for properties</p>
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Property Details & Assignment */
        <div className="max-w-5xl mx-auto py-8 px-6">
          {selectedProperty && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Property Info (Read-only) */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Property Information
                </h2>
                
                {/* Image Gallery */}
                <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                  <img
                    src={selectedProperty.photos[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"}
                    alt={selectedProperty.address}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatPrice(selectedProperty.price)}
                    </p>
                    <p className="text-foreground font-medium">{selectedProperty.address}</p>
                    <p className="text-muted-foreground text-sm">
                      {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedProperty.bedrooms}</span> beds
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedProperty.bathrooms}</span> baths
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedProperty.sqft?.toLocaleString()}</span> sqft
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">MLS Number</span>
                      <p className="font-medium">{selectedProperty.mlsNumber || selectedProperty.mlsId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Days on Market</span>
                      <p className="font-medium">{selectedProperty.daysOnMarket || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price/sqft</span>
                      <p className="font-medium">${selectedProperty.pricePerSqft || Math.round(selectedProperty.price / selectedProperty.sqft)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className={cn(
                        "font-medium capitalize",
                        selectedProperty.status === "active" && "text-emerald-600",
                        selectedProperty.status === "pending" && "text-amber-600",
                        selectedProperty.status === "sold" && "text-red-600"
                      )}>
                        {selectedProperty.status}
                      </p>
                    </div>
                    {selectedProperty.yearBuilt && (
                      <div>
                        <span className="text-muted-foreground">Year Built</span>
                        <p className="font-medium">{selectedProperty.yearBuilt}</p>
                      </div>
                    )}
                    {selectedProperty.lotSize && (
                      <div>
                        <span className="text-muted-foreground">Lot Size</span>
                        <p className="font-medium">{selectedProperty.lotSize}</p>
                      </div>
                    )}
                  </div>

                  {selectedProperty.description && (
                    <div>
                      <span className="text-muted-foreground text-sm">Description</span>
                      <p className="text-sm mt-1 text-foreground/80">{selectedProperty.description}</p>
                    </div>
                  )}

                  {selectedProperty.features && selectedProperty.features.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm">Features</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedProperty.features.map((feature, i) => (
                          <span key={i} className="px-2 py-1 bg-muted text-xs rounded-md">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProperty.listingUrl && (
                    <a
                      href={selectedProperty.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Original Listing
                    </a>
                  )}
                </div>
              </div>

              {/* Right: Assignment & Notes */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Assignment & Notes
                </h2>

                {/* Assign to Buyers */}
                <div className="mb-6">
                  <Label className="text-xs text-muted-foreground">Assign to Buyer(s)</Label>
                  <ScrollArea className="mt-2 h-64 border border-border rounded-lg">
                    <div className="p-2 space-y-1">
                      <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={assignedBuyers.length === 0}
                          onCheckedChange={() => setAssignedBuyers([])}
                        />
                        <span className="text-sm text-muted-foreground">Unassigned (save for later)</span>
                      </label>
                      {mockBuyers.map((buyer) => {
                        const stage = STAGES[buyer.currentStage];
                        return (
                          <div key={buyer.id} className="border-b border-border/50 last:border-0">
                            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                              <Checkbox
                                checked={assignedBuyers.includes(buyer.id)}
                                onCheckedChange={() => handleBuyerToggle(buyer.id)}
                              />
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {buyer.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{buyer.name}</p>
                                <p className="text-xs text-muted-foreground">Stage {buyer.currentStage}: {stage.title}</p>
                              </div>
                            </label>
                            
                            {/* Status checkboxes when buyer is selected */}
                            {assignedBuyers.includes(buyer.id) && (
                              <div className="pl-14 pb-2 flex gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox
                                    checked={buyerStatuses[buyer.id]?.viewed}
                                    onCheckedChange={() => handleStatusChange(buyer.id, "viewed")}
                                  />
                                  <span className="text-xs text-muted-foreground">Viewed</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox
                                    checked={buyerStatuses[buyer.id]?.scheduled}
                                    onCheckedChange={() => handleStatusChange(buyer.id, "scheduled")}
                                  />
                                  <span className="text-xs text-muted-foreground">Schedule showing</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox
                                    checked={buyerStatuses[buyer.id]?.favorited}
                                    onCheckedChange={() => handleStatusChange(buyer.id, "favorited")}
                                  />
                                  <span className="text-xs text-muted-foreground">Favorite</span>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Agent Notes */}
                <div className="mb-6">
                  <Label htmlFor="notes" className="text-xs text-muted-foreground">Agent Notes</Label>
                  <Textarea
                    id="notes"
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Add internal notes about this property (not visible to buyer)..."
                    className="mt-2 min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {agentNotes.length}/500
                  </p>
                </div>

                {/* AI Analysis Note */}
                {assignedBuyers.length > 0 && (
                  <div className="mb-6 p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">
                      ✨ AI comparative analysis will be automatically generated for each assigned buyer based on their profile and preferences.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("search")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Property"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Property Search Card Component
function PropertySearchCard({ 
  property, 
  onSelect, 
  formatPrice 
}: { 
  property: MLSProperty; 
  onSelect: () => void;
  formatPrice: (price: number) => string;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card hover:border-foreground/30 transition-colors group">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={property.photos[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"}
          alt={property.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded capitalize",
            property.status === "active" && "bg-emerald-500 text-white",
            property.status === "pending" && "bg-amber-500 text-white",
            property.status === "sold" && "bg-red-500 text-white"
          )}>
            {property.status}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-lg font-semibold text-foreground mb-1">
          {formatPrice(property.price)}
        </p>
        <p className="text-sm text-foreground font-medium">{property.address}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {property.city}, {property.state} {property.zipCode}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {property.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.bathrooms} ba
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-3.5 w-3.5" />
            {property.sqft?.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {property.daysOnMarket} days on market
          </span>
          <Button size="sm" onClick={onSelect}>
            Select Property
          </Button>
        </div>
      </div>
    </div>
  );
}
