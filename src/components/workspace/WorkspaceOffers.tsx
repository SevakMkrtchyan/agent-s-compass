import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calculator,
  Sparkles,
  Lock,
  Plus,
  ExternalLink,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceOffersProps {
  buyerId: string;
  onAgentCommand?: (command: string) => void;
}

interface OfferScenario {
  id: string;
  name: string;
  price: number;
  earnestMoney: number;
  closingCostCredit: number;
  contingencies: string[];
  competitiveness: "conservative" | "competitive" | "aggressive";
  notes: string;
  rationale: string;
  requiresApproval: boolean;
  approved: boolean;
}

interface ActiveOffer {
  id: string;
  property: string;
  amount: number;
  listPrice: number;
  status: "pending" | "countered" | "accepted" | "rejected";
  submittedDate: string;
  expiresDate: string;
  earnestMoney: number;
  contingencies: string[];
}

const mockScenarios: OfferScenario[] = [
  {
    id: "1",
    name: "Conservative",
    price: 470000,
    earnestMoney: 10000,
    closingCostCredit: 5000,
    contingencies: ["Financing", "Inspection", "Appraisal"],
    competitiveness: "conservative",
    notes: "Lower risk with all standard contingencies. May be less competitive in a hot market.",
    rationale: "Best for risk-averse buyers. All protections in place, but 3% below asking may require negotiation.",
    requiresApproval: true,
    approved: true,
  },
  {
    id: "2",
    name: "Competitive",
    price: 485000,
    earnestMoney: 15000,
    closingCostCredit: 0,
    contingencies: ["Financing", "Inspection"],
    competitiveness: "competitive",
    notes: "At asking price with reduced contingencies. Good balance of risk and competitiveness.",
    rationale: "Balanced approach. At asking price with waived appraisal contingency shows seller confidence.",
    requiresApproval: true,
    approved: true,
  },
  {
    id: "3",
    name: "Aggressive",
    price: 495000,
    earnestMoney: 20000,
    closingCostCredit: 0,
    contingencies: ["Inspection"],
    competitiveness: "aggressive",
    notes: "Above asking with minimal contingencies. Strongest competitive position but higher risk.",
    rationale: "For competitive markets. 2% over asking with only inspection contingency. Requires strong financials.",
    requiresApproval: true,
    approved: false,
  },
];

const mockActiveOffers: ActiveOffer[] = [
  {
    id: "offer-1",
    property: "1847 Magnolia Ave, Burbank",
    amount: 485000,
    listPrice: 485000,
    status: "pending",
    submittedDate: "2025-01-14",
    expiresDate: "2025-01-16",
    earnestMoney: 15000,
    contingencies: ["Financing", "Inspection"],
  },
  {
    id: "offer-2",
    property: "2234 Oak Street, Glendale",
    amount: 520000,
    listPrice: 515000,
    status: "countered",
    submittedDate: "2025-01-12",
    expiresDate: "2025-01-17",
    earnestMoney: 20000,
    contingencies: ["Inspection"],
  },
];

export function WorkspaceOffers({ buyerId, onAgentCommand }: WorkspaceOffersProps) {
  const [activeTab, setActiveTab] = useState<"scenarios" | "hypothetical" | "active">("scenarios");
  const [hypotheticalPrice, setHypotheticalPrice] = useState([485000]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedScenarios, setStreamedScenarios] = useState<string>("");
  const [selectedOffer, setSelectedOffer] = useState<ActiveOffer | null>(null);
  const [showOfferDetail, setShowOfferDetail] = useState(false);
  const listingPrice = 485000;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCompetitivenessColor = (level: OfferScenario["competitiveness"]) => {
    switch (level) {
      case "conservative":
        return "bg-muted text-muted-foreground border-border";
      case "competitive":
        return "bg-success/10 text-success border-success/20";
      case "aggressive":
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  const getStatusColor = (status: ActiveOffer["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "countered":
        return "bg-warning/10 text-warning";
      case "accepted":
        return "bg-success/10 text-success";
      case "rejected":
        return "bg-destructive/10 text-destructive";
    }
  };

  const getStatusIcon = (status: ActiveOffer["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5" />;
      case "countered":
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "accepted":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejected":
        return <XCircle className="h-3.5 w-3.5" />;
    }
  };

  const priceDiff = hypotheticalPrice[0] - listingPrice;
  const priceDiffPercent = ((priceDiff / listingPrice) * 100).toFixed(1);

  const handleNewOffer = () => {
    setIsGenerating(true);
    setStreamedScenarios("");
    
    // Simulate streaming scenarios
    const scenarios = `## AI-Generated Offer Scenarios for 1847 Magnolia Ave

Based on Sarah Johnson's buyer profile (first-time buyer, pre-approved $525K, conservative risk tolerance), market analysis, and property specifics:

---

### Conservative Offer — $470,000

| Component | Value |
|-----------|-------|
| Offer Price | $470,000 (-3.1% below asking) |
| Earnest Money | $10,000 (2.1%) |
| Closing Credit | $5,000 requested |
| Contingencies | Financing, Inspection, Appraisal |

**Rationale:** Provides maximum buyer protection with all standard contingencies. The lower price tests seller flexibility. Recommended for buyers prioritizing security over speed.

**Compliance Check:** ✅ Pre-approval verified, ✅ Agency disclosure signed, ✅ Within loan limits

---

### Competitive Offer — $485,000

| Component | Value |
|-----------|-------|
| Offer Price | $485,000 (at asking) |
| Earnest Money | $15,000 (3.1%) |
| Closing Credit | None |
| Contingencies | Financing, Inspection |

**Rationale:** At asking price with waived appraisal contingency demonstrates confidence. Higher earnest money shows commitment. Good balance for markets with 10-15 DOM average.

**Compliance Check:** ✅ Pre-approval verified, ✅ Agency disclosure signed, ⚠️ Appraisal waiver requires cash reserve verification

---

### Aggressive Offer — $495,000

| Component | Value |
|-----------|-------|
| Offer Price | $495,000 (+2.1% above asking) |
| Earnest Money | $20,000 (4.0%) |
| Closing Credit | None |
| Contingencies | Inspection only |

**Rationale:** For competitive situations with multiple offers expected. Above asking with minimal contingencies positions strongly. Requires buyer to have cash reserves for potential appraisal gap.

**Compliance Check:** ✅ Pre-approval verified, ✅ Agency disclosure signed, ⚠️ Requires signed appraisal gap acknowledgment

---

**Next Steps:** Select a scenario to generate full offer documents, or request modifications.`;

    let index = 0;
    const interval = setInterval(() => {
      if (index < scenarios.length) {
        setStreamedScenarios(scenarios.slice(0, index + 20));
        index += 20;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 10);
  };

  const handleOpenOffer = (offer: ActiveOffer) => {
    setSelectedOffer(offer);
    setShowOfferDetail(true);
    if (onAgentCommand) {
      onAgentCommand(`Review and draft strategy for offer on ${offer.property}. Check compliance requirements and suggest response options.`);
    }
  };

  const handleViewInWorkspace = (offer: ActiveOffer) => {
    if (onAgentCommand) {
      onAgentCommand(`Open offer details for ${offer.property} - Current status: ${offer.status}, Amount: ${formatPrice(offer.amount)}`);
    }
  };

  return (
    <div className="h-full flex flex-col -mx-6 -mt-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-1">
          {["scenarios", "hypothetical", "active"].map((tab) => (
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
              {tab === "scenarios" ? "Offer Scenarios" : tab === "hypothetical" ? "What-If Explorer" : "Active Offers"}
            </button>
          ))}
        </div>
        <Button
          onClick={handleNewOffer}
          disabled={isGenerating}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "New Offer"}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Streamed Scenarios */}
        {streamedScenarios && (
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">AI-Generated Scenarios</span>
              {isGenerating && (
                <span className="text-xs text-muted-foreground animate-pulse">Streaming...</span>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-foreground font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {streamedScenarios}
              {isGenerating && <span className="animate-pulse">▊</span>}
            </div>
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="p-6">
            {/* Scenarios Table */}
            <div className="border border-border rounded-none overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Scenario</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Price</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Earnest</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Contingencies</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockScenarios.map((scenario) => (
                    <TableRow 
                      key={scenario.id} 
                      className={cn(
                        "border-border",
                        !scenario.approved && "opacity-60"
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
                          <span className="font-medium text-foreground">{formatPrice(scenario.price)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {scenario.price > listingPrice ? "+" : ""}
                            {((scenario.price - listingPrice) / listingPrice * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatPrice(scenario.earnestMoney)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {scenario.contingencies.map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {scenario.approved ? (
                          <div className="flex items-center gap-1.5 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">Approved</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!scenario.approved}
                          onClick={() => onAgentCommand?.(`Draft offer using ${scenario.name} scenario at ${formatPrice(scenario.price)}`)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Rationale Section */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Scenario Rationale</h3>
              {mockScenarios.filter(s => s.approved).map((scenario) => (
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
                  <p className="font-medium text-foreground">Compliance Status</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All scenarios verified against CA DRE requirements. Pre-approval on file, agency disclosures signed. 
                    Aggressive scenario requires additional appraisal gap acknowledgment before submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "hypothetical" && (
          <div className="p-6">
            <div className="border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Explore "What If" Scenarios</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Adjust the price slider to see how different offer amounts might compare. This is for educational exploration only.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Offer Price</span>
                    <span className="text-2xl font-medium text-foreground">{formatPrice(hypotheticalPrice[0])}</span>
                  </div>
                  <Slider
                    value={hypotheticalPrice}
                    onValueChange={setHypotheticalPrice}
                    min={400000}
                    max={550000}
                    step={5000}
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatPrice(400000)}</span>
                    <span>Asking: {formatPrice(listingPrice)}</span>
                    <span>{formatPrice(550000)}</span>
                  </div>
                </div>

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

                <Button 
                  onClick={() => onAgentCommand?.(`Analyze offer at ${formatPrice(hypotheticalPrice[0])} for competitiveness and generate recommendations`)}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze This Price with AI
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "active" && (
          <div className="p-6">
            {mockActiveOffers.length > 0 ? (
              <div className="border border-border rounded-none overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Property</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                      <TableHead className="text-muted-foreground font-medium">vs List</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Submitted</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Expires</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockActiveOffers.map((offer) => {
                      const diff = offer.amount - offer.listPrice;
                      const diffPercent = ((diff / offer.listPrice) * 100).toFixed(1);
                      return (
                        <TableRow key={offer.id} className="border-border">
                          <TableCell>
                            <span className="font-medium text-foreground">{offer.property}</span>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {formatPrice(offer.amount)}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {diff >= 0 ? "+" : ""}{diffPercent}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn("border-0 flex items-center gap-1 w-fit", getStatusColor(offer.status))}
                            >
                              {getStatusIcon(offer.status)}
                              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(offer.submittedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(offer.expiresDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenOffer(offer)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInWorkspace(offer)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border border-border p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Active Offers</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  When you're ready to make an offer, your agent will prepare the documents and guide you through the process.
                </p>
              </div>
            )}

            {/* Status Update Notice */}
            {mockActiveOffers.some(o => o.status === "countered") && (
              <div className="mt-6 p-4 border border-warning/30 bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Counter Offer Received</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have a counter offer pending on 2234 Oak Street. Click "Open" to review with AgentGPT and draft your response.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-border text-foreground"
                      onClick={() => {
                        const counterOffer = mockActiveOffers.find(o => o.status === "countered");
                        if (counterOffer) handleOpenOffer(counterOffer);
                      }}
                    >
                      Review Counter Offer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offer Detail Dialog */}
      <Dialog open={showOfferDetail} onOpenChange={setShowOfferDetail}>
        <DialogContent className="max-w-2xl border-border bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">Offer Details</DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border">
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium text-foreground">{selectedOffer.property}</p>
                </div>
                <div className="p-4 border border-border">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant="outline" 
                    className={cn("mt-1 border-0 flex items-center gap-1 w-fit", getStatusColor(selectedOffer.status))}
                  >
                    {getStatusIcon(selectedOffer.status)}
                    {selectedOffer.status.charAt(0).toUpperCase() + selectedOffer.status.slice(1)}
                  </Badge>
                </div>
                <div className="p-4 border border-border">
                  <p className="text-sm text-muted-foreground">Offer Amount</p>
                  <p className="font-medium text-foreground">{formatPrice(selectedOffer.amount)}</p>
                </div>
                <div className="p-4 border border-border">
                  <p className="text-sm text-muted-foreground">Earnest Money</p>
                  <p className="font-medium text-foreground">{formatPrice(selectedOffer.earnestMoney)}</p>
                </div>
              </div>

              <div className="p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-2">Contingencies</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOffer.contingencies.map((c) => (
                    <Badge key={c} variant="secondary" className="bg-muted text-muted-foreground border-0">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Compliance Check */}
              <div className="p-4 border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Compliance Check</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>Pre-approval verified and on file</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>Agency disclosure signed</span>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>Offer within loan limits</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => {
                    onAgentCommand?.(`Draft response strategy for ${selectedOffer.status === "countered" ? "counter offer" : "offer"} on ${selectedOffer.property}`);
                    setShowOfferDetail(false);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Draft Strategy with AI
                </Button>
                <Button
                  variant="outline"
                  className="border-border text-foreground"
                  onClick={() => setShowOfferDetail(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
