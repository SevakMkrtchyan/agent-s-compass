import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Offer {
  id: string;
  buyerId: string;
  propertyId: string | null;
  templateId: string;
  agentId: string;
  offerAmount: number;
  status: "Draft" | "Submitted" | "Countered" | "Accepted" | "Rejected" | "Withdrawn";
  fieldValues: {
    earnestMoney?: number;
    closingDate?: string;
    contingencies?: string[];
    notes?: string;
    closingCostCredit?: number;
  };
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  generatedDocumentUrl: string | null;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
  } | null;
}

export interface CreateOfferInput {
  propertyId: string;
  offerAmount: number;
  earnestMoney: number;
  closingDate?: string;
  contingencies: string[];
  notes?: string;
  closingCostCredit?: number;
}

const MOCK_AGENT_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_TEMPLATE_ID = "77e3bf26-5710-4714-97db-857e8bd32990"; // Existing template from DB

export function useOffers(buyerId: string) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOffers = useCallback(async () => {
    if (!buyerId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("offers")
        .select(`
          *,
          property:properties(
            id,
            address,
            city,
            state,
            zip_code,
            price,
            bedrooms,
            bathrooms,
            sqft
          )
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const transformed: Offer[] = (data || []).map((o: any) => ({
        id: o.id,
        buyerId: o.buyer_id,
        propertyId: o.property_id,
        templateId: o.template_id,
        agentId: o.agent_id,
        offerAmount: Number(o.offer_amount),
        status: o.status as Offer["status"],
        fieldValues: o.field_values || {},
        submittedAt: o.submitted_at,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        generatedDocumentUrl: o.generated_document_url,
        property: o.property ? {
          id: o.property.id,
          address: o.property.address,
          city: o.property.city,
          state: o.property.state,
          zipCode: o.property.zip_code,
          price: Number(o.property.price),
          bedrooms: o.property.bedrooms,
          bathrooms: Number(o.property.bathrooms),
          sqft: o.property.sqft,
        } : null,
      }));

      setOffers(transformed);
      return transformed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch offers";
      setError(message);
      console.error("Error fetching offers:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const createOffer = useCallback(async (input: CreateOfferInput): Promise<Offer | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from("offers")
        .insert({
          buyer_id: buyerId,
          property_id: input.propertyId,
          template_id: DEFAULT_TEMPLATE_ID,
          agent_id: MOCK_AGENT_ID,
          offer_amount: input.offerAmount,
          status: "Draft",
          field_values: {
            earnestMoney: input.earnestMoney,
            closingDate: input.closingDate,
            contingencies: input.contingencies,
            notes: input.notes,
            closingCostCredit: input.closingCostCredit || 0,
          },
        })
        .select(`
          *,
          property:properties(
            id,
            address,
            city,
            state,
            zip_code,
            price,
            bedrooms,
            bathrooms,
            sqft
          )
        `)
        .single();

      if (insertError) throw insertError;

      const newOffer: Offer = {
        id: data.id,
        buyerId: data.buyer_id,
        propertyId: data.property_id,
        templateId: data.template_id,
        agentId: data.agent_id,
        offerAmount: Number(data.offer_amount),
        status: data.status as Offer["status"],
        fieldValues: (data.field_values as Offer["fieldValues"]) || {},
        submittedAt: data.submitted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        generatedDocumentUrl: data.generated_document_url,
        property: data.property ? {
          id: data.property.id,
          address: data.property.address,
          city: data.property.city,
          state: data.property.state,
          zipCode: data.property.zip_code,
          price: Number(data.property.price),
          bedrooms: data.property.bedrooms,
          bathrooms: Number(data.property.bathrooms),
          sqft: data.property.sqft,
        } : null,
      };

      setOffers(prev => [newOffer, ...prev]);
      
      toast({
        title: "Offer created",
        description: `Draft offer for ${newOffer.property?.address || "property"} saved successfully`,
      });

      return newOffer;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create offer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [buyerId, toast]);

  const updateOffer = useCallback(async (
    offerId: string,
    updates: Partial<Pick<Offer, "offerAmount" | "status" | "fieldValues">>
  ): Promise<boolean> => {
    try {
      const updatePayload: any = {};
      
      if (updates.offerAmount !== undefined) {
        updatePayload.offer_amount = updates.offerAmount;
      }
      if (updates.status !== undefined) {
        updatePayload.status = updates.status;
        if (updates.status === "Submitted") {
          updatePayload.submitted_at = new Date().toISOString();
        }
      }
      if (updates.fieldValues !== undefined) {
        updatePayload.field_values = updates.fieldValues;
      }

      const { error: updateError } = await supabase
        .from("offers")
        .update(updatePayload)
        .eq("id", offerId);

      if (updateError) throw updateError;

      setOffers(prev =>
        prev.map(o => {
          if (o.id !== offerId) return o;
          return {
            ...o,
            offerAmount: updates.offerAmount ?? o.offerAmount,
            status: updates.status ?? o.status,
            fieldValues: updates.fieldValues ?? o.fieldValues,
            updatedAt: new Date().toISOString(),
            submittedAt: updates.status === "Submitted" ? new Date().toISOString() : o.submittedAt,
          };
        })
      );

      toast({
        title: "Offer updated",
        description: updates.status ? `Status changed to ${updates.status}` : "Offer details saved",
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update offer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const deleteOffer = useCallback(async (offerId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("offers")
        .delete()
        .eq("id", offerId);

      if (deleteError) throw deleteError;

      setOffers(prev => prev.filter(o => o.id !== offerId));
      
      toast({
        title: "Offer deleted",
        description: "The offer has been removed",
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete offer";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    offers,
    isLoading,
    error,
    fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    drafts: offers.filter(o => o.status === "Draft"),
    activeOffers: offers.filter(o => ["Submitted", "Countered"].includes(o.status)),
    closedOffers: offers.filter(o => ["Accepted", "Rejected", "Withdrawn"].includes(o.status)),
  };
}
