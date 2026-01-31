import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Home, DollarSign } from "lucide-react";

interface AgentBudgetStrategyCardProps {
  buyerId: string;
}

interface BuyerBudgetData {
  conservative_min: number | null;
  conservative_max: number | null;
  target_min: number | null;
  target_max: number | null;
  stretch_min: number | null;
  stretch_max: number | null;
  pre_approval_amount: number | null;
}

export function AgentBudgetStrategyCard({ buyerId }: AgentBudgetStrategyCardProps) {
  // Fetch buyer's budget bands
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ["buyer-budget-bands", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyers")
        .select("conservative_min, conservative_max, target_min, target_max, stretch_min, stretch_max, pre_approval_amount")
        .eq("id", buyerId)
        .single();
      
      if (error) throw error;
      return data as BuyerBudgetData;
    },
  });

  // Fetch properties count in target range
  const { data: propertiesInTargetRange = 0 } = useQuery({
    queryKey: ["agent-target-properties-count", buyerId, budgetData?.target_min, budgetData?.target_max],
    queryFn: async () => {
      if (!budgetData?.target_min || !budgetData?.target_max) return 0;
      
      // Get property IDs assigned to this buyer
      const { data: buyerProperties } = await supabase
        .from("buyer_properties")
        .select("property_id")
        .eq("buyer_id", buyerId)
        .eq("archived", false);

      if (!buyerProperties || buyerProperties.length === 0) return 0;

      const propertyIds = buyerProperties.map((bp) => bp.property_id);

      // Count properties in target range
      const { count } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .in("id", propertyIds)
        .gte("price", budgetData.target_min)
        .lte("price", budgetData.target_max);

      return count || 0;
    },
    enabled: !!budgetData?.target_min && !!budgetData?.target_max,
  });

  // Check if we have budget bands data
  const hasBudgetBands = budgetData?.conservative_min != null && 
                          budgetData?.target_min != null && 
                          budgetData?.stretch_min != null;

  if (isLoading) {
    return null; // Don't show loading state - just hide until loaded
  }

  if (!hasBudgetBands) {
    return null;
  }

  const {
    conservative_min,
    conservative_max,
    target_min,
    target_max,
    stretch_min,
    stretch_max,
    pre_approval_amount,
  } = budgetData;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate the overall range for positioning
  const allValues = [
    conservative_min,
    conservative_max,
    target_min,
    target_max,
    stretch_min,
    stretch_max,
  ].filter((v): v is number => v != null);
  
  const overallMin = Math.min(...allValues);
  const overallMax = Math.max(...allValues);
  const range = overallMax - overallMin;

  const getBarPosition = (min: number, max: number) => {
    const left = ((min - overallMin) / range) * 100;
    const width = ((max - min) / range) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const bands = [
    {
      label: "Conservative",
      min: conservative_min!,
      max: conservative_max!,
      color: "bg-green-500",
      textColor: "text-green-700",
    },
    {
      label: "Target",
      min: target_min!,
      max: target_max!,
      color: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "Stretch",
      min: stretch_min!,
      max: stretch_max!,
      color: "bg-orange-500",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="max-w-3xl mb-12">
      <p className="text-xs uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
        Budget Strategy
      </p>
      
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget Strategy
          </CardTitle>
          <p className="text-sm text-muted-foreground">Based on financial analysis</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Budget Bars */}
          <div className="space-y-4">
            {bands.map((band) => {
              const position = getBarPosition(band.min, band.max);
              return (
                <div key={band.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${band.textColor}`}>{band.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrencyFull(band.min)} - {formatCurrencyFull(band.max)}
                    </span>
                  </div>
                  <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full ${band.color} rounded-full transition-all`}
                      style={position}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{formatCurrency(overallMin)}</span>
            <span>{formatCurrency(overallMax)}</span>
          </div>

          {/* Recommendation Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Recommended Focus: Target Band ({formatCurrency(target_min!)} - {formatCurrency(target_max!)})
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This range balances affordability with strong options in the market.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {pre_approval_amount && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  Pre-Approval
                </div>
                <p className="text-lg font-semibold">{formatCurrencyFull(pre_approval_amount)}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Home className="h-4 w-4" />
                In Target Range
              </div>
              <p className="text-lg font-semibold">
                {propertiesInTargetRange} {propertiesInTargetRange === 1 ? "property" : "properties"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
