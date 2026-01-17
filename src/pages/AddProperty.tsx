import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, Link2, FileEdit, 
  Check, Loader2, Bed, Bath, Square, MapPin, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { mockBuyers } from "@/data/mockData";
import { MLSProperty } from "@/types/property";
import { STAGES } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PropertySearchTab } from "@/components/property/PropertySearchTab";
import { PasteLinkTab } from "@/components/property/PasteLinkTab";
import { ManualEntryTab } from "@/components/property/ManualEntryTab";

type Step = "input" | "assign";

export default function AddProperty() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>("input");
  const [activeTab, setActiveTab] = useState("search");
  const [selectedProperty, setSelectedProperty] = useState<MLSProperty | null>(null);

  // Property assignment state
  const [assignedBuyers, setAssignedBuyers] = useState<string[]>([]);
  const [buyerStatuses, setBuyerStatuses] = useState<Record<string, { viewed: boolean; scheduled: boolean; favorited: boolean }>>({});
  const [agentNotes, setAgentNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectProperty = (property: MLSProperty) => {
    setSelectedProperty(property);
    setStep("assign");
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

  const handleSave = async () => {
    if (!selectedProperty) return;
    setIsSaving(true);

    try {
      // First, upsert the property to the properties table
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .upsert({
          mls_id: selectedProperty.mlsId || selectedProperty.id,
          mls_number: selectedProperty.mlsNumber,
          address: selectedProperty.address,
          city: selectedProperty.city,
          state: selectedProperty.state,
          zip_code: selectedProperty.zipCode,
          price: selectedProperty.price,
          bedrooms: selectedProperty.bedrooms,
          bathrooms: selectedProperty.bathrooms,
          sqft: selectedProperty.sqft,
          year_built: selectedProperty.yearBuilt,
          price_per_sqft: selectedProperty.pricePerSqft,
          days_on_market: selectedProperty.daysOnMarket,
          property_type: selectedProperty.propertyType,
          status: selectedProperty.status,
          description: selectedProperty.description,
          features: selectedProperty.features || [],
          photos: selectedProperty.photos || [],
          listing_url: selectedProperty.listingUrl,
          listing_agent: selectedProperty.listingAgent,
          lot_size: selectedProperty.lotSize,
          raw_data: selectedProperty.rawData || {},
        }, { 
          onConflict: "mls_id",
          ignoreDuplicates: false 
        })
        .select("id")
        .single();

      if (propertyError) throw propertyError;

      const propertyId = propertyData.id;

      // Create buyer_properties records for each assigned buyer
      if (assignedBuyers.length > 0) {
        const buyerPropertyRecords = assignedBuyers.map(buyerId => ({
          buyer_id: buyerId,
          property_id: propertyId,
          viewed: buyerStatuses[buyerId]?.viewed || false,
          scheduled_showing_datetime: buyerStatuses[buyerId]?.scheduled ? new Date().toISOString() : null,
          favorited: buyerStatuses[buyerId]?.favorited || false,
          agent_notes: agentNotes || null,
          archived: false,
        }));

        const { error: bpError } = await supabase
          .from("buyer_properties")
          .insert(buyerPropertyRecords);

        if (bpError) throw bpError;
      }

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

      navigate("/properties");
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Save Error",
        description: err instanceof Error ? err.message : "Failed to save property",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleBack = () => {
    if (step === "assign") {
      setStep("input");
      setSelectedProperty(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border/30 flex items-center px-6 bg-card sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "assign" ? "Back to Input" : "Back"}
        </Button>
        <div className="ml-4">
          <h1 className="text-lg font-medium text-foreground">Add Property</h1>
          <p className="text-xs text-muted-foreground">
            {step === "input" 
              ? "Search listings, paste a link, or add manually" 
              : "Assign property to buyers"}
          </p>
        </div>
      </header>

      {step === "input" ? (
        <div className="max-w-5xl mx-auto py-8 px-6">
          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-2">
                <Link2 className="h-4 w-4" />
                Paste Link
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <FileEdit className="h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-0">
              <PropertySearchTab onSelectProperty={handleSelectProperty} />
            </TabsContent>

            <TabsContent value="paste" className="mt-0">
              <PasteLinkTab onSelectProperty={handleSelectProperty} />
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <ManualEntryTab onSelectProperty={handleSelectProperty} />
            </TabsContent>
          </Tabs>
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
                    <p className="text-base font-medium text-foreground mt-1">
                      {selectedProperty.address}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
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

                  {selectedProperty.yearBuilt && (
                    <p className="text-sm text-muted-foreground">
                      Built {selectedProperty.yearBuilt}
                      {selectedProperty.lotSize && ` • ${selectedProperty.lotSize} lot`}
                    </p>
                  )}

                  {selectedProperty.description && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {selectedProperty.description}
                      </p>
                    </div>
                  )}

                  {selectedProperty.listingUrl && selectedProperty.listingUrl !== "#" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(selectedProperty.listingUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Original Listing
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Assignment */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Assign to Buyers
                </h2>

                <ScrollArea className="h-[400px] border border-border rounded-lg">
                  <div className="p-4 space-y-3">
                    {mockBuyers.map(buyer => {
                      const isAssigned = assignedBuyers.includes(buyer.id);
                      return (
                        <div
                          key={buyer.id}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            isAssigned 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={() => handleBuyerToggle(buyer.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{buyer.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  {STAGES[buyer.currentStage]?.title || "Unknown"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {buyer.buyerType || "Buyer"} • {buyer.marketContext || "Active"}
                              </p>
                              
                              {isAssigned && (
                                <div className="mt-3 flex flex-wrap gap-3">
                                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <Checkbox
                                      checked={buyerStatuses[buyer.id]?.viewed || false}
                                      onCheckedChange={() => handleStatusChange(buyer.id, "viewed")}
                                    />
                                    Viewed
                                  </label>
                                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <Checkbox
                                      checked={buyerStatuses[buyer.id]?.scheduled || false}
                                      onCheckedChange={() => handleStatusChange(buyer.id, "scheduled")}
                                    />
                                    Showing Scheduled
                                  </label>
                                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <Checkbox
                                      checked={buyerStatuses[buyer.id]?.favorited || false}
                                      onCheckedChange={() => handleStatusChange(buyer.id, "favorited")}
                                    />
                                    Favorited
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Agent Notes */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Agent Notes (Optional)
                  </h3>
                  <Textarea
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Add notes about this property..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {assignedBuyers.length > 0 
                          ? `Save & Assign to ${assignedBuyers.length} Buyer${assignedBuyers.length > 1 ? 's' : ''}`
                          : "Save Property"
                        }
                      </>
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
