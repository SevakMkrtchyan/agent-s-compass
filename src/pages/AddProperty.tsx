import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Search, Link2, FileEdit, 
  Check, Loader2, Bed, Bath, Square, MapPin, ExternalLink,
  Calendar, Sparkles, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useBuyers } from "@/hooks/useBuyers";
import { MLSProperty } from "@/types/property";
import { supabase } from "@/integrations/supabase/client";
import { PropertySearchTab } from "@/components/property/PropertySearchTab";
import { PasteLinkTab } from "@/components/property/PasteLinkTab";
import { ManualEntryTab } from "@/components/property/ManualEntryTab";

type Step = "input" | "assign";

export default function AddProperty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBuyerId = searchParams.get("buyerId");
  const { toast } = useToast();
  
  // Fetch buyers from database
  const { buyers, isLoading: isBuyersLoading } = useBuyers();
  
  const [step, setStep] = useState<Step>("input");
  const [activeTab, setActiveTab] = useState("search");
  const [selectedProperty, setSelectedProperty] = useState<MLSProperty | null>(null);

  // Property assignment state
  const [assignedBuyers, setAssignedBuyers] = useState<string[]>(
    preselectedBuyerId ? [preselectedBuyerId] : []
  );
  
  interface BuyerStatus {
    viewed: boolean;
    scheduled: boolean;
    favorited: boolean;
    showingDate?: string;
    showingTime?: string;
  }
  
  const [buyerStatuses, setBuyerStatuses] = useState<Record<string, BuyerStatus>>({});
  const [agentNotes, setAgentNotes] = useState("");
  const [generateAIAnalysis, setGenerateAIAnalysis] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToPool, setSaveToPool] = useState(false);

  const handleSelectProperty = (property: MLSProperty) => {
    setSelectedProperty(property);
    setStep("assign");
  };

  const handleBuyerToggle = (buyerId: string) => {
    if (buyerId === "unassigned") {
      setSaveToPool(!saveToPool);
      if (!saveToPool) {
        setAssignedBuyers([]);
      }
      return;
    }
    
    setSaveToPool(false);
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

  const handleShowingDateChange = (buyerId: string, date: string) => {
    setBuyerStatuses(prev => ({
      ...prev,
      [buyerId]: {
        ...prev[buyerId],
        showingDate: date
      }
    }));
  };

  const handleShowingTimeChange = (buyerId: string, time: string) => {
    setBuyerStatuses(prev => ({
      ...prev,
      [buyerId]: {
        ...prev[buyerId],
        showingTime: time
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
        const buyerPropertyRecords = assignedBuyers.map(buyerId => {
          const status = buyerStatuses[buyerId];
          let scheduledDatetime = null;
          
          if (status?.scheduled && status?.showingDate) {
            const timeStr = status.showingTime || "12:00";
            scheduledDatetime = new Date(`${status.showingDate}T${timeStr}`).toISOString();
          }
          
          return {
            buyer_id: buyerId,
            property_id: propertyId,
            viewed: status?.viewed || false,
            scheduled_showing_datetime: scheduledDatetime,
            favorited: status?.favorited || false,
            agent_notes: agentNotes || null,
            archived: false,
          };
        });

        const { error: bpError } = await supabase
          .from("buyer_properties")
          .insert(buyerPropertyRecords);

        if (bpError) throw bpError;

        // Trigger AI analysis generation in background if enabled
        if (generateAIAnalysis) {
          // Fire and forget - don't await
          for (const buyerId of assignedBuyers) {
            supabase.functions.invoke("property-analysis", {
              body: {
                propertyId,
                buyerId,
                property: selectedProperty,
              },
            }).catch(err => console.log("AI analysis generation started:", err));
          }
        }
      }

      const assignedNames = assignedBuyers
        .map(id => buyers.find(b => b.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      toast({
        title: "Property saved",
        description: assignedNames 
          ? `Property saved and assigned to ${assignedNames}. ${generateAIAnalysis ? "AI analysis will generate automatically." : ""}`
          : "Property saved to general properties pool",
      });

      // Navigate based on assignment
      if (assignedBuyers.length === 1) {
        navigate(`/workspace/${assignedBuyers[0]}`);
      } else {
        navigate("/properties");
      }
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
          {step === "assign" ? "Back" : "Back"}
        </Button>
        <div className="ml-4">
          <h1 className="text-lg font-medium text-foreground">
            {step === "input" ? "Add Property" : "Add Property to Workspace"}
          </h1>
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
        /* Step 2: Property Assignment */
        <div className="max-w-4xl mx-auto py-8 px-6">
          {selectedProperty && (
            <div className="space-y-8">
              {/* Property Summary */}
              <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={selectedProperty.photos[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"}
                    alt={selectedProperty.address}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xl font-semibold text-foreground">
                        {formatPrice(selectedProperty.price)}
                      </p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}
                      </p>
                    </div>
                    {selectedProperty.listingUrl && selectedProperty.listingUrl !== "#" && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => window.open(selectedProperty.listingUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {selectedProperty.bedrooms} bd
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {selectedProperty.bathrooms} ba
                    </span>
                    <span className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {selectedProperty.sqft.toLocaleString()} sqft
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Buyer Assignment */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Assign to Buyer(s) *</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select one or more buyers to assign this property to
                  </p>
                </div>

                <ScrollArea className="h-[280px] border border-border rounded-lg">
                  <div className="p-3 space-y-2">
                    {isBuyersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : buyers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No buyers found</p>
                        <p className="text-xs mt-1">Add a buyer first to assign properties</p>
                      </div>
                    ) : (
                      buyers.map(buyer => {
                        const isAssigned = assignedBuyers.includes(buyer.id);
                        const status = buyerStatuses[buyer.id];
                        const initials = buyer.name.split(" ").map(n => n[0]).join("");
                        
                        return (
                          <div key={buyer.id} className="space-y-3">
                            <div
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                                isAssigned 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              )}
                              onClick={() => handleBuyerToggle(buyer.id)}
                            >
                              <Checkbox
                                checked={isAssigned}
                                onCheckedChange={() => handleBuyerToggle(buyer.id)}
                              />
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{buyer.name}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {buyer.current_stage || "Home Search"}
                                  </span>
                                </div>
                              </div>
                            </div>

                          {/* Expanded Status Options */}
                          {isAssigned && (
                            <div className="ml-14 pl-3 border-l-2 border-primary/20 space-y-3">
                              <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <Checkbox
                                    checked={status?.viewed || false}
                                    onCheckedChange={() => handleStatusChange(buyer.id, "viewed")}
                                  />
                                  Mark as viewed by buyer
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <Checkbox
                                    checked={status?.favorited || false}
                                    onCheckedChange={() => handleStatusChange(buyer.id, "favorited")}
                                  />
                                  Add to buyer's favorites
                                </label>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <Checkbox
                                    checked={status?.scheduled || false}
                                    onCheckedChange={() => handleStatusChange(buyer.id, "scheduled")}
                                  />
                                  Schedule for showing
                                </label>
                                
                                {status?.scheduled && (
                                  <div className="flex items-center gap-3 pl-6">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <Input
                                        type="date"
                                        value={status?.showingDate || ""}
                                        onChange={(e) => handleShowingDateChange(buyer.id, e.target.value)}
                                        className="w-40 h-8"
                                      />
                                    </div>
                                    <Input
                                      type="time"
                                      value={status?.showingTime || ""}
                                      onChange={(e) => handleShowingTimeChange(buyer.id, e.target.value)}
                                      className="w-28 h-8"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                      })
                    )}

                    {/* Unassigned Option */}
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        saveToPool 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleBuyerToggle("unassigned")}
                    >
                      <Checkbox
                        checked={saveToPool}
                        onCheckedChange={() => handleBuyerToggle("unassigned")}
                      />
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground">[Unassigned]</span>
                        <p className="text-xs text-muted-foreground">Save to general properties pool</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              {/* Agent Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Agent Notes <span className="text-muted-foreground font-normal">(Private - Not Visible to Buyer)</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {agentNotes.length}/500 characters
                  </span>
                </div>
                <Textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value.slice(0, 500))}
                  placeholder="Great backyard for their kids, close to schools they want..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* AI Analysis Toggle */}
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-muted/30">
                <Checkbox
                  id="ai-analysis"
                  checked={generateAIAnalysis}
                  onCheckedChange={(checked) => setGenerateAIAnalysis(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="ai-analysis" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Generate AI comparative analysis automatically
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended - analyzes property vs. buyer profile for personalized insights
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (!saveToPool && assignedBuyers.length === 0)}
                  className="flex-1 gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding property...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Property
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
