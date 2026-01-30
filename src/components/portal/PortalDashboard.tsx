import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Home, FileText, CheckCircle, Clock, DollarSign, MapPin } from "lucide-react";
import type { PortalBuyer } from "@/pages/BuyerPortal";
import { STAGES } from "@/types";

interface PortalDashboardProps {
  buyer: PortalBuyer;
}

export function PortalDashboard({ buyer }: PortalDashboardProps) {
  // Parse current stage number from stage name
  const currentStageIndex = STAGES.findIndex(
    (s) => s.title.toLowerCase() === buyer.current_stage?.toLowerCase()
  );
  const stageNumber = currentStageIndex >= 0 ? currentStageIndex : 1;
  const currentStage = STAGES[stageNumber] || STAGES[1];
  const progress = ((stageNumber + 1) / STAGES.length) * 100;

  // Fetch properties count
  const { data: propertiesCount = 0 } = useQuery({
    queryKey: ["portal-properties-count", buyer.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("buyer_properties")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyer.id)
        .eq("archived", false);
      return count || 0;
    },
  });

  // Fetch offers count
  const { data: offersData } = useQuery({
    queryKey: ["portal-offers-count", buyer.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("status")
        .eq("buyer_id", buyer.id);
      return data || [];
    },
  });

  const activeOffers = offersData?.filter((o) => o.status !== "Withdrawn" && o.status !== "Rejected").length || 0;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {buyer.name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Here's an overview of your home buying journey</p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{currentStage.title}</span>
                <span className="text-muted-foreground">Stage {stageNumber + 1} of {STAGES.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground">{currentStage.description}</p>
            
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Your tasks:</p>
              <ul className="space-y-1">
                {currentStage.buyerTasks.map((task, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Home className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{propertiesCount}</p>
                <p className="text-sm text-muted-foreground">Saved Properties</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeOffers}</p>
                <p className="text-sm text-muted-foreground">Active Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {buyer.pre_approval_status === "Pre-Approved" ? "Approved" : "Pending"}
                </p>
                <p className="text-sm text-muted-foreground">Pre-Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Budget Range</span>
                <span className="text-sm font-medium">
                  {formatCurrency(buyer.budget_min)} - {formatCurrency(buyer.budget_max)}
                </span>
              </div>
              {buyer.pre_approval_amount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pre-Approved For</span>
                  <span className="text-sm font-medium">{formatCurrency(buyer.pre_approval_amount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Min Bedrooms</span>
                <span className="text-sm font-medium">{buyer.min_beds || "Any"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Min Bathrooms</span>
                <span className="text-sm font-medium">{buyer.min_baths || "Any"}</span>
              </div>
            </div>

            <div className="space-y-3">
              {buyer.preferred_cities && buyer.preferred_cities.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Preferred Cities</span>
                  <div className="flex flex-wrap gap-1">
                    {buyer.preferred_cities.map((city) => (
                      <Badge key={city} variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {city}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {buyer.property_types && buyer.property_types.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Property Types</span>
                  <div className="flex flex-wrap gap-1">
                    {buyer.property_types.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(buyer.must_haves || buyer.nice_to_haves) && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {buyer.must_haves && (
                <div>
                  <span className="text-sm font-medium">Must-Haves:</span>
                  <p className="text-sm text-muted-foreground">{buyer.must_haves}</p>
                </div>
              )}
              {buyer.nice_to_haves && (
                <div>
                  <span className="text-sm font-medium">Nice-to-Haves:</span>
                  <p className="text-sm text-muted-foreground">{buyer.nice_to_haves}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
