import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MLSProperty, BuyerProperty, BuyerProfile } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

interface PropertyWithDetails extends BuyerProperty {
  property: MLSProperty;
}

export function useBuyerProperties(buyerId: string) {
  const [properties, setProperties] = useState<PropertyWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProperties = useCallback(async () => {
    if (!buyerId) return [];
    
    setIsLoading(true);
    setError(null);

    try {
      // Fetch buyer_properties with joined property data
      const { data, error: fetchError } = await supabase
        .from("buyer_properties")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("buyer_id", buyerId)
        .eq("archived", false)
        .order("assigned_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Transform to our interface
      const transformed: PropertyWithDetails[] = (data || []).map((bp: any) => ({
        id: bp.id,
        buyerId: bp.buyer_id,
        propertyId: bp.property_id,
        viewed: bp.viewed || false,
        scheduledShowingDatetime: bp.scheduled_showing_datetime,
        favorited: bp.favorited || false,
        archived: bp.archived || false,
        agentNotes: bp.agent_notes,
        aiAnalysis: bp.ai_analysis,
        aiAnalysisGeneratedAt: bp.ai_analysis_generated_at,
        assignedAt: bp.assigned_at,
        property: {
          id: bp.property.id,
          mlsId: bp.property.mls_id,
          address: bp.property.address,
          city: bp.property.city,
          state: bp.property.state,
          zipCode: bp.property.zip_code,
          price: Number(bp.property.price),
          bedrooms: bp.property.bedrooms,
          bathrooms: Number(bp.property.bathrooms),
          sqft: bp.property.sqft,
          yearBuilt: bp.property.year_built,
          pricePerSqft: bp.property.price_per_sqft ? Number(bp.property.price_per_sqft) : undefined,
          daysOnMarket: bp.property.days_on_market,
          propertyType: bp.property.property_type,
          status: bp.property.status as "active" | "pending" | "sold" | "withdrawn",
          description: bp.property.description,
          features: bp.property.features || [],
          photos: bp.property.photos || [],
          listingUrl: bp.property.listing_url,
          mlsNumber: bp.property.mls_number,
          listingAgent: bp.property.listing_agent,
          lotSize: bp.property.lot_size,
          rawData: bp.property.raw_data,
        },
      }));

      setProperties(transformed);
      return transformed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch properties";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [buyerId, toast]);

  const toggleFavorite = useCallback(async (buyerPropertyId: string) => {
    const current = properties.find(p => p.id === buyerPropertyId);
    if (!current) return;

    const newValue = !current.favorited;

    // Optimistic update
    setProperties(prev => 
      prev.map(p => p.id === buyerPropertyId ? { ...p, favorited: newValue } : p)
    );

    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ favorited: newValue })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;
    } catch (err) {
      // Revert on error
      setProperties(prev => 
        prev.map(p => p.id === buyerPropertyId ? { ...p, favorited: !newValue } : p)
      );
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  }, [properties, toast]);

  const markAsViewed = useCallback(async (buyerPropertyId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ viewed: true })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;

      setProperties(prev => 
        prev.map(p => p.id === buyerPropertyId ? { ...p, viewed: true } : p)
      );
    } catch (err) {
      console.error("Failed to mark as viewed:", err);
    }
  }, []);

  const archiveProperty = useCallback(async (buyerPropertyId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ archived: true })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;

      setProperties(prev => prev.filter(p => p.id !== buyerPropertyId));
      
      toast({
        title: "Property archived",
        description: "Property has been removed from this buyer's list",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to archive property",
        variant: "destructive",
      });
    }
  }, [toast]);

  const generateAnalysis = useCallback(async (
    buyerPropertyId: string, 
    property: MLSProperty, 
    buyerProfile: BuyerProfile
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("property-analysis", {
        body: { property, buyerProfile },
      });

      if (fnError) throw fnError;

      // Update the analysis in the database
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ 
          ai_analysis: data?.analysis || "",
          ai_analysis_generated_at: new Date().toISOString(),
        })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;

      // Update local state
      setProperties(prev => 
        prev.map(p => p.id === buyerPropertyId 
          ? { ...p, aiAnalysis: data?.analysis, aiAnalysisGeneratedAt: new Date().toISOString() } 
          : p
        )
      );

      return data?.analysis;
    } catch (err) {
      console.error("Failed to generate analysis:", err);
      toast({
        title: "Analysis Error",
        description: "Failed to generate property analysis",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  return {
    properties,
    isLoading,
    error,
    fetchProperties,
    toggleFavorite,
    markAsViewed,
    archiveProperty,
    generateAnalysis,
    favorites: properties.filter(p => p.favorited),
  };
}
