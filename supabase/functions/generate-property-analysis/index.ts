import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ComparableParams {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { propertyId, buyerId } = await req.json();

    if (!propertyId || !buyerId) {
      throw new Error("propertyId and buyerId are required");
    }

    console.log(`Generating analysis for property ${propertyId}, buyer ${buyerId}`);

    // 1. Fetch property from database
    const { data: property, error: propertyError } = await supabaseClient
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle();

    if (propertyError) {
      console.error("Error fetching property:", propertyError);
      throw new Error(`Failed to fetch property: ${propertyError.message}`);
    }

    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }

    console.log(`Found property: ${property.address}, ${property.city}`);

    // 2. Fetch buyer from database
    const { data: buyer, error: buyerError } = await supabaseClient
      .from("buyers")
      .select("*")
      .eq("id", buyerId)
      .maybeSingle();

    if (buyerError) {
      console.error("Error fetching buyer:", buyerError);
      throw new Error(`Failed to fetch buyer: ${buyerError.message}`);
    }

    if (!buyer) {
      throw new Error(`Buyer not found: ${buyerId}`);
    }

    console.log(`Found buyer: ${buyer.name}, type: ${buyer.buyer_type}`);

    // 3. Fetch comparable properties from Zillow API
    const comparables = await fetchComparables({
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zip_code,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
    });

    console.log(`Found ${comparables.length} comparable properties`);

    // 4. Build the prompt and generate analysis
    const analysis = await generateAnalysis(property, buyer, comparables);

    console.log(`Generated analysis (${analysis.length} chars)`);

    // 5. Save analysis to buyer_properties junction table
    const { error: updateError } = await supabaseClient
      .from("buyer_properties")
      .update({
        ai_analysis: analysis,
        ai_analysis_generated_at: new Date().toISOString(),
      })
      .eq("property_id", propertyId)
      .eq("buyer_id", buyerId);

    if (updateError) {
      console.error("Error saving analysis:", updateError);
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log("Analysis saved successfully");

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-property-analysis:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchComparables(params: ComparableParams): Promise<any[]> {
  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
  
  if (!RAPIDAPI_KEY) {
    console.warn("RAPIDAPI_KEY not configured, returning empty comparables");
    return [];
  }

  try {
    const location = `${params.address}, ${params.city}, ${params.state} ${params.zipCode}`;
    const url = new URL("https://zillow-com1.p.rapidapi.com/similarSales");
    url.searchParams.set("location", location);
    url.searchParams.set("beds_min", String(Math.max(1, params.bedrooms - 1)));
    url.searchParams.set("beds_max", String(params.bedrooms + 1));
    url.searchParams.set("baths_min", String(Math.max(1, params.bathrooms - 1)));
    url.searchParams.set("baths_max", String(params.bathrooms + 1));
    url.searchParams.set("sqft_min", String(Math.round(params.sqft * 0.8)));
    url.searchParams.set("sqft_max", String(Math.round(params.sqft * 1.2)));
    url.searchParams.set("status_type", "RecentlySold");
    url.searchParams.set("sold_in_last", "6");

    console.log(`Fetching comparables for: ${location}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      console.warn(`Zillow API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const props = data.props || data.results || [];

    return props.slice(0, 5).map((comp: any) => ({
      address: comp.address || comp.streetAddress,
      city: comp.city,
      state: comp.state,
      price: comp.price || comp.soldPrice,
      bedrooms: comp.bedrooms || comp.beds,
      bathrooms: comp.bathrooms || comp.baths,
      sqft: comp.livingArea || comp.sqft,
      pricePerSqft: comp.price && comp.livingArea ? Math.round(comp.price / comp.livingArea) : null,
      dateSold: comp.dateSold || comp.soldDate,
      status: "Sold",
    }));
  } catch (error) {
    console.error("Error fetching comparables:", error);
    return [];
  }
}

async function generateAnalysis(property: any, buyer: any, comparables: any[]): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const systemPrompt = `You are an expert real estate market analyst providing comprehensive property analysis for real estate agents and their clients. Your analysis should be:
- Data-driven and factual
- Tailored to the specific buyer profile type
- Professional but accessible
- Actionable with clear recommendations

Format your response with clear sections using markdown headers (##). Use bullet points for key insights. Include specific numbers and percentages when relevant.`;

  const userPrompt = buildAnalysisPrompt(property, buyer, comparables);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits.");
    }
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function buildAnalysisPrompt(property: any, buyer: any, comparables: any[]): string {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);

  const pricePerSqft = property.price_per_sqft || Math.round(property.price / property.sqft);
  const buyerType = buyer.buyer_type || "general";

  let prompt = `Analyze this property for ${buyer.name}, a **${buyerType}** buyer.

## Property Details
- **Address:** ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
- **Price:** ${formatPrice(property.price)}
- **Size:** ${property.bedrooms} beds, ${property.bathrooms} baths, ${property.sqft?.toLocaleString()} sqft
- **Price/sqft:** $${pricePerSqft}
- **Days on Market:** ${property.days_on_market || "N/A"}
- **Year Built:** ${property.year_built || "N/A"}
- **Property Type:** ${property.property_type || "Single Family"}
- **Status:** ${property.status || "Active"}
${property.lot_size ? `- **Lot Size:** ${property.lot_size}` : ""}
${property.description ? `- **Description:** ${property.description}` : ""}

## Buyer Profile
- **Name:** ${buyer.name}
- **Buyer Type:** ${buyerType}
${buyer.budget_min && buyer.budget_max ? `- **Budget:** ${formatPrice(buyer.budget_min)} - ${formatPrice(buyer.budget_max)}` : ""}
${buyer.pre_approval_amount ? `- **Pre-Approval:** ${formatPrice(buyer.pre_approval_amount)}` : ""}
${buyer.preferred_cities?.length ? `- **Preferred Areas:** ${buyer.preferred_cities.join(", ")}` : ""}
${buyer.must_haves ? `- **Must-Haves:** ${buyer.must_haves}` : ""}
${buyer.nice_to_haves ? `- **Nice-to-Haves:** ${buyer.nice_to_haves}` : ""}
${buyer.agent_notes ? `- **Agent Notes:** ${buyer.agent_notes}` : ""}
`;

  if (comparables.length > 0) {
    prompt += `\n## Comparable Properties (Recently Sold)\n`;
    comparables.forEach((comp, i) => {
      prompt += `${i + 1}. ${comp.address}, ${comp.city}, ${comp.state}\n`;
      prompt += `   Price: ${formatPrice(comp.price)}, ${comp.bedrooms}bd/${comp.bathrooms}ba, ${comp.sqft?.toLocaleString()}sqft`;
      if (comp.pricePerSqft) prompt += `, $${comp.pricePerSqft}/sqft`;
      if (comp.dateSold) prompt += `, Sold: ${comp.dateSold}`;
      prompt += "\n";
    });
  }

  prompt += getAnalysisSectionsForBuyerType(buyerType, property, buyer);

  return prompt;
}

function getAnalysisSectionsForBuyerType(buyerType: string, property: any, buyer: any): string {
  const normalizedType = (buyerType || "").toLowerCase().replace(/[_-]/g, " ");

  if (normalizedType.includes("investor") || normalizedType.includes("investment")) {
    return `

Please provide a comprehensive **INVESTMENT ANALYSIS** including:

## Value Assessment
- Is this property fairly priced compared to market?
- Price per sqft analysis vs area median

## Investment Metrics
- ARV (After Repair Value) estimate
- Estimated repair/update costs
- Cash flow projection (rental income vs expenses)
- Cap rate and cash-on-cash return estimates

## Risk Assessment
- Potential red flags
- Market conditions

## Recommendation
- Is this a BUY, HOLD, or PASS?
- Best strategy (flip vs hold)
- Suggested offer range`;
  }

  if (normalizedType.includes("first") || normalizedType.includes("starter")) {
    return `

Please provide a comprehensive **FIRST-TIME BUYER ANALYSIS** including:

## Value Assessment
- Is this fairly priced for a first home?

## Affordability Analysis
- Monthly payment estimates at different down payments
- Compare to buyer's pre-approval

## First Home Suitability
- Move-in readiness
- Room for growth

## Neighborhood Analysis
- Schools, safety, amenities

## Recommendation
- Should they schedule a showing?
- Suggested offer strategy`;
  }

  if (normalizedType.includes("family")) {
    return `

Please provide a comprehensive **FAMILY HOME ANALYSIS** including:

## Space & Layout Assessment
- Bedroom/bathroom configuration
- Yard and outdoor space

## School District Analysis
- Local school ratings

## Safety & Neighborhood
- Family-friendly features

## Recommendation
- Is this a good family home?
- Showing priorities`;
  }

  // Default analysis
  return `

Please provide a comprehensive analysis including:

## Value Assessment
- Is this property fairly priced?
- Price per sqft vs area median

## Market Position
- Comparison to similar homes
- Days on market analysis

## Buyer Fit Analysis
✅ **Strengths:** List ways this matches buyer needs
⚠️ **Considerations:** List potential concerns

## Recommendation
- Should buyer view this property?
- Suggested offer range and strategy`;
}
