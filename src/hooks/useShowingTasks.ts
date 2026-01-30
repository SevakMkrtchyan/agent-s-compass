import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Temporary agent ID for development (will be replaced with auth)
const TEMP_AGENT_ID = "00000000-0000-0000-0000-000000000001";

interface PropertyWithDetails {
  id: string;
  propertyId: string;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
  };
  agentNotes?: string;
}

interface CreateShowingTasksResult {
  created: number;
  skipped: number;
  total: number;
}

/**
 * Hook to create showing tasks from buyer properties
 * Creates one task per property when "Schedule property showings" action is clicked
 */
export function useCreateShowingTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buyerId,
      stageId,
      agentId,
    }: {
      buyerId: string;
      stageId?: string;
      agentId?: string;
    }): Promise<CreateShowingTasksResult> => {
      // 1. Fetch all non-archived properties for this buyer
      const { data: buyerProperties, error: fetchError } = await supabase
        .from("buyer_properties")
        .select(`
          id,
          property_id,
          agent_notes,
          property:properties(
            id,
            address,
            city,
            state,
            price,
            bedrooms,
            bathrooms,
            sqft
          )
        `)
        .eq("buyer_id", buyerId)
        .eq("archived", false);

      if (fetchError) throw fetchError;

      if (!buyerProperties || buyerProperties.length === 0) {
        throw new Error("NO_PROPERTIES");
      }

      // 2. Check for existing showing tasks for these properties
      const propertyIds = buyerProperties.map((bp: any) => bp.property?.id).filter(Boolean);
      
      const { data: existingTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, property_id")
        .eq("buyer_id", buyerId)
        .eq("source_action_id", "schedule-showings")
        .in("property_id", propertyIds)
        .neq("status", "Complete");

      if (tasksError) throw tasksError;

      const existingPropertyIds = new Set((existingTasks || []).map(t => t.property_id));

      // 3. Create tasks for properties that don't have one
      const tasksToCreate = buyerProperties
        .filter((bp: any) => bp.property && !existingPropertyIds.has(bp.property.id))
        .map((bp: any) => {
          const property = bp.property;
          const fullAddress = `${property.address}, ${property.city}, ${property.state}`;
          
          // Format description with property details
          const description = `Property: ${fullAddress}
Price: $${Number(property.price).toLocaleString()}
${property.bedrooms} bed, ${property.bathrooms} bath, ${property.sqft?.toLocaleString() || 'N/A'} sqft
${bp.agent_notes ? `\nAgent notes: ${bp.agent_notes}` : ''}`;

          return {
            agent_id: agentId || TEMP_AGENT_ID,
            buyer_id: buyerId,
            stage_id: stageId || null,
            property_id: property.id,
            title: `Schedule showing: ${property.address}`,
            description,
            source_action_id: "schedule-showings",
            priority: "High",
            assigned_to: "Agent",
            status: "To Do",
          };
        });

      if (tasksToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from("tasks")
          .insert(tasksToCreate);

        if (insertError) throw insertError;
      }

      return {
        created: tasksToCreate.length,
        skipped: existingPropertyIds.size,
        total: buyerProperties.length,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/**
 * Hook to get property details for a task
 */
export function useTaskProperty(propertyId: string | null | undefined) {
  return {
    // We'll fetch this inline in the component for simplicity
  };
}
