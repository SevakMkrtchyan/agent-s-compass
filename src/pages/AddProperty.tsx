import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Bed, Bath, Square, Calendar, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { mockBuyers, mockProperties } from "@/data/mockData";

type Step = "search" | "details";

interface MLSProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  mlsNumber: string;
  daysOnMarket: number;
  pricePerSqft: number;
  status: "active" | "pending" | "sold";
  images: string[];
  listingUrl?: string;
}

// Mock MLS search results
const mockMLSResults: MLSProperty[] = [
  {
    id: "mls-1",
    address: "2847 Sunset Boulevard",
    city: "Austin",
    state: "TX",
    zipCode: "78703",
    price: 549000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1950,
    yearBuilt: 2019,
    mlsNumber: "MLS12345678",
    daysOnMarket: 8,
    pricePerSqft: 282,
    status: "active",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
    listingUrl: "https://zillow.com/example",
  },
  {
    id: "mls-2",
    address: "1523 Oak Hill Lane",
    city: "Austin",
    state: "TX",
    zipCode: "78704",
    price: 675000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    yearBuilt: 2021,
    mlsNumber: "MLS23456789",
    daysOnMarket: 3,
    pricePerSqft: 281,
    status: "active",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
    listingUrl: "https://zillow.com/example2",
  },
  {
    id: "mls-3",
    address: "891 Meadow Creek Dr",
    city: "Round Rock",
    state: "TX",
    zipCode: "78665",
    price: 425000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1800,
    yearBuilt: 2017,
    mlsNumber: "MLS34567890",
    daysOnMarket: 15,
    pricePerSqft: 236,
    status: "pending",
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"],
  },
  {
    id: "mls-4",
    address: "456 Riverside Terrace",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    price: 899000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3200,
    yearBuilt: 2022,
    mlsNumber: "MLS45678901",
    daysOnMarket: 1,
    pricePerSqft: 281,
    status: "active",
    images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80"],
  },
];

export default function AddProperty() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"address" | "mls" | "location">("address");
  const [searchResults, setSearchResults] = useState<MLSProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MLSProperty | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Property assignment state
  const [assignedBuyers, setAssignedBuyers] = useState<string[]>([]);
  const [buyerStatuses, setBuyerStatuses] = useState<Record<string, { viewed: boolean; scheduled: boolean; favorited: boolean }>>({});
  const [agentNotes, setAgentNotes] = useState("");

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      // Filter mock results based on search
      const results = mockMLSResults.filter(p => 
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mlsNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.zipCode.includes(searchQuery)
      );
      setSearchResults(results.length > 0 ? results : mockMLSResults);
      setIsSearching(false);
    }, 800);
  };

  const handleSelectProperty = (property: MLSProperty) => {
    setSelectedProperty(property);
    setStep("details");
  };

  const handleBuyerToggle = (buyerId: string) => {
    setAssignedBuyers(prev => {
      if (prev.includes(buyerId)) {
        // Remove buyer and their status
        const { [buyerId]: _, ...rest } = buyerStatuses;
        setBuyerStatuses(rest);
        return prev.filter(id => id !== buyerId);
      } else {
        // Add buyer with default status
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

  const handleSave = () => {
    if (!selectedProperty) return;

    const assignedNames = assignedBuyers
      .map(id => mockBuyers.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    toast({
      title: "Property saved",
      description: assignedNames 
        ? `Property saved and assigned to ${assignedNames}`
        : "Property saved as unassigned",
    });

    navigate("/properties");
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
      {/* Header */}
      <header className="h-14 border-b border-border/30 flex items-center px-6 bg-[#f9fafb]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step === "details" ? setStep("search") : navigate(-1)}
          className="gap-2 text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "details" ? "Back to Search" : "Back"}
        </Button>
        <h1 className="ml-4 text-lg font-medium text-foreground">
          {step === "search" ? "Search MLS Properties" : "Property Details"}
        </h1>
      </header>

      {step === "search" ? (
        /* Step 1: MLS Search */
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Search Controls */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Select value={searchType} onValueChange={(val: "address" | "mls" | "location") => setSearchType(val)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="mls">MLS Number</SelectItem>
                  <SelectItem value="location">City/ZIP</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={
                    searchType === "address" ? "Enter property address..." :
                    searchType === "mls" ? "Enter MLS number..." :
                    "Enter city or ZIP code..."
                  }
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                {searchResults.length} Properties Found
              </h2>
              <div className="grid gap-4">
                {searchResults.map((property) => (
                  <div
                    key={property.id}
                    className="flex gap-4 p-4 border border-border/50 rounded-lg hover:border-foreground/20 transition-colors bg-card"
                  >
                    <div className="w-32 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={property.images[0]}
                        alt={property.address}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-foreground">{property.address}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.city}, {property.state} {property.zipCode}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {formatPrice(property.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          {property.bedrooms} bed
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {property.bathrooms} bath
                        </span>
                        <span className="flex items-center gap-1">
                          <Square className="h-3.5 w-3.5" />
                          {property.sqft.toLocaleString()} sqft
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          {property.mlsNumber}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded capitalize",
                          property.status === "active" && "bg-green-100 text-green-700",
                          property.status === "pending" && "bg-yellow-100 text-yellow-700",
                          property.status === "sold" && "bg-red-100 text-red-700"
                        )}>
                          {property.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {property.daysOnMarket} days on market · ${property.pricePerSqft}/sqft
                        </span>
                        <Button size="sm" onClick={() => handleSelectProperty(property)}>
                          Select Property
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-16 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Search for properties by address, MLS number, or location</p>
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Property Details & Assignment */
        <div className="max-w-4xl mx-auto py-8 px-6">
          {selectedProperty && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Property Info (Read-only) */}
              <div>
                <h2 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">
                  Property Information
                </h2>
                
                {/* Image Gallery */}
                <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                  <img
                    src={selectedProperty.images[0]}
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
                      <span className="font-medium">{selectedProperty.sqft.toLocaleString()}</span> sqft
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">MLS Number</span>
                      <p className="font-medium">{selectedProperty.mlsNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Days on Market</span>
                      <p className="font-medium">{selectedProperty.daysOnMarket}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price/sqft</span>
                      <p className="font-medium">${selectedProperty.pricePerSqft}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p className={cn(
                        "font-medium capitalize",
                        selectedProperty.status === "active" && "text-green-600",
                        selectedProperty.status === "pending" && "text-yellow-600",
                        selectedProperty.status === "sold" && "text-red-600"
                      )}>
                        {selectedProperty.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year Built</span>
                      <p className="font-medium">{selectedProperty.yearBuilt}</p>
                    </div>
                  </div>

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
                <h2 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">
                  Assignment & Notes
                </h2>

                {/* Assign to Buyers */}
                <div className="mb-6">
                  <Label className="text-xs text-muted-foreground">Assign to Buyer(s)</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={assignedBuyers.length === 0}
                        onCheckedChange={() => setAssignedBuyers([])}
                      />
                      <span className="text-sm text-muted-foreground">Unassigned (save for later)</span>
                    </label>
                    {mockBuyers.map((buyer) => (
                      <label
                        key={buyer.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={assignedBuyers.includes(buyer.id)}
                          onCheckedChange={() => handleBuyerToggle(buyer.id)}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{buyer.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">Stage {buyer.currentStage}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status per assigned buyer */}
                {assignedBuyers.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-xs text-muted-foreground">Property Status per Buyer</Label>
                    <div className="mt-2 space-y-3">
                      {assignedBuyers.map((buyerId) => {
                        const buyer = mockBuyers.find(b => b.id === buyerId);
                        const status = buyerStatuses[buyerId] || { viewed: false, scheduled: false, favorited: false };
                        return (
                          <div key={buyerId} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-2">{buyer?.name}</p>
                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <Checkbox
                                  checked={status.viewed}
                                  onCheckedChange={() => handleStatusChange(buyerId, "viewed")}
                                />
                                Viewed
                              </label>
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <Checkbox
                                  checked={status.scheduled}
                                  onCheckedChange={() => handleStatusChange(buyerId, "scheduled")}
                                />
                                Scheduled
                              </label>
                              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <Checkbox
                                  checked={status.favorited}
                                  onCheckedChange={() => handleStatusChange(buyerId, "favorited")}
                                />
                                Favorited
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Agent Notes */}
                <div className="mb-6">
                  <Label className="text-xs text-muted-foreground">Agent Notes</Label>
                  <Textarea
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Internal notes about this property..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-border/30">
                  <Button variant="ghost" onClick={() => setStep("search")}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Property
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
