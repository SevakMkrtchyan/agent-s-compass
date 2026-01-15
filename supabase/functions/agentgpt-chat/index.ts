import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt - hardcoded as specified
const SYSTEM_PROMPT = `You are AgentGPT, a decision engine for licensed real estate agents — NOT a chatbot. Your job is to proactively answer: 'What should the agent do next?' Always propose clear next actions first. Be stage-aware (Home Search → Offer Strategy → Under Contract → Closing → Post-Close). Block premature actions if prereqs missing (e.g., no offers without signed buyer representation agreement per CA law). Tone: calm, confident, concise, professional. Never speak directly to buyers. Defer legal decisions to the agent. Use ONLY provided context.

CRITICAL RULES:
- Never use emojis
- Never use hedging words like "maybe", "perhaps", "you could", "consider"
- Always be decisive and direct
- Keep responses concise and action-oriented
- When generating client-facing content, use professional but warm language
- For internal explanations, be analytical and risk-focused`;

interface BuyerContext {
  name: string;
  email?: string;
  currentStage: number;
  financingConfirmed: boolean;
  buyerType?: string;
  marketContext?: string;
  recentActivity?: string[];
}

interface RequestBody {
  command: string;
  intent: "actions" | "artifact" | "thinking";
  buyerContext: BuyerContext;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { command, intent, buyerContext }: RequestBody = await req.json();

    // Build context string
    const stageNames = [
      "Readiness & Expectations",
      "Home Search", 
      "Offer Strategy",
      "Under Contract",
      "Closing Preparation",
      "Closing & Post-Close"
    ];

    const contextString = `
BUYER CONTEXT:
- Name: ${buyerContext.name}
- Current Stage: Stage ${buyerContext.currentStage} - ${stageNames[buyerContext.currentStage] || "Unknown"}
- Financing: ${buyerContext.financingConfirmed ? "Confirmed" : "Not Confirmed"}
- Buyer Type: ${buyerContext.buyerType || "Not specified"}
- Market Context: ${buyerContext.marketContext || "General market"}
${buyerContext.recentActivity?.length ? `- Recent Activity: ${buyerContext.recentActivity.join(", ")}` : ""}
`;

    let userPrompt = "";

    if (intent === "actions") {
      userPrompt = `${contextString}

Based on this buyer's current stage and context, generate exactly 3 recommended next actions for the agent. 

Respond ONLY with a JSON array in this exact format:
[
  {"id": "1", "label": "Short action label (max 6 words)", "command": "Full command to execute", "type": "artifact"},
  {"id": "2", "label": "Short action label", "command": "Full command", "type": "artifact"},
  {"id": "3", "label": "Short action label", "command": "Full command", "type": "thinking"}
]

Rules:
- Labels must be outcome-focused and concise
- At least 2 should be "artifact" type (client-facing content)
- One can be "thinking" type (internal analysis)
- Actions must be stage-appropriate
- Block any actions that require missing prerequisites`;
    } else if (intent === "artifact") {
      userPrompt = `${contextString}

AGENT COMMAND: ${command}

Generate a client-facing artifact based on this command. This will be shown to the buyer after agent approval.

Rules:
- Write directly to the buyer using their first name
- Professional but warm tone
- Clear structure with headers
- Actionable information
- No legal advice
- No commitments the agent hasn't approved
- Keep it concise (under 200 words)`;
    } else if (intent === "thinking") {
      userPrompt = `${contextString}

AGENT QUESTION: ${command}

Provide internal analysis for the agent only. This will NOT be shared with the buyer.

Include:
- Direct answer to the question
- Risk assessment if applicable
- Strategic considerations
- Regulatory or compliance notes if relevant
- Recommended approach

Be analytical, direct, and thorough. This is agent-to-agent communication.`;
    }

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
        messages: [
          { role: "user", content: SYSTEM_PROMPT + "\n\n" + userPrompt }
        ],
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

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse response based on intent
    let result: any;
    
    if (intent === "actions") {
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          result = { actions: JSON.parse(jsonMatch[0]) };
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (e) {
        console.error("Failed to parse actions:", e);
        // Return fallback actions
        result = {
          actions: [
            { id: "1", label: "Draft client update", command: "Draft update for buyer", type: "artifact" },
            { id: "2", label: "Generate market analysis", command: "Generate market analysis", type: "artifact" },
            { id: "3", label: "Review transaction status", command: "What should I prioritize next?", type: "thinking" },
          ]
        };
      }
    } else {
      result = { content };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AgentGPT error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "AgentGPT unavailable — try again or contact support" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
