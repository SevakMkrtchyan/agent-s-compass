import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Heart,
  ExternalLink,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart3,
  Clock,
  DollarSign,
  Home,
  Loader2,
  X,
  ChevronRight,
  Target,
  PieChart,
} from "lucide-react";
import { mockProperties } from "@/data/mockData";
import { Property } from "@/types";
import { cn } from "@/lib/utils";

interface WorkspacePropertiesProps {
  buyerId: string;
  onAgentCommand?: (command: string) => void;
}

export function WorkspaceProperties({ buyerId, onAgentCommand }: WorkspacePropertiesProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<string[]>(["1", "2"]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isGeneratingComps, setIsGeneratingComps] = useState(false);
  const [streamedComps, setStreamedComps] = useState<any[]>([]);
  const [compAnalysis, setCompAnalysis] = useState<string>("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const toggleFavorite = (propertyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleAddProperty = () => {
    onAgentCommand?.("Generate property suggestions based on Sarah's criteria: Burbank luxury condos, 2+ beds, under $650K, modern finishes");
  };

  const handleGenerateComps = useCallback(async () => {
    setIsGeneratingComps(true);
    setStreamedComps([]);
    setCompAnalysis("");

    // Simulate streaming comps generation
    const mockComps = [
      { 
        address: "123 Oak Street", 
        price: 485000, 
        sqft: 1850, 
        pricePerSqft: 262, 
        dom: 14,
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
        status: "selected" 
      },
      { 
        address: "145 Oak Street", 
        price: 478000, 
        sqft: 1820, 
        pricePerSqft: 263, 
        dom: 22,
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
        status: "sold" 
      },
      { 
        address: "98 Maple Ave", 
        price: 492000, 
        sqft: 1900, 
        pricePerSqft: 259, 
        dom: 8,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
        status: "active" 
      },
      { 
        address: "210 Cedar Lane", 
        price: 469000, 
        sqft: 1780, 
        pricePerSqft: 264, 
        dom: 31,
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400",
        status: "pending" 
      },
    ];

    // Stream in comps one by one
    for (let i = 0; i < mockComps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setStreamedComps(prev => [...prev, mockComps[i]]);
    }

    // Stream analysis text
    const analysisText = "Based on Sarah's first-time buyer profile with a focus on affordability, these comps show a median price/sqft of $262. The selected property is competitively priced at 1.5% below market average. Recommend negotiating 3-5% below asking given the 14-day DOM.";
    
    for (let i = 0; i < analysisText.length; i += 3) {
      await new Promise(resolve => setTimeout(resolve, 15));
      setCompAnalysis(analysisText.slice(0, i + 3));
    }

    setIsGeneratingComps(false);
  }, []);

  const PropertyCard = ({ property, onClick }: { property: Property; onClick?: () => void }) => (
    <div 
      className="bg-card border border-border overflow-hidden hover:border-foreground/20 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img
          src={property.images[0]}
          alt={property.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge
            className={cn(
              "capitalize text-xs font-normal",
              property.status === "active"
                ? "bg-emerald-500/90 text-white border-0"
                : property.status === "pending"
                ? "bg-amber-500/90 text-white border-0"
                : "bg-muted text-muted-foreground"
            )}
          >
            {property.status}
          </Badge>
        </div>
        <button
          className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          onClick={(e) => toggleFavorite(property.id, e)}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              favorites.includes(property.id)
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground"
            )}
          />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground">{formatPrice(property.price)}</h3>
          <span className="text-xs text-muted-foreground">
            ${property.pricePerSqft}/sqft
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          {property.address}, {property.city}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.bathrooms}
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {property.sqft.toLocaleString()}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {property.daysOnMarket}d
          </span>
        </div>
      </div>
    </div>
  );

  const PropertyDetailModal = () => {
    if (!selectedProperty) return null;

    // Mock AI analysis
    const aiAnalysis = {
      domAnalysis: "14 days on market is 40% faster than area average (23 days). This suggests strong buyer interest or competitive pricing.",
      pricePerSqft: "At $262/sqft, this property is priced 2.3% below the neighborhood median of $268/sqft.",
      roiEstimate: "For investor buyers: Estimated 5.2% cap rate based on comparable rental rates of $2,450/month.",
      marketTrend: "Burbank condo prices up 4.7% YoY. Current listing aligns with upward trend.",
    };

    return (
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
          <div className="relative h-64">
            <img
              src={selectedProperty.images[0]}
              alt={selectedProperty.address}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => toggleFavorite(selectedProperty.id, e)}
              className="absolute top-4 right-14 p-2 bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  favorites.includes(selectedProperty.id)
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground"
                )}
              />
            </button>
            <div className="absolute bottom-4 left-6 text-white">
              <p className="text-3xl font-medium mb-1">{formatPrice(selectedProperty.price)}</p>
              <p className="flex items-center gap-1 opacity-90">
                <MapPin className="h-4 w-4" />
                {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}
              </p>
            </div>
          </div>

          <ScrollArea className="max-h-[calc(90vh-16rem)]">
            <div className="p-6 space-y-6">
              {/* Property Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 text-center">
                  <Bed className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{selectedProperty.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                </div>
                <div className="p-4 bg-muted/50 text-center">
                  <Bath className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{selectedProperty.bathrooms}</p>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                </div>
                <div className="p-4 bg-muted/50 text-center">
                  <Square className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{selectedProperty.sqft.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Sq Ft</p>
                </div>
                <div className="p-4 bg-muted/50 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{selectedProperty.daysOnMarket}</p>
                  <p className="text-xs text-muted-foreground">Days on Market</p>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-foreground">AI Market Analysis</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Days on Market Analysis</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.domAnalysis}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Price per Sq Ft</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.pricePerSqft}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <PieChart className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">ROI Estimate (Investor Focus)</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.roiEstimate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-border bg-muted/30">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">Market Trend</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.marketTrend}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedProperty(null);
                    onAgentCommand?.(`Generate offer strategy for ${selectedProperty.address} at ${formatPrice(selectedProperty.price)}`);
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Create Offer Strategy
                </Button>
                <Button 
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => {
                    toggleFavorite(selectedProperty.id);
                    setSelectedProperty(null);
                  }}
                >
                  <Heart className={cn("h-4 w-4 mr-2", favorites.includes(selectedProperty.id) && "fill-current")} />
                  {favorites.includes(selectedProperty.id) ? "Remove from Portal" : "Add to Buyer Portal"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="h-full flex flex-col -mx-6 -mt-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="px-3 py-1.5 text-sm font-medium text-foreground border-b-2 border-foreground">
            Properties
          </button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Comparables
          </button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Favorites ({favorites.length})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "p-2 transition-colors",
              viewMode === "grid" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className={cn(
              "p-2 transition-colors",
              viewMode === "list" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </button>
          <Button 
            size="sm" 
            className="gap-2 ml-2 bg-foreground text-background hover:bg-foreground/90"
            onClick={handleAddProperty}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Add Property
          </Button>
        </div>
      </div>

      <Tabs defaultValue="properties" className="flex-1 flex flex-col">
        <TabsList className="hidden">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="comparables">Comparables</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 m-0 data-[state=active]:flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "space-y-3"
                )}
              >
                {mockProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    onClick={() => setSelectedProperty(property)}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="comparables" className="flex-1 m-0 data-[state=active]:flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Generate Comps Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Comparable Market Analysis</h3>
                  <p className="text-sm text-muted-foreground">AI-generated comps based on buyer criteria</p>
                </div>
                <Button
                  onClick={handleGenerateComps}
                  disabled={isGeneratingComps}
                  className="gap-2 bg-foreground text-background hover:bg-foreground/90"
                >
                  {isGeneratingComps ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Comps
                    </>
                  )}
                </Button>
              </div>

              {/* Streamed Comps Table */}
              {streamedComps.length > 0 && (
                <div className="border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sq Ft</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">$/Sq Ft</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">DOM</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streamedComps.map((comp, index) => {
                        const isSelected = comp.status === "selected";
                        return (
                          <tr
                            key={index}
                            className={cn(
                              "border-b border-border last:border-0 transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                              isSelected && "bg-muted/30"
                            )}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={comp.image} 
                                  alt={comp.address}
                                  className="w-12 h-12 object-cover"
                                />
                                <div>
                                  <span className={cn("text-sm", isSelected && "font-medium")}>
                                    {comp.address}
                                  </span>
                                  {isSelected && (
                                    <Badge className="ml-2 text-xs bg-foreground text-background">
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-medium text-sm">
                              {formatPrice(comp.price)}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                              {comp.sqft.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                              ${comp.pricePerSqft}
                            </td>
                            <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                              {comp.dom}d
                            </td>
                            <td className="text-right py-3 px-4">
                              <Badge
                                className={cn(
                                  "text-xs capitalize font-normal",
                                  comp.status === "active" && "bg-emerald-500/10 text-emerald-600 border-emerald-200",
                                  comp.status === "sold" && "bg-muted text-muted-foreground",
                                  comp.status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-200",
                                  comp.status === "selected" && "bg-foreground text-background"
                                )}
                              >
                                {comp.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* AI Analysis */}
              {compAnalysis && (
                <div className="p-4 bg-muted/30 border border-border">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">AI Analysis</p>
                      <p className="text-sm text-muted-foreground">{compAnalysis}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder when no comps */}
              {streamedComps.length === 0 && !isGeneratingComps && (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Click "Generate Comps" to create a market analysis</p>
                  <p className="text-xs mt-1">Based on Sarah's first-time buyer profile and Burbank preferences</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 m-0 data-[state=active]:flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6">
              {favorites.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    These properties are visible on the buyer portal for Sarah's review.
                  </p>
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                        : "space-y-3"
                    )}
                  >
                    {mockProperties
                      .filter((p) => favorites.includes(p.id))
                      .map((property) => (
                        <PropertyCard 
                          key={property.id} 
                          property={property}
                          onClick={() => setSelectedProperty(property)}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No favorite properties yet</p>
                  <p className="text-xs mt-1">Click the heart icon on any property to add it to favorites</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Property Detail Modal */}
      <PropertyDetailModal />
    </div>
  );
}
