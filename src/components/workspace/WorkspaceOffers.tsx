import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calculator,
  Sparkles,
  Lock,
  Plus,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Home,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOffers, Offer } from "@/hooks/useOffers";
import { useBuyerProperties } from "@/hooks/useBuyerProperties";
import { useOfferScenarios, AIOfferScenario } from "@/hooks/useOfferScenarios";
import { useWhatIfAnalysis } from "@/hooks/useWhatIfAnalysis";
import { CreateOfferDialog } from "./CreateOfferDialog";
import { OfferDetailModal } from "./OfferDetailModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface WorkspaceOffersProps {
  buyerId: string;
  onAgentCommand?: (command: string) => void;
}

export function WorkspaceOffers({ buyerId, onAgentCommand }: WorkspaceOffersProps) {
  const [activeTab, setActiveTab] = useState<"active" | "scenarios" | "hypothetical">("active");
  const [hypotheticalPrice, setHypotheticalPrice] = useState([485000]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [scenarioPropertyId, setScenarioPropertyId] = useState<string>("");
  const [prefilledValues, setPrefilledValues] = useState<{
    offerAmount?: number;
    earnestMoney?: number;
    contingencies?: string[];
    closingCostCredit?: number;
    propertyId?: string;
  } | undefined>();

  const { 
    offers, 
    isLoading, 
    createOffer, 
    updateOffer, 
    deleteOffer,
    activeOffers,
    drafts,
    closedOffers,
  } = useOffers(buyerId);

  const { properties, fetchProperties } = useBuyerProperties(buyerId);

  const {
    scenarios: aiScenarios,
    isGenerating,
    propertyInfo,
    error: scenarioError,
    generateScenarios,
    clearScenarios,
  } = useOfferScenarios(buyerId);

  const {
    analysis: whatIfAnalysis,
    context: whatIfContext,
    isAnalyzing: isWhatIfAnalyzing,
    error: whatIfError,
    analyzeOffer,
    clearAnalysis,
  } = useWhatIfAnalysis(buyerId);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Set default property for scenarios when properties load
  useEffect(() => {
    if (properties.length > 0 && !scenarioPropertyId) {
      setScenarioPropertyId(properties[0].propertyId);
    }
  }, [properties, scenarioPropertyId]);

  // Get the selected property for What-If Explorer
  const selectedProperty = properties.find(p => p.propertyId === scenarioPropertyId)?.property;
  
  // Calculate slider range based on selected property (80% to 120% of asking)
  const whatIfPropertyPrice = selectedProperty?.price || 500000;
  const sliderMin = Math.round(whatIfPropertyPrice * 0.8);
  const sliderMax = Math.round(whatIfPropertyPrice * 1.2);
  const sliderStep = Math.round(whatIfPropertyPrice * 0.005) || 5000; // 0.5% increments

  // Update hypothetical price when property changes
  useEffect(() => {
    if (selectedProperty?.price) {
      setHypotheticalPrice([selectedProperty.price]);
      clearAnalysis();
    }
  }, [scenarioPropertyId, selectedProperty?.price, clearAnalysis]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCompetitivenessColor = (level: AIOfferScenario["competitiveness"]) => {
    switch (level) {
      case "conservative":
        return "bg-muted text-muted-foreground border-border";
      case "competitive":
        return "bg-success/10 text-success border-success/20";
      case "aggressive":
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  const getStatusColor = (status: Offer["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-muted text-muted-foreground";
      case "Submitted":
        return "bg-primary/10 text-primary";
      case "Countered":
        return "bg-warning/10 text-warning";
      case "Accepted":
        return "bg-success/10 text-success";
      case "Rejected":
      case "Withdrawn":
        return "bg-destructive/10 text-destructive";
    }
  };

  const getStatusIcon = (status: Offer["status"]) => {
    switch (status) {
      case "Draft":
        return <FileText className="h-3.5 w-3.5" />;
      case "Submitted":
        return <Clock className="h-3.5 w-3.5" />;
      case "Countered":
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "Accepted":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "Rejected":
      case "Withdrawn":
        return <XCircle className="h-3.5 w-3.5" />;
    }
  };

  const listingPrice = selectedProperty?.price || propertyInfo?.price || 485000;
  const priceDiff = hypotheticalPrice[0] - listingPrice;
  const priceDiffPercent = ((priceDiff / listingPrice) * 100).toFixed(1);

  const handleAnalyzeWhatIf = async () => {
    if (!scenarioPropertyId || !hypotheticalPrice[0]) return;
    await analyzeOffer(scenarioPropertyId, hypotheticalPrice[0]);
  };

  const handleCreateOfferFromWhatIf = () => {
    setPrefilledValues({
      offerAmount: hypotheticalPrice[0],
      earnestMoney: Math.round(hypotheticalPrice[0] * 0.03),
      contingencies: whatIfAnalysis?.recommended_contingencies || ["financing", "inspection"],
      propertyId: scenarioPropertyId,
    });
    setShowCreateDialog(true);
  };

  const getLikelihoodColor = (likelihood: "High" | "Medium" | "Low") => {
    switch (likelihood) {
      case "High":
        return "bg-success/10 text-success border-success/20";
      case "Medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "Low":
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
  };

  const handleNewOffer = () => {
    setPrefilledValues(undefined);
    setShowCreateDialog(true);
  };

  const handleUseScenario = (scenario: AIOfferScenario) => {
    setPrefilledValues({
      offerAmount: scenario.offer_amount,
      earnestMoney: scenario.earnest_money,
      contingencies: scenario.contingencies,
      propertyId: scenarioPropertyId,
    });
    setShowCreateDialog(true);
  };

  const handleGenerateScenarios = async () => {
    if (!scenarioPropertyId) {
      return;
    }
    clearScenarios();
    await generateScenarios(scenarioPropertyId);
  };

  const handleOpenOffer = (offer: Offer) => {
    setSelectedOffer(offer);
  };

  const handleUpdateStatus = async (offerId: string, status: Offer["status"]) => {
    const success = await updateOffer(offerId, { status });
    if (success) {
      setSelectedOffer(prev => prev?.id === offerId ? { ...prev, status } : prev);
    }
    return success;
  };

  const allOffers = [...drafts, ...activeOffers, ...closedOffers];

  return (
    <div className="h-full flex flex-col -mx-6 -mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-1">
          {["active", "scenarios", "hypothetical"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "active" ? "Active Offers" : tab === "scenarios" ? "Offer Scenarios" : "What-If Explorer"}
              {tab === "active" && allOffers.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {allOffers.length}
                </Badge>
              )}
              {tab === "scenarios" && aiScenarios.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary">
                  AI
                </Badge>
              )}
            </button>
          ))}
        </div>
        <Button
          onClick={handleNewOffer}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Offer
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "active" && (
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allOffers.length > 0 ? (
              <>
                <div className="border border-border rounded-none overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Property</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                        <TableHead className="text-muted-foreground font-medium">vs List</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Earnest</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOffers.map((offer) => {
                        const listPrice = offer.property?.price || 0;
                        const diff = listPrice > 0 ? offer.offerAmount - listPrice : 0;
                        const diffPercent = listPrice > 0 ? ((diff / listPrice) * 100).toFixed(1) : "0";
                        return (
                          <TableRow key={offer.id} className="border-border">
                            <TableCell>
                              <span className="font-medium text-foreground">
                                {offer.property?.address || "Unknown Property"}
                              </span>
                              {offer.property && (
                                <p className="text-xs text-muted-foreground">
                                  {offer.property.city}, {offer.property.state}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {formatPrice(offer.offerAmount)}
                            </TableCell>
                            <TableCell>
                              {listPrice > 0 ? (
                                <span className={cn(
                                  diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  {diff >= 0 ? "+" : ""}{diffPercent}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn("border-0 flex items-center gap-1 w-fit", getStatusColor(offer.status))}
                              >
                                {getStatusIcon(offer.status)}
                                {offer.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {formatPrice(offer.fieldValues.earnestMoney || 0)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenOffer(offer)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Counter Offer Notice */}
                {activeOffers.some(o => o.status === "Countered") && (
                  <div className="mt-6 p-4 border border-warning/30 bg-warning/5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Counter Offer Received</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You have a counter offer pending. Click "Open" to review and respond.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-border text-foreground"
                          onClick={() => {
                            const counterOffer = activeOffers.find(o => o.status === "Countered");
                            if (counterOffer) handleOpenOffer(counterOffer);
                          }}
                        >
                          Review Counter Offer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="border border-border p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Offers Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Create your first offer to get started. You can also explore AI-generated offer scenarios in the Offer Scenarios tab.
                </p>
                <Button onClick={handleNewOffer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Offer
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="p-6">
            {/* Property Selection & Generate Button */}
            <div className="mb-6 space-y-4">
              {properties.length === 0 ? (
                <div className="border border-border p-8 text-center bg-muted/30">
                  <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-2">Add Properties First</p>
                  <p className="text-sm text-muted-foreground">
                    Save properties to this buyer's profile to generate AI offer scenarios.
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Select Property for Scenarios
                    </label>
                    <Select value={scenarioPropertyId} onValueChange={setScenarioPropertyId}>
                      <SelectTrigger className="border-border">
                        <SelectValue placeholder="Choose a property..." />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((bp) => (
                          <SelectItem key={bp.propertyId} value={bp.propertyId}>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span>{bp.property?.address}</span>
                              <span className="text-muted-foreground">
                                — {formatPrice(bp.property?.price || 0)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleGenerateScenarios}
                    disabled={isGenerating || !scenarioPropertyId}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : aiScenarios.length > 0 ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate AI Scenarios
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Error State */}
            {scenarioError && (
              <div className="mb-6 p-4 border border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Generation Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">{scenarioError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleGenerateScenarios}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="border border-border p-12 text-center bg-muted/30">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground mb-2">Analyzing Property & Market Data</p>
                <p className="text-sm text-muted-foreground">
                  Generating personalized offer strategies based on buyer profile and property details...
                </p>
              </div>
            )}

            {/* AI Scenarios Table */}
            {!isGenerating && aiScenarios.length > 0 && (
              <>
                {/* Property Info Banner */}
                {propertyInfo && (
                  <div className="mb-4 p-4 border border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">AI Scenarios for {propertyInfo.address}</p>
                        <p className="text-sm text-muted-foreground">Listed at {formatPrice(propertyInfo.price)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                      AI Generated
                    </Badge>
                  </div>
                )}

                <div className="border border-border rounded-none overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Scenario</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Offer Price</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Earnest</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Contingencies</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aiScenarios.map((scenario) => {
                        const scenarioListPrice = propertyInfo?.price || 0;
                        const diff = scenarioListPrice > 0 ? scenario.offer_amount - scenarioListPrice : 0;
                        const diffPercent = scenarioListPrice > 0 
                          ? ((diff / scenarioListPrice) * 100).toFixed(1) 
                          : "0";
                        
                        return (
                          <TableRow 
                            key={scenario.id} 
                            className={cn(
                              "border-border",
                              scenario.status === "pending" && "opacity-60"
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{scenario.name}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs border", getCompetitivenessColor(scenario.competitiveness))}
                                >
                                  {scenario.competitiveness}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium text-foreground">{formatPrice(scenario.offer_amount)}</span>
                                <span className={cn(
                                  "text-xs ml-2",
                                  diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  {diff >= 0 ? "+" : ""}{diffPercent}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {formatPrice(scenario.earnest_money)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {scenario.contingencies.map((c) => (
                                  <Badge key={c} variant="secondary" className="text-xs bg-muted text-muted-foreground border-0 capitalize">
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {scenario.status === "ready" ? (
                                <div className="flex items-center gap-1.5 text-success">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-sm">Ready</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Lock className="h-4 w-4" />
                                  <span className="text-sm">Over Budget</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUseScenario(scenario)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Use This
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Rationale Section */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Strategy Rationale</h3>
                  {aiScenarios.map((scenario) => (
                    <div key={scenario.id} className="p-4 border border-border bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{scenario.name}</span>
                          <span className="text-muted-foreground mx-2">—</span>
                          <span className="text-muted-foreground">{scenario.rationale}</span>
                        </div>
                        <Badge variant="outline" className={cn("ml-4 border", getCompetitivenessColor(scenario.competitiveness))}>
                          {scenario.competitiveness}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compliance Notice */}
                <div className="mt-6 p-4 border border-border bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">AI-Generated Recommendations</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        These scenarios are based on property data and buyer profile. Always review with your client before submitting any offer.
                        Market conditions may change rapidly.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Empty State - No scenarios generated yet */}
            {!isGenerating && aiScenarios.length === 0 && properties.length > 0 && !scenarioError && (
              <div className="border border-border p-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">Generate AI Offer Scenarios</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Select a property above and click "Generate AI Scenarios" to get personalized offer strategies
                  based on market data and buyer profile.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "hypothetical" && (
          <div className="p-6 space-y-6">
            {/* Property Selection */}
            {properties.length === 0 ? (
              <div className="border border-border p-8 text-center bg-muted/30">
                <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground mb-2">Add Properties First</p>
                <p className="text-sm text-muted-foreground">
                  Save properties to this buyer's profile to explore what-if scenarios.
                </p>
              </div>
            ) : (
              <>
                {/* Property Info Header */}
                <div className="border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Home className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">
                          {selectedProperty?.address || "Select a property"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Listed at {formatPrice(whatIfPropertyPrice)}
                        </p>
                      </div>
                    </div>
                    <Select value={scenarioPropertyId} onValueChange={(val) => {
                      setScenarioPropertyId(val);
                    }}>
                      <SelectTrigger className="w-[280px] border-border">
                        <SelectValue placeholder="Choose a property..." />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((bp) => (
                          <SelectItem key={bp.propertyId} value={bp.propertyId}>
                            {bp.property?.address} — {formatPrice(bp.property?.price || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price Slider */}
                <div className="border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Explore Different Offer Prices</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Adjust the slider to test different offer amounts. Calculations update in real-time.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">Your Offer Price</span>
                        <span className="text-2xl font-medium text-foreground">{formatPrice(hypotheticalPrice[0])}</span>
                      </div>
                      <Slider
                        value={hypotheticalPrice}
                        onValueChange={(val) => {
                          setHypotheticalPrice(val);
                          // Clear previous analysis when slider changes
                          if (whatIfAnalysis) clearAnalysis();
                        }}
                        min={sliderMin}
                        max={sliderMax}
                        step={sliderStep}
                        className="my-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatPrice(sliderMin)} (80%)</span>
                        <span>Asking: {formatPrice(whatIfPropertyPrice)}</span>
                        <span>{formatPrice(sliderMax)} (120%)</span>
                      </div>
                    </div>

                    {/* Real-time Calculations */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border border-border bg-background">
                        <p className="text-sm text-muted-foreground mb-1">vs Asking Price</p>
                        <div className="flex items-center gap-2">
                          {priceDiff > 0 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : priceDiff < 0 ? (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-lg font-medium",
                            priceDiff > 0 ? "text-success" : priceDiff < 0 ? "text-destructive" : "text-foreground"
                          )}>
                            {priceDiff >= 0 ? "+" : ""}{formatPrice(priceDiff)} ({priceDiff >= 0 ? "+" : ""}{priceDiffPercent}%)
                          </span>
                        </div>
                      </div>
                      <div className="p-4 border border-border bg-background">
                        <p className="text-sm text-muted-foreground mb-1">Suggested Earnest (3%)</p>
                        <p className="text-lg font-medium text-foreground">{formatPrice(hypotheticalPrice[0] * 0.03)}</p>
                      </div>
                      <div className="p-4 border border-border bg-background">
                        <p className="text-sm text-muted-foreground mb-1">Estimated Down (20%)</p>
                        <p className="text-lg font-medium text-foreground">{formatPrice(hypotheticalPrice[0] * 0.2)}</p>
                      </div>
                    </div>

                    {/* Analyze Button */}
                    <Button 
                      onClick={handleAnalyzeWhatIf}
                      disabled={isWhatIfAnalyzing || !scenarioPropertyId}
                      className="w-full bg-foreground text-background hover:bg-foreground/90"
                    >
                      {isWhatIfAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze This Price with AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Error State */}
                {whatIfError && (
                  <div className="p-4 border border-destructive/30 bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Analysis Failed</p>
                        <p className="text-sm text-muted-foreground mt-1">{whatIfError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={handleAnalyzeWhatIf}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Analysis Results */}
                {whatIfAnalysis && (
                  <div className="border border-border bg-card">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="font-medium text-foreground">AI Analysis: {formatPrice(whatIfContext?.offer_amount || hypotheticalPrice[0])}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("border", getCompetitivenessColor(whatIfAnalysis.competitiveness))}>
                          {whatIfAnalysis.competitiveness}
                        </Badge>
                        <Badge variant="outline" className={cn("border", getLikelihoodColor(whatIfAnalysis.likelihood))}>
                          {whatIfAnalysis.likelihood} Likelihood
                        </Badge>
                      </div>
                    </div>

                    {/* Strategy Assessment */}
                    <div className="p-4 border-b border-border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Strategy Assessment</p>
                      <p className="text-foreground">{whatIfAnalysis.strategy_assessment}</p>
                    </div>

                    {/* Recommended Contingencies */}
                    <div className="p-4 border-b border-border">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Contingencies</p>
                      <div className="flex flex-wrap gap-2">
                        {whatIfAnalysis.recommended_contingencies.map((contingency, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {contingency}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Expandable Sections */}
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="risks" className="border-b border-border">
                        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            Risks & Considerations ({whatIfAnalysis.risks.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <ul className="space-y-2">
                            {whatIfAnalysis.risks.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-warning mt-0.5">•</span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="tips" className="border-0">
                        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-success" />
                            Negotiation Tips ({whatIfAnalysis.negotiation_tips.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <ul className="space-y-2">
                            {whatIfAnalysis.negotiation_tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-success mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Create Offer Button */}
                    <div className="p-4 bg-muted/30">
                      <Button 
                        onClick={handleCreateOfferFromWhatIf}
                        className="w-full bg-foreground text-background hover:bg-foreground/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Offer at {formatPrice(hypotheticalPrice[0])}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-4 border border-border bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Educational Exploration</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This tool helps explore different offer strategies. AI analysis is based on available data and should be reviewed with your client. Market conditions may change.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Offer Dialog */}
      <CreateOfferDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setPrefilledValues(undefined);
        }}
        onSubmit={createOffer}
        properties={properties.map(p => ({ id: p.propertyId, property: p.property }))}
        prefilledValues={prefilledValues}
      />

      {/* Offer Detail Modal */}
      <OfferDetailModal
        offer={selectedOffer}
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={deleteOffer}
        onAgentCommand={onAgentCommand}
      />
    </div>
  );
}
