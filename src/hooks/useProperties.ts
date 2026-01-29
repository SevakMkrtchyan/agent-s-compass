import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PropertyWithBuyerData {
  id: string;
  buyerPropertyId: string;
  mlsId?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  pricePerSqft?: number;
  daysOnMarket: number;
  propertyType?: string;
  status: string;
  description?: string;
  features: string[];
  images: string[];
  listingUrl?: string;
  mlsNumber?: string;
  listingAgent?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  lotSize?: string;
  // Buyer-specific fields
  viewed: boolean;
  scheduled: boolean;
  scheduledDate?: string;
  favorited: boolean;
  archived: boolean;
  agentNotes?: string;
  aiAnalysis?: string;
  aiAnalysisGeneratedAt?: string;
  assignedAt: string;
}

export function useProperties(buyerId: string) {
  const [properties, setProperties] = useState<PropertyWithBuyerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProperties = useCallback(async () => {
    if (!buyerId) return [];
    
    setIsLoading(true);
    setError(null);

    try {
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

      const transformed: PropertyWithBuyerData[] = (data || []).map((bp: any) => ({
        id: bp.property.id,
        buyerPropertyId: bp.id,
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
        pricePerSqft: bp.property.price_per_sqft ? Number(bp.property.price_per_sqft) : Math.round(Number(bp.property.price) / bp.property.sqft),
        daysOnMarket: bp.property.days_on_market || 0,
        propertyType: bp.property.property_type,
        status: bp.property.status || "active",
        description: bp.property.description,
        features: Array.isArray(bp.property.features) ? bp.property.features : [],
        images: Array.isArray(bp.property.photos) ? bp.property.photos : [],
        listingUrl: bp.property.listing_url,
        mlsNumber: bp.property.mls_number,
        listingAgent: bp.property.listing_agent,
        lotSize: bp.property.lot_size,
        // Buyer-specific
        viewed: bp.viewed || false,
        scheduled: !!bp.scheduled_showing_datetime,
        scheduledDate: bp.scheduled_showing_datetime,
        favorited: bp.favorited || false,
        archived: bp.archived || false,
        agentNotes: bp.agent_notes,
        aiAnalysis: bp.ai_analysis,
        aiAnalysisGeneratedAt: bp.ai_analysis_generated_at,
        assignedAt: bp.assigned_at,
      }));

      setProperties(transformed);
      return transformed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch properties";
      setError(message);
      console.error("Error fetching properties:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [buyerId]);

  const toggleFavorite = useCallback(async (buyerPropertyId: string) => {
    const current = properties.find(p => p.buyerPropertyId === buyerPropertyId);
    if (!current) return;

    const newValue = !current.favorited;

    // Optimistic update
    setProperties(prev => 
      prev.map(p => p.buyerPropertyId === buyerPropertyId ? { ...p, favorited: newValue } : p)
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
        prev.map(p => p.buyerPropertyId === buyerPropertyId ? { ...p, favorited: !newValue } : p)
      );
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  }, [properties, toast]);

  const toggleViewed = useCallback(async (buyerPropertyId: string) => {
    const current = properties.find(p => p.buyerPropertyId === buyerPropertyId);
    if (!current) return;

    const newValue = !current.viewed;

    setProperties(prev => 
      prev.map(p => p.buyerPropertyId === buyerPropertyId ? { ...p, viewed: newValue } : p)
    );

    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ viewed: newValue })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;
    } catch (err) {
      setProperties(prev => 
        prev.map(p => p.buyerPropertyId === buyerPropertyId ? { ...p, viewed: !newValue } : p)
      );
      console.error("Failed to toggle viewed:", err);
    }
  }, [properties]);

  const archiveProperty = useCallback(async (buyerPropertyId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ archived: true })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;

      setProperties(prev => prev.filter(p => p.buyerPropertyId !== buyerPropertyId));
      
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

  const updateAgentNotes = useCallback(async (buyerPropertyId: string, notes: string) => {
    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ agent_notes: notes })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;

      setProperties(prev => 
        prev.map(p => p.buyerPropertyId === buyerPropertyId ? { ...p, agentNotes: notes } : p)
      );
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    }
  }, [toast]);

  const scheduleShowing = useCallback(async (buyerPropertyId: string, datetime?: string) => {
    try {
      const { error: updateError } = await supabase
        .from("buyer_properties")
        .update({ 
          scheduled_showing_datetime: datetime || new Date().toISOString() 
        })
        .eq("id", buyerPropertyId);

      if (updateError) throw updateError;

      setProperties(prev => 
        prev.map(p => p.buyerPropertyId === buyerPropertyId 
          ? { ...p, scheduled: true, scheduledDate: datetime || new Date().toISOString() } 
          : p
        )
      );

      toast({
        title: "Showing scheduled",
        description: "Showing has been scheduled for this property",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to schedule showing",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Auto-fetch on mount
  useEffect(() => {
    if (buyerId) {
      fetchProperties();
    }
  }, [buyerId, fetchProperties]);

  return {
    properties,
    isLoading,
    error,
    fetchProperties,
    toggleFavorite,
    toggleViewed,
    archiveProperty,
    updateAgentNotes,
    scheduleShowing,
    favorites: properties.filter(p => p.favorited),
    setProperties,
  };
}
