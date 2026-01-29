import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GlobalProperty {
  id: string;
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
  createdAt: string;
  // Buyer assignments
  buyerAssignments: {
    buyerId: string;
    buyerName: string;
    favorited: boolean;
    viewed: boolean;
    scheduledDate?: string;
  }[];
}

export function useAllProperties() {
  const [properties, setProperties] = useState<GlobalProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAllProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all properties with their buyer assignments
      const { data: propertiesData, error: propError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propError) throw propError;

      // Fetch buyer_properties to get assignments
      const { data: buyerPropsData, error: bpError } = await supabase
        .from("buyer_properties")
        .select("*")
        .eq("archived", false);

      if (bpError) throw bpError;

      // Fetch buyers for names
      const { data: buyersData, error: buyersError } = await supabase
        .from("buyers")
        .select("id, name");

      if (buyersError) throw buyersError;

      // Create buyer name lookup
      const buyerNameMap = new Map(
        (buyersData || []).map((b: any) => [b.id, b.name])
      );

      // Group buyer_properties by property_id
      const assignmentsByProperty = new Map<string, any[]>();
      (buyerPropsData || []).forEach((bp: any) => {
        const existing = assignmentsByProperty.get(bp.property_id) || [];
        existing.push(bp);
        assignmentsByProperty.set(bp.property_id, existing);
      });

      // Transform properties
      const transformed: GlobalProperty[] = (propertiesData || []).map((p: any) => {
        const assignments = assignmentsByProperty.get(p.id) || [];
        
        return {
          id: p.id,
          mlsId: p.mls_id,
          address: p.address,
          city: p.city,
          state: p.state,
          zipCode: p.zip_code,
          price: Number(p.price),
          bedrooms: p.bedrooms,
          bathrooms: Number(p.bathrooms),
          sqft: p.sqft,
          yearBuilt: p.year_built,
          pricePerSqft: p.price_per_sqft ? Number(p.price_per_sqft) : Math.round(Number(p.price) / p.sqft),
          daysOnMarket: p.days_on_market || 0,
          propertyType: p.property_type,
          status: p.status || "active",
          description: p.description,
          features: Array.isArray(p.features) ? p.features : [],
          images: Array.isArray(p.photos) ? p.photos : [],
          listingUrl: p.listing_url,
          mlsNumber: p.mls_number,
          createdAt: p.created_at,
          buyerAssignments: assignments.map((bp: any) => ({
            buyerId: bp.buyer_id,
            buyerName: buyerNameMap.get(bp.buyer_id) || "Unknown Buyer",
            favorited: bp.favorited || false,
            viewed: bp.viewed || false,
            scheduledDate: bp.scheduled_showing_datetime,
          })),
        };
      });

      setProperties(transformed);
      return transformed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch properties";
      setError(message);
      console.error("Error fetching all properties:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAllProperties();
  }, [fetchAllProperties]);

  return {
    properties,
    isLoading,
    error,
    fetchAllProperties,
  };
}
