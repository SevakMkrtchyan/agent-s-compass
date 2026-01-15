import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  property: any;
  buyerProfile: {
    id: string;
    name: string;
    type: string;
    budget?: number;
    preApproval?: number;
    mustHaves?: string[];
    niceToHaves?: string[];
    preferredCities?: string[];
    agentNotes?: string;
  };
  comparables?: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { property, buyerProfile, comparables }: AnalysisRequest = await req.json();

    const systemPrompt = `You are an expert real estate market analyst providing comprehensive property analysis for real estate agents and their clients. Your analysis should be:
- Data-driven and factual
- Tailored to the specific buyer profile
- Professional but accessible
- Actionable with clear recommendations

Format your response with clear sections using markdown headers (##). Use bullet points for key insights. Include specific numbers and percentages when relevant.`;

    const userPrompt = buildAnalysisPrompt(property, buyerProfile, comparables);

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
          { role: "user", content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in property-analysis:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildAnalysisPrompt(property: any, buyerProfile: any, comparables?: any[]): string {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(property.price);

  let prompt = `Analyze this property for ${buyerProfile.name}, a ${buyerProfile.type} buyer.

## Property Details
- **Address:** ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- **Price:** ${formattedPrice}
- **Size:** ${property.bedrooms} beds, ${property.bathrooms} baths, ${property.sqft?.toLocaleString()} sqft
- **Price/sqft:** $${property.pricePerSqft || Math.round(property.price / property.sqft)}
- **Days on Market:** ${property.daysOnMarket}
- **Year Built:** ${property.yearBuilt}
- **Property Type:** ${property.propertyType || "Single Family"}
- **Status:** ${property.status}
${property.description ? `- **Description:** ${property.description}` : ""}
${property.features?.length ? `- **Features:** ${property.features.join(", ")}` : ""}

## Buyer Profile
- **Type:** ${buyerProfile.type}
${buyerProfile.budget ? `- **Budget:** $${buyerProfile.budget.toLocaleString()}` : ""}
${buyerProfile.preApproval ? `- **Pre-Approval:** $${buyerProfile.preApproval.toLocaleString()}` : ""}
${buyerProfile.mustHaves?.length ? `- **Must-Haves:** ${buyerProfile.mustHaves.join(", ")}` : ""}
${buyerProfile.niceToHaves?.length ? `- **Nice-to-Haves:** ${buyerProfile.niceToHaves.join(", ")}` : ""}
${buyerProfile.preferredCities?.length ? `- **Preferred Areas:** ${buyerProfile.preferredCities.join(", ")}` : ""}
${buyerProfile.agentNotes ? `- **Agent Notes:** ${buyerProfile.agentNotes}` : ""}
`;

  if (comparables?.length) {
    prompt += `\n## Comparable Properties\n`;
    comparables.forEach((comp, i) => {
      const compPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(comp.price);
      prompt += `${i + 1}. ${comp.address}: ${compPrice}, ${comp.bedrooms}bd/${comp.bathrooms}ba, ${comp.sqft?.toLocaleString()}sqft, $${comp.pricePerSqft}/sqft, ${comp.daysOnMarket} DOM\n`;
    });
  }

  // Customize analysis sections based on buyer type
  if (buyerProfile.type === "investor" || buyerProfile.type === "Investor") {
    prompt += `
Please provide a comprehensive investment analysis including:

## Value Assessment
- Is this property fairly priced compared to market?
- Price per sqft analysis vs area median

## Investment Metrics
- Estimated ARV (After Repair Value) if applicable
- Estimated repair/update costs based on property age and features
- Cap rate estimate (assume market rental rates)
- Cash flow projection (monthly income vs expenses)
- ROI calculation

## Rental Analysis
- Estimated monthly rent based on comparable rentals
- Expected vacancy rate for this area
- Property management considerations

## Market Position
- Local market trends (appreciation, rental demand)
- Days on market analysis
- Competition analysis

## Risk Assessment
- Potential red flags
- Market saturation concerns
- Exit strategy recommendations (flip vs hold)

## Recommendation
Clear recommendation with action items`;
  } else if (buyerProfile.type === "first-time" || buyerProfile.type === "First-Time Buyer") {
    prompt += `
Please provide a first-time buyer focused analysis including:

## Affordability Analysis
- Is this within budget?
- Estimated monthly payment breakdown
- Down payment requirements

## Value Assessment
- Is this fairly priced for the area?
- Price per sqft comparison

## Starter Home Evaluation
- Is this a good first home?
- Resale potential in 5-7 years
- Room to grow or starter limitations

## Condition Assessment
- Move-in ready vs needs work
- Potential update costs
- Age-related concerns

## Neighborhood Fit
- School ratings if applicable
- Commute considerations
- Safety and amenities

## Comparable Properties
- How does this compare to other options in budget?

## Recommendation
Clear yes/no recommendation with reasoning`;
  } else {
    prompt += `
Please provide a comprehensive analysis including:

## Value Assessment
- Is this property fairly priced?
- Price per sqft vs area median
- Days on market analysis

## Market Position
- How does it compare to similar homes?
- Recent price trends in this area

## Property Highlights
- Standout features
- Potential concerns or red flags

## Comparable Analysis
Create a comparison table with key metrics

## Neighborhood Insights
- Area amenities and character
- Schools (if applicable)
- Future development considerations

## Negotiation Strategy
- Suggested offer range
- Leverage points

## Recommendation
Clear recommendation: Should the buyer view/pursue this property?`;
  }

  return prompt;
}
