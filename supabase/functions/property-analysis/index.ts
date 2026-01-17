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
    type: 'first-time' | 'move-up' | 'investor' | 'downsizing' | 'family';
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
- Tailored to the specific buyer profile type
- Professional but accessible
- Actionable with clear recommendations

Format your response with clear sections using markdown headers (##). Use bullet points for key insights. Include specific numbers and percentages when relevant.

CRITICAL: Adapt your analysis sections based on the buyer type provided. Different buyer types need different focus areas and metrics.`;

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

  const pricePerSqft = property.pricePerSqft || Math.round(property.price / property.sqft);

  let prompt = `Analyze this property for ${buyerProfile.name}, a **${buyerProfile.type}** buyer.

## Property Details
- **Address:** ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- **Price:** ${formattedPrice}
- **Size:** ${property.bedrooms} beds, ${property.bathrooms} baths, ${property.sqft?.toLocaleString()} sqft
- **Price/sqft:** $${pricePerSqft}
- **Days on Market:** ${property.daysOnMarket || 'N/A'}
- **Year Built:** ${property.yearBuilt || 'N/A'}
- **Property Type:** ${property.propertyType || "Single Family"}
- **Status:** ${property.status}
${property.lotSize ? `- **Lot Size:** ${property.lotSize}` : ""}
${property.description ? `- **Description:** ${property.description}` : ""}
${property.features?.length ? `- **Features:** ${property.features.join(", ")}` : ""}

## Buyer Profile
- **Buyer Type:** ${buyerProfile.type}
- **Name:** ${buyerProfile.name}
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
      const compPricePerSqft = comp.pricePerSqft || Math.round(comp.price / comp.sqft);
      prompt += `${i + 1}. ${comp.address}: ${compPrice}, ${comp.bedrooms}bd/${comp.bathrooms}ba, ${comp.sqft?.toLocaleString()}sqft, $${compPricePerSqft}/sqft, ${comp.daysOnMarket || 'N/A'} DOM, ${comp.status}\n`;
    });
  }

  // Add buyer-type-specific analysis instructions
  prompt += getAnalysisSectionsForBuyerType(buyerProfile.type, property, buyerProfile);

  return prompt;
}

function getAnalysisSectionsForBuyerType(buyerType: string, property: any, buyerProfile: any): string {
  const normalizedType = buyerType.toLowerCase().replace(/[_-]/g, ' ');
  
  // INVESTOR buyer type
  if (normalizedType.includes('investor') || normalizedType.includes('investment')) {
    return `

Please provide a comprehensive **INVESTMENT ANALYSIS** including:

## Value Assessment
- Is this property fairly priced compared to market?
- Price per sqft analysis vs area median
- Determine if property is priced below, at, or above market value

## Investment Analysis
Provide detailed investment metrics:

### ARV (After Repair Value)
- Estimate the ARV based on comparable renovated properties
- Estimated repair/update costs based on property age (built ${property.yearBuilt || 'unknown'}) and current condition
- Calculate all-in cost (purchase + repairs)
- Potential profit margin and ROI percentage

### Cash Flow Projection (Buy & Hold Scenario)
Calculate and present:
- **Estimated monthly rent:** Based on comparable rentals in the area
- **Mortgage payment:** Assume 20% down, current market rate (~7%)
- **Property tax:** Estimate monthly based on area averages
- **Insurance:** Monthly estimate
- **Maintenance reserve:** 1% of property value annually
- **Net monthly cash flow:** Total income minus all expenses
- **Cash-on-cash return:** Annual cash flow / total cash invested

### Cap Rate Analysis
- Calculate estimated cap rate (NOI / Purchase Price)
- Compare to area average cap rates
- Assess if this meets investor's target returns

### Exit Strategy Analysis
- **Fix-and-Flip viability:** Profit potential, timeline, risk assessment
- **Buy-and-Hold viability:** Long-term appreciation potential, rental demand
- **BRRRR potential:** Can this be refinanced to pull out capital?

## Market Position
- Local rental market trends
- Appreciation trends in this neighborhood
- Days on market analysis - is this a deal that needs quick action?

## Risk Assessment
- Potential red flags (age, condition, location factors)
- Market saturation concerns
- Vacancy rate estimates for the area

## Recommendation
Clear investment recommendation:
- Is this a BUY, HOLD, or PASS?
- Best strategy for this property (flip vs hold vs pass)
- Specific action items if pursuing
- Conditions under which this deal makes sense`;
  }

  // FIRST-TIME BUYER type
  if (normalizedType.includes('first') || normalizedType.includes('first-time') || normalizedType.includes('starter')) {
    return `

Please provide a comprehensive **FIRST-TIME HOME BUYER ANALYSIS** including:

## Value Assessment
- Is this property fairly priced for the area?
- Price per sqft comparison with similar homes
- Is this a good value for a first home purchase?

## Affordability Analysis
Calculate and present:
- **Monthly mortgage payment:** Estimate at current rates with 3-20% down options
- **Down payment scenarios:** Show 3%, 5%, 10%, 20% down payment amounts
- **Estimated closing costs:** 2-5% of purchase price
- **Monthly total housing cost:** PITI (Principal, Interest, Taxes, Insurance)
- **DTI assessment:** Does this fit within recommended 28-36% DTI ratios?
- Compare to buyer's pre-approval of $${buyerProfile.preApproval?.toLocaleString() || 'N/A'}

## First Home Suitability
- **Move-in readiness:** Can they move in immediately or are repairs needed?
- **Starter home potential:** Is this sized appropriately for a first home?
- **Room to grow:** Can this home accommodate life changes (family, remote work)?
- **Maintenance requirements:** What should a first-time owner expect?

## Neighborhood & Lifestyle Fit
- **School district ratings:** Important even if no kids yet (resale value)
- **Commute considerations:** Access to major employers/highways
- **Walkability & amenities:** Parks, shopping, restaurants nearby
- **Safety statistics:** Crime rates compared to city average
- **Community vibe:** Young professionals, families, retirees?

## Resale & Investment Value
- **5-7 year appreciation outlook:** Will they build equity?
- **Neighborhood trajectory:** Up-and-coming or established?
- **Comparable sales trends:** Are prices rising or flat?
- **Rental backup plan:** Could they rent it if needed?

## Buyer Fit Analysis
✅ **Strengths for This Buyer:**
- List 3-5 ways this property matches their needs and budget

⚠️ **Considerations:**
- List 3-5 things to be aware of or potential concerns

## Recommendation
Clear recommendation:
- Should they schedule a showing?
- Is this worth pursuing?
- Suggested offer strategy if interested
- What to look for during the showing`;
  }

  // FAMILY buyer type  
  if (normalizedType.includes('family') || normalizedType.includes('families')) {
    return `

Please provide a comprehensive **FAMILY HOME ANALYSIS** including:

## Value Assessment
- Is this fairly priced for a family home in this area?
- Price per sqft vs similar family homes
- Value compared to other family-suitable properties

## Family Suitability Assessment

### Space & Layout
- **Bedroom configuration:** Enough rooms for the family?
- **Bathroom ratio:** Adequate for family use?
- **Living space flow:** Open concept? Formal dining? Family room?
- **Storage:** Closets, garage, basement/attic?
- **Room for growth:** Can it accommodate family changes?

### Outdoor Space
- **Yard size:** Suitable for kids to play?
- **Fencing:** Existing or needed for safety?
- **Outdoor features:** Deck, patio, playground potential?
- **Lot characteristics:** Flat, hilly, wooded?

## School District Analysis
- **Elementary school:** Name, rating, distance
- **Middle school:** Name, rating, distance
- **High school:** Name, rating, distance
- **School district reputation:** Overall assessment
- **Private school options:** If applicable

## Family-Friendly Neighborhood
- **Parks & recreation:** Nearby playgrounds, sports facilities
- **Safety:** Crime statistics, traffic patterns
- **Other families:** Demographics of the neighborhood
- **Activities:** Youth sports, community programs
- **Healthcare:** Pediatricians, hospitals nearby

## Practical Considerations
- **Property age & maintenance:** Built ${property.yearBuilt || 'unknown'} - what to expect?
- **Safety features:** Stairs, pool, busy street concerns?
- **Utility costs:** Estimate for a family of 4-5
- **HOA restrictions:** Impact on family activities?

## Buyer Fit Analysis
✅ **Strengths for This Family:**
- List ways this home meets family needs

⚠️ **Considerations:**
- List potential concerns for family living

## Recommendation
Clear family-focused recommendation:
- Is this a good family home?
- Suggested showing priorities (what to check)
- Offer considerations`;
  }

  // DOWNSIZING buyer type
  if (normalizedType.includes('downsize') || normalizedType.includes('downsizing') || normalizedType.includes('empty nest') || normalizedType.includes('senior') || normalizedType.includes('retiree')) {
    return `

Please provide a comprehensive **DOWNSIZING ANALYSIS** including:

## Value Assessment
- Is this fairly priced for a downsizing buyer?
- Price per sqft analysis
- Value compared to their likely current (larger) home

## Downsizing Suitability

### Right-Sizing Assessment
- **Square footage comparison:** Is this a meaningful downsize?
- **Room count:** Enough for needs but not excessive?
- **Guest accommodations:** Room for visiting family?
- **Storage transition:** Where will belongings go?

### Low-Maintenance Living
- **Yard size:** Minimal lawn care needed?
- **Exterior maintenance:** Siding, roof age and condition?
- **HOA services:** What's covered (landscaping, snow, etc.)?
- **Systems age:** HVAC, water heater, appliances - replacement timeline?

### Accessibility & Aging-in-Place
- **Single-story or elevator:** Stair requirements?
- **Main floor living:** Bedroom and full bath on main level?
- **Doorway widths:** Wheelchair/walker accessible?
- **Bathroom features:** Walk-in shower, grab bar potential?
- **Garage access:** Step-free entry option?
- **Future modification potential:** Can it be adapted if needed?

## Lifestyle Considerations
- **Community amenities:** Clubhouse, pool, fitness center?
- **Social opportunities:** Active adult community? Neighbors?
- **Healthcare proximity:** Doctors, hospitals, pharmacies
- **Shopping & services:** Grocery, pharmacy within easy distance
- **Transportation:** Public transit, ride services, walkability

## Financial Assessment
- **Monthly costs comparison:** Lower than current home?
- **HOA fees:** What's included?
- **Property taxes:** Compare to current
- **Equity release:** How much capital freed up?
- **Maintenance budget:** Estimated annual costs

## Buyer Fit Analysis
✅ **Strengths for Downsizing:**
- List ways this property supports simpler living

⚠️ **Considerations:**
- Potential concerns or trade-offs

## Recommendation
Clear downsizing recommendation:
- Is this the right next chapter home?
- Showing priorities for accessibility
- Financial transition considerations`;
  }

  // MOVE-UP buyer type
  if (normalizedType.includes('move-up') || normalizedType.includes('move up') || normalizedType.includes('upgrade')) {
    return `

Please provide a comprehensive **MOVE-UP BUYER ANALYSIS** including:

## Value Assessment
- Is this property fairly priced?
- Price per sqft vs comparable upgraded homes
- Premium features that justify the price

## Upgrade Value Assessment

### Space & Features Upgrade
- **Size increase:** How much more space vs typical starter home?
- **Premium features:** What sets this apart from entry-level?
- **Quality of finishes:** Countertops, flooring, fixtures
- **Layout improvements:** Better flow, more functional spaces

### Quality of Life Improvements
- **Neighborhood upgrade:** Better schools, lower crime, more amenities?
- **Lot improvement:** More land, privacy, views?
- **Outdoor living:** Deck, patio, pool, landscaping?

## Financial Analysis
- **Monthly payment increase:** From typical starter to this home
- **Equity requirements:** Down payment from current home sale
- **Carrying costs:** Risk of owning two homes temporarily
- **Long-term value:** Will this appreciate better than staying put?

## Timing Considerations
- **Market conditions:** Good time to buy up?
- **Current home sale:** Contingency planning
- **Move logistics:** Timeline feasibility

## Buyer Fit Analysis
✅ **Strengths as Move-Up Property:**
- List upgrade advantages

⚠️ **Considerations:**
- Financial stretch factors
- Market timing concerns

## Recommendation
Clear move-up recommendation:
- Is this the right step up?
- Offer and timing strategy
- Contingency considerations`;
  }

  // DEFAULT / GENERAL buyer type
  return `

Please provide a comprehensive analysis including:

## Value Assessment
- Is this property fairly priced?
- Price per sqft vs area median
- Days on market analysis

## Market Position
- How does it compare to similar homes?
- Recent price trends in this area
- Competition analysis

## Property Highlights
- Standout features that add value
- Potential concerns or red flags
- Condition assessment based on age (built ${property.yearBuilt || 'unknown'})

## Comparable Analysis
Create a comparison summary showing how this property stacks up

## Neighborhood Insights
- Area amenities and character
- Schools (if applicable)
- Future development considerations
- Safety and walkability

## Buyer Fit Analysis
✅ **Strengths for This Buyer:**
- List 3-5 positive matches

⚠️ **Considerations:**
- List 3-5 things to consider

## Negotiation Strategy
- Suggested offer range
- Leverage points based on DOM and market conditions
- Terms to consider

## Recommendation
Clear recommendation: Should the buyer pursue this property?
- Next steps if yes
- What to look for in showing
- Offer strategy suggestions`;
}
