import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatIfAnalysis {
  strategy_assessment: string;
  likelihood: "High" | "Medium" | "Low";
  recommended_contingencies: string[];
  risks: string[];
  negotiation_tips: string[];
  competitiveness: "conservative" | "competitive" | "aggressive";
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

      console.log("[analyze-what-if] Rate limit hit, attempt:", attempt + 1);

      if (attempt === maxRetries) {
        return response;
      }

      const backoffDelay = Math.pow(2, attempt + 1) * 1000;
      console.log(`[analyze-what-if] Retrying in ${backoffDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[analyze-what-if] Request failed on attempt ${attempt + 1}:`, error);
      
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
    const { property_id, buyer_id, offer_amount } = await req.json();

    console.log("[analyze-what-if] Request:", { property_id, buyer_id, offer_amount });

    if (!property_id || !buyer_id || !offer_amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: property_id, buyer_id, offer_amount" }),
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
      console.error("[analyze-what-if] Property fetch error:", propertyError);
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
      console.error("[analyze-what-if] Buyer fetch error:", buyerError);
      return new Response(
        JSON.stringify({ error: "Buyer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const askingPrice = property.price;
    const priceDiff = offer_amount - askingPrice;
    const priceDiffPercent = ((priceDiff / askingPrice) * 100).toFixed(1);
    const diffSign = priceDiff >= 0 ? "+" : "";

    console.log("[analyze-what-if] Property:", property.address, "Asking:", askingPrice);
    console.log("[analyze-what-if] Offer:", offer_amount, `(${diffSign}${priceDiffPercent}%)`);

    // Build Claude prompt
    const prompt = `Analyze this real estate offer strategy and provide guidance.

Property Details:
- Address: ${property.address}, ${property.city}, ${property.state}
- Listed Price: $${askingPrice.toLocaleString()}
- Beds: ${property.bedrooms}, Baths: ${property.bathrooms}, Sqft: ${property.sqft?.toLocaleString() || "N/A"}
- Days on Market: ${property.days_on_market || "Unknown"}
- Property Type: ${property.property_type || "Residential"}

Proposed Offer:
- Offer Amount: $${offer_amount.toLocaleString()}
- Difference vs Asking: ${diffSign}$${Math.abs(priceDiff).toLocaleString()} (${diffSign}${priceDiffPercent}%)

Buyer Information:
- Name: ${buyer.name}
- Pre-Approval Amount: ${buyer.pre_approval_amount ? "$" + buyer.pre_approval_amount.toLocaleString() : "Not specified"}
- Maximum Budget: ${buyer.budget_max ? "$" + buyer.budget_max.toLocaleString() : "Not specified"}

Provide a comprehensive analysis with:

1. strategy_assessment: 2-3 sentences assessing whether this offer is conservative, competitive, or aggressive given the market context and property details.

2. likelihood: Rate as "High", "Medium", or "Low" - the likelihood this offer will be accepted.

3. recommended_contingencies: Array of contingencies appropriate for this price point. Choose from: "financing", "inspection", "appraisal", "sale of current home". For aggressive/above-asking offers, fewer contingencies may be strategic.

4. risks: Array of 2-3 key risks or considerations with this offer strategy.

5. negotiation_tips: Array of 2-3 actionable negotiation tips for this specific scenario.

6. competitiveness: Categorize as "conservative", "competitive", or "aggressive" based on the offer amount vs asking.

Return ONLY a valid JSON object with these exact fields. No additional text or markdown.`;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("[analyze-what-if] ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-what-if] Calling Claude API...");

    const claudeHeaders = {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    };

    const claudeRequestBody = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
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
      console.error("[analyze-what-if] Claude API error:", claudeResponse.status, errorText);
      
      if (claudeResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a few moments." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to analyze offer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    console.log("[analyze-what-if] Claude response received");

    const responseText = claudeData.content?.[0]?.text || "";
    console.log("[analyze-what-if] Raw response:", responseText.substring(0, 500));

    // Parse the JSON response
    let analysis: WhatIfAnalysis;
    
    try {
      // Try to extract JSON object from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.error("[analyze-what-if] JSON parse error:", parseError);
      console.error("[analyze-what-if] Response was:", responseText);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-what-if] Analysis complete:", analysis.competitiveness);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        context: {
          property_id,
          property_address: property.address,
          asking_price: askingPrice,
          offer_amount,
          diff_percent: parseFloat(priceDiffPercent),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-what-if] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
