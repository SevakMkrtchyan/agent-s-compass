import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OfferScenario {
  id: string;
  name: string;
  offer_amount: number;
  earnest_money: number;
  contingencies: string[];
  rationale: string;
  competitiveness: "conservative" | "competitive" | "aggressive";
  status: "ready" | "pending";
}

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  days_on_market?: number;
  property_type?: string;
}

interface BuyerData {
  id: string;
  name: string;
  pre_approval_amount?: number;
  budget_max?: number;
}

// Helper function to call Claude API with retry logic for 429 rate limits
async function callClaudeWithRetry(
  requestBody: Record<string, unknown>,
  headers: Record<string, string>,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (response.status !== 429) {
        return response;
      }

      console.log("[generate-offer-scenarios] Rate limit hit, attempt:", attempt + 1);

      if (attempt === maxRetries) {
        return response;
      }

      const backoffDelay = Math.pow(2, attempt + 1) * 1000;
      console.log(`[generate-offer-scenarios] Retrying in ${backoffDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[generate-offer-scenarios] Request failed on attempt ${attempt + 1}:`, error);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const backoffDelay = Math.pow(2, attempt + 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id, buyer_id } = await req.json();

    console.log("[generate-offer-scenarios] Request:", { property_id, buyer_id });

    if (!property_id || !buyer_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: property_id, buyer_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch property data
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      console.error("[generate-offer-scenarios] Property fetch error:", propertyError);
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch buyer data
    const { data: buyer, error: buyerError } = await supabase
      .from("buyers")
      .select("id, name, pre_approval_amount, budget_max")
      .eq("id", buyer_id)
      .single();

    if (buyerError || !buyer) {
      console.error("[generate-offer-scenarios] Buyer fetch error:", buyerError);
      return new Response(
        JSON.stringify({ error: "Buyer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const propertyData: PropertyData = property;
    const buyerData: BuyerData = buyer;

    console.log("[generate-offer-scenarios] Property:", propertyData.address, "Price:", propertyData.price);
    console.log("[generate-offer-scenarios] Buyer:", buyerData.name, "Pre-approval:", buyerData.pre_approval_amount);

    // Build Claude prompt
    const prompt = `Generate 3 offer scenarios for this property purchase.

Property Details:
- Address: ${propertyData.address}, ${propertyData.city}, ${propertyData.state}
- Listed Price: $${propertyData.price.toLocaleString()}
- Beds: ${propertyData.bedrooms}, Baths: ${propertyData.bathrooms}, Sqft: ${propertyData.sqft.toLocaleString()}
- Days on Market: ${propertyData.days_on_market || "Unknown"}
- Property Type: ${propertyData.property_type || "Residential"}

Buyer Information:
- Name: ${buyerData.name}
- Pre-Approval Amount: ${buyerData.pre_approval_amount ? "$" + buyerData.pre_approval_amount.toLocaleString() : "Not specified"}
- Maximum Budget: ${buyerData.budget_max ? "$" + buyerData.budget_max.toLocaleString() : "Not specified"}

Create 3 scenarios: Conservative, Competitive, and Aggressive.

For each scenario provide:
- name: "Conservative", "Competitive", or "Aggressive"
- offer_amount: Offer price in dollars (number only)
- earnest_money: Earnest deposit, typically 1-3% of offer (number only)
- contingencies: Array of which to include from ["financing", "inspection", "appraisal"]
- rationale: 2-3 sentences explaining this strategy and when it's appropriate
- competitiveness: "conservative", "competitive", or "aggressive"
- status: "ready" if buyer can afford it based on pre-approval, "pending" if it exceeds their budget

Important:
- Conservative: 2-5% below asking, all contingencies, lowest risk
- Competitive: At or near asking, keep financing/inspection, waive appraisal
- Aggressive: 2-5% above asking, minimal contingencies, highest risk but strongest offer

Return ONLY a valid JSON array with these 3 scenario objects. No additional text, no markdown, just the JSON array.`;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("[generate-offer-scenarios] ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-offer-scenarios] Calling Claude API...");

    const claudeHeaders = {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    };

    const claudeRequestBody = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const claudeResponse = await callClaudeWithRetry(claudeRequestBody, claudeHeaders, 3);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[generate-offer-scenarios] Claude API error:", claudeResponse.status, errorText);
      
      if (claudeResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a few moments." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate scenarios" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    console.log("[generate-offer-scenarios] Claude response received");

    const responseText = claudeData.content?.[0]?.text || "";
    console.log("[generate-offer-scenarios] Raw response:", responseText.substring(0, 500));

    // Parse the JSON response
    let scenarios: OfferScenario[] = [];
    
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scenarios = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("[generate-offer-scenarios] JSON parse error:", parseError);
      console.error("[generate-offer-scenarios] Response was:", responseText);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add IDs to scenarios
    scenarios = scenarios.map((scenario, index) => ({
      ...scenario,
      id: `ai-${Date.now()}-${index}`,
    }));

    console.log("[generate-offer-scenarios] Generated", scenarios.length, "scenarios");

    return new Response(
      JSON.stringify({ 
        success: true, 
        scenarios,
        property: {
          id: propertyData.id,
          address: propertyData.address,
          price: propertyData.price,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-offer-scenarios] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
