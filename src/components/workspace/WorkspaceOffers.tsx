import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceOffersProps {
  buyerId: string;
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
  requiresApproval: boolean;
  approved: boolean;
}

const mockScenarios: OfferScenario[] = [
  {
    id: "1",
    name: "Conservative Offer",
    price: 470000,
    earnestMoney: 10000,
    closingCostCredit: 5000,
    contingencies: ["Financing", "Inspection", "Appraisal"],
    competitiveness: "conservative",
    notes: "Lower risk with all standard contingencies. May be less competitive in a hot market.",
    requiresApproval: true,
    approved: true,
  },
  {
    id: "2",
    name: "Competitive Offer",
    price: 485000,
    earnestMoney: 15000,
    closingCostCredit: 0,
    contingencies: ["Financing", "Inspection"],
    competitiveness: "competitive",
    notes: "At asking price with reduced contingencies. Good balance of risk and competitiveness.",
    requiresApproval: true,
    approved: true,
  },
  {
    id: "3",
    name: "Aggressive Offer",
    price: 495000,
    earnestMoney: 20000,
    closingCostCredit: 0,
    contingencies: ["Inspection"],
    competitiveness: "aggressive",
    notes: "Above asking with minimal contingencies. Strongest competitive position but higher risk.",
    requiresApproval: true,
    approved: false,
  },
];

export function WorkspaceOffers({ buyerId }: WorkspaceOffersProps) {
  const [hypotheticalPrice, setHypotheticalPrice] = useState([485000]);
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
        return "bg-info/10 text-info border-info/20";
      case "competitive":
        return "bg-success/10 text-success border-success/20";
      case "aggressive":
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  const priceDiff = hypotheticalPrice[0] - listingPrice;
  const priceDiffPercent = ((priceDiff / listingPrice) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="scenarios">Offer Scenarios</TabsTrigger>
          <TabsTrigger value="hypothetical">Hypothetical Explorer</TabsTrigger>
          <TabsTrigger value="active">Active Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios">
          <div className="grid md:grid-cols-3 gap-4">
            {mockScenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  !scenario.approved && "opacity-60"
                )}
              >
                {!scenario.approved && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="text-center p-4">
                      <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Pending agent approval
                      </p>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <Badge variant="outline" className={getCompetitivenessColor(scenario.competitiveness)}>
                      {scenario.competitiveness}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {formatPrice(scenario.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scenario.price > listingPrice ? "+" : ""}
                        {formatPrice(scenario.price - listingPrice)} from asking
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Earnest Money</span>
                        <span className="font-medium">{formatPrice(scenario.earnestMoney)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Closing Credit</span>
                        <span className="font-medium">{formatPrice(scenario.closingCostCredit)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Contingencies</p>
                      <div className="flex flex-wrap gap-1">
                        {scenario.contingencies.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground border-t pt-3">
                      {scenario.notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <CardContent className="py-4">
              <div className="flex items-start gap-3 text-sm">
                <Sparkles className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">AI-Generated Scenarios</p>
                  <p className="text-muted-foreground mt-1">
                    These scenarios are generated by AI for educational purposes and have been reviewed by your agent.
                    Locked scenarios are pending approval before you can view the details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hypothetical">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Explore "What If" Scenarios
              </CardTitle>
              <CardDescription>
                Adjust the price slider to see how different offer amounts might compare. This is for educational exploration only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Offer Price</span>
                    <span className="text-2xl font-bold">{formatPrice(hypotheticalPrice[0])}</span>
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
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-1">vs Asking Price</p>
                    <p className={cn(
                      "text-lg font-semibold",
                      priceDiff > 0 ? "text-success" : priceDiff < 0 ? "text-destructive" : "text-foreground"
                    )}>
                      {priceDiff >= 0 ? "+" : ""}{formatPrice(priceDiff)} ({priceDiff >= 0 ? "+" : ""}{priceDiffPercent}%)
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-1">Suggested Earnest (3%)</p>
                    <p className="text-lg font-semibold">{formatPrice(hypotheticalPrice[0] * 0.03)}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Down (20%)</p>
                    <p className="text-lg font-semibold">{formatPrice(hypotheticalPrice[0] * 0.2)}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-info/10 border border-info/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Educational Note:</strong> This tool helps you understand how offer price affects other terms.
                    Your agent will provide specific guidance based on current market conditions and comparable sales.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Active Offers</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                When you're ready to make an offer, your agent will prepare the documents and guide you through the process.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
