import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a helpful AI assistant for a home buyer. You're speaking directly to the buyer to help them understand their home buying journey.

ROLE:
- Answer questions about the home buying process
- Provide educational information about real estate
- Explain what the buyer's current data means
- Be encouraging and supportive

LIMITATIONS (CRITICAL):
- You CANNOT take any actions - no scheduling, no offers, no changes
- You CANNOT access or modify any data beyond what's provided
- If they ask you to DO something, politely explain they should contact their agent
- Example: "I can explain what an earnest money deposit is, but to submit an offer, you'll need to work with your agent."

TONE:
- Friendly and warm, like a knowledgeable friend
- Use simple language, avoid jargon or explain it when used
- Be encouraging about their home buying journey
- Use the buyer's first name occasionally

FORMAT:
- Use markdown for clear formatting
- Use bullet points for lists
- Keep responses concise but thorough
- Break up long explanations into digestible sections`;

interface BuyerContext {
  name: string;
  currentStage: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preApprovalStatus: string | null;
  preApprovalAmount: number | null;
  preferredCities: string[] | null;
  propertyTypes: string[] | null;
  minBeds: number | null;
  minBaths: number | null;
  mustHaves: string | null;
  niceToHaves: string | null;
}

interface RequestBody {
  message: string;
  buyerId: string;
  buyerContext: BuyerContext;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { message, buyerId, buyerContext }: RequestBody = await req.json();

    // Fetch additional context: properties, offers
    const [propertiesResult, offersResult] = await Promise.all([
      supabase
        .from("buyer_properties")
        .select(`
          favorited,
          property:properties(address, city, state, price, bedrooms, bathrooms, sqft, status)
        `)
        .eq("buyer_id", buyerId)
        .eq("archived", false)
        .limit(10),
      supabase
        .from("offers")
        .select(`
          offer_amount,
          status,
          property:properties(address, city, state, price)
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Build properties context
    let propertiesContext = "";
    if (propertiesResult.data && propertiesResult.data.length > 0) {
      propertiesContext = `\n\nSAVED PROPERTIES (${propertiesResult.data.length} total):`;
      propertiesResult.data.forEach((bp: any, i: number) => {
        if (bp.property) {
          const p = bp.property;
          propertiesContext += `\n${i + 1}. ${p.address}, ${p.city}, ${p.state} - $${p.price?.toLocaleString()} | ${p.bedrooms}bd/${p.bathrooms}ba | ${p.sqft?.toLocaleString()} sqft | ${p.status}${bp.favorited ? " ⭐ (Favorited)" : ""}`;
        }
      });
    }

    // Build offers context
    let offersContext = "";
    if (offersResult.data && offersResult.data.length > 0) {
      offersContext = `\n\nACTIVE OFFERS:`;
      offersResult.data.forEach((offer: any, i: number) => {
        const p = offer.property;
        offersContext += `\n${i + 1}. ${p?.address || "Property"} - Offered $${offer.offer_amount?.toLocaleString()} | Status: ${offer.status}`;
      });
    }

    // Build budget string
    const budgetStr = buyerContext.budgetMin && buyerContext.budgetMax
      ? `$${buyerContext.budgetMin.toLocaleString()} - $${buyerContext.budgetMax.toLocaleString()}`
      : buyerContext.budgetMax
      ? `Up to $${buyerContext.budgetMax.toLocaleString()}`
      : "Not set";

    // Build preferences
    const preferencesStr = [
      buyerContext.preferredCities?.length ? `Cities: ${buyerContext.preferredCities.join(", ")}` : null,
      buyerContext.propertyTypes?.length ? `Types: ${buyerContext.propertyTypes.join(", ")}` : null,
      buyerContext.minBeds ? `Min beds: ${buyerContext.minBeds}` : null,
      buyerContext.minBaths ? `Min baths: ${buyerContext.minBaths}` : null,
    ].filter(Boolean).join(" | ");

    const contextString = `
BUYER INFORMATION:
- Name: ${buyerContext.name}
- Current Stage: ${buyerContext.currentStage || "Getting Started"}
- Budget: ${budgetStr}
- Pre-Approval: ${buyerContext.preApprovalStatus || "Not Started"}${buyerContext.preApprovalAmount ? ` ($${buyerContext.preApprovalAmount.toLocaleString()})` : ""}
- Preferences: ${preferencesStr || "Not specified"}
${buyerContext.mustHaves ? `- Must-Haves: ${buyerContext.mustHaves}` : ""}
${buyerContext.niceToHaves ? `- Nice-to-Haves: ${buyerContext.niceToHaves}` : ""}
${propertiesContext}
${offersContext}
`;

    const userPrompt = `${contextString}

BUYER'S QUESTION: ${message}

Respond helpfully to ${buyerContext.name.split(" ")[0]}'s question. Remember: you can only provide information and guidance, not take actions.`;

    // Stream from Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        stream: true,
        messages: [{ role: "user", content: SYSTEM_PROMPT + "\n\n" + userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Buyer portal chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Chat unavailable — try again",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
