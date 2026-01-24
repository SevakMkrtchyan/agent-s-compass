import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt with compliance awareness
const SYSTEM_PROMPT = `You are AgentGPT, a professional AI assistant for licensed real estate agents. You are speaking TO the agent (the logged-in user) ABOUT their buyer clients.

CRITICAL FRAMING:
- Always address the agent directly as "you" 
- Always refer to buyers by name in third person (e.g., "Sarah Johnson is currently in..." NOT "you are currently in...")
- Frame all advice as professional guidance TO the agent ABOUT their client
- Example: "Based on Sarah Johnson's current stage, you should..." NOT "Based on your current stage..."

ROLE:
- You help agents manage their buyer clients more effectively
- Proactively answer: 'What should the agent do next for this client?'
- Be stage-aware (Home Search → Offer Strategy → Under Contract → Closing → Post-Close)
- Block premature actions if prereqs missing (e.g., no offers without signed buyer representation agreement)

TONE: Calm, confident, concise, professional. Peer-to-peer communication between professionals.

CRITICAL RULES:
- Never use emojis
- Never use hedging words like "maybe", "perhaps", "you could consider"
- Always be decisive and direct
- Keep responses concise and action-oriented
- When generating client-facing content, use professional but warm language addressed to the buyer
- For internal explanations/thinking, speak directly to the agent about their client
- Format your response with markdown: use **bold** for emphasis, bullet points, and clear headers

COMPLIANCE CHECK:
Before suggesting any action, verify prerequisites are met. If a required document is missing (e.g., CA BR-11 for offers), clearly state the blocker and what must be completed first. Flag compliance risks subtly but clearly.`;

interface BuyerContext {
  name: string;
  email?: string;
  currentStage: number;
  financingConfirmed: boolean;
  buyerType?: string;
  marketContext?: string;
  recentActivity?: string[];
  buyerId?: string;
  // Extended profile fields
  preApprovalStatus?: string | null;
  preApprovalAmount?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredCities?: string[] | null;
  propertyTypes?: string[] | null;
  minBeds?: number | null;
  minBaths?: number | null;
  mustHaves?: string | null;
  niceToHaves?: string | null;
  agentNotes?: string | null;
}

interface RequestBody {
  command: string;
  intent: "artifact" | "thinking";
  buyerContext: BuyerContext;
  visibility?: "internal" | "buyer_approval_required";
}

interface RAGContext {
  buyerData: string[];
  marketFeeds: string[];
  complianceRules: { rule_code: string; title: string; description: string; blocked_actions: string[] }[];
}

async function fetchRAGContext(
  supabase: any,
  buyerId: string,
  command: string
): Promise<RAGContext> {
  const result: RAGContext = {
    buyerData: [],
    marketFeeds: [],
    complianceRules: [],
  };

  try {
    // Fetch buyer-specific data
    const { data: buyerData } = await supabase
      .from("buyer_data")
      .select("content, data_type, metadata")
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (buyerData) {
      result.buyerData = buyerData.map(
        (d: any) => `[${d.data_type}] ${d.content}`
      );
    }

    // Fetch market feeds
    const { data: marketFeeds } = await supabase
      .from("market_feeds")
      .select("feed_type, content, metadata")
      .order("fetched_at", { ascending: false })
      .limit(5);

    if (marketFeeds) {
      result.marketFeeds = marketFeeds.map(
        (m: any) => `[${m.feed_type}] ${m.content}`
      );
    }

    // Fetch compliance rules
    const { data: complianceRules } = await supabase
      .from("compliance_rules")
      .select("rule_code, title, description, blocked_actions");

    if (complianceRules) {
      result.complianceRules = complianceRules;
    }
  } catch (error) {
    console.error("RAG fetch error:", error);
  }

  return result;
}

function buildComplianceContext(
  rules: { rule_code: string; title: string; description: string; blocked_actions: string[] }[],
  command: string,
  stage: number
): string {
  const relevantRules = rules.filter((rule) => {
    const lowerCommand = command.toLowerCase();
    return rule.blocked_actions.some((action) =>
      lowerCommand.includes(action.replace("_", " "))
    );
  });

  if (relevantRules.length === 0) return "";

  return `
COMPLIANCE ALERTS:
${relevantRules.map((r) => `⚠️ ${r.rule_code}: ${r.description}`).join("\n")}
`;
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

    const { command, intent, buyerContext, visibility }: RequestBody = await req.json();

    // Fetch RAG context
    const ragContext = await fetchRAGContext(
      supabase,
      buyerContext.buyerId || buyerContext.name,
      command
    );

    // Build context string
    const stageNames = [
      "Readiness & Expectations",
      "Home Search",
      "Offer Strategy",
      "Under Contract",
      "Closing Preparation",
      "Closing & Post-Close",
    ];

    const complianceContext = buildComplianceContext(
      ragContext.complianceRules,
      command,
      buyerContext.currentStage
    );

    const ragDataContext =
      ragContext.buyerData.length > 0
        ? `\nBUYER HISTORY:\n${ragContext.buyerData.slice(0, 5).join("\n")}`
        : "";

    const marketContext =
      ragContext.marketFeeds.length > 0
        ? `\nMARKET DATA:\n${ragContext.marketFeeds.slice(0, 3).join("\n")}`
        : "";

    // Build financial context string
    const financialContext = [];
    if (buyerContext.preApprovalAmount) {
      financialContext.push(`Pre-Approval Amount: $${buyerContext.preApprovalAmount.toLocaleString()}`);
    }
    if (buyerContext.budgetMin || buyerContext.budgetMax) {
      const min = buyerContext.budgetMin ? `$${buyerContext.budgetMin.toLocaleString()}` : "N/A";
      const max = buyerContext.budgetMax ? `$${buyerContext.budgetMax.toLocaleString()}` : "N/A";
      financialContext.push(`Budget Range: ${min} - ${max}`);
    }

    // Build preferences context
    const preferencesContext = [];
    if (buyerContext.preferredCities?.length) {
      preferencesContext.push(`Preferred Cities: ${buyerContext.preferredCities.join(", ")}`);
    }
    if (buyerContext.propertyTypes?.length) {
      preferencesContext.push(`Property Types: ${buyerContext.propertyTypes.join(", ")}`);
    }
    if (buyerContext.minBeds) {
      preferencesContext.push(`Minimum Bedrooms: ${buyerContext.minBeds}`);
    }
    if (buyerContext.minBaths) {
      preferencesContext.push(`Minimum Bathrooms: ${buyerContext.minBaths}`);
    }
    if (buyerContext.mustHaves) {
      preferencesContext.push(`Must-Haves: ${buyerContext.mustHaves}`);
    }
    if (buyerContext.niceToHaves) {
      preferencesContext.push(`Nice-to-Haves: ${buyerContext.niceToHaves}`);
    }

    const contextString = `
BUYER CONTEXT:
- Name: ${buyerContext.name}
- Current Stage: Stage ${buyerContext.currentStage} - ${stageNames[buyerContext.currentStage] || "Unknown"}
- Pre-Approval Status: ${buyerContext.preApprovalStatus || "Not Started"}
- Financing: ${buyerContext.financingConfirmed ? "Confirmed" : "Not Confirmed"}
- Buyer Type: ${buyerContext.buyerType || "Not specified"}
- Market Context: ${buyerContext.marketContext || "General market"}
${financialContext.length ? `\nFINANCIAL INFO:\n- ${financialContext.join("\n- ")}` : ""}
${preferencesContext.length ? `\nBUYER PREFERENCES:\n- ${preferencesContext.join("\n- ")}` : ""}
${buyerContext.agentNotes ? `\nAGENT NOTES:\n${buyerContext.agentNotes}` : ""}
${buyerContext.recentActivity?.length ? `\n- Recent Activity: ${buyerContext.recentActivity.join(", ")}` : ""}
${ragDataContext}
${marketContext}
${complianceContext}
`;

    let userPrompt = "";
    const firstName = buyerContext.name.split(" ")[0];

    if (intent === "artifact") {
      // Determine if this is an internal or buyer-facing artifact
      const isInternal = visibility === "internal";
      
      if (isInternal) {
        // Internal artifacts: Agent-only tools, concise, tactical, no buyer greeting
        userPrompt = `${contextString}

AGENT COMMAND: ${command}

Generate an INTERNAL artifact for the agent's use only. This will NOT be shared with the buyer.

CRITICAL FORMAT RULES:
- This is a TOOL for the agent, not a letter to the buyer
- NO greeting like "Hi ${firstName}" or "Dear ${buyerContext.name}"
- NO sign-off like "Best regards" or "[Agent Name]"
- Be concise, tactical, and actionable
- Use clear headers with ## for sections
- Use bullet points and checklists where appropriate
- Format as a template, rubric, checklist, or analysis tool
- Focus on what the agent needs to execute effectively
- Keep it under 300 words

Examples of internal artifact formats:
- Scoring rubric with criteria and point values
- Checklist with actionable items
- Comparison template with evaluation columns
- Strategy brief with decision points
- Analysis with key metrics and recommendations`;
      } else {
        // Buyer-facing artifacts: Professional letter format
        userPrompt = `${contextString}

AGENT COMMAND: ${command}

Generate a client-facing artifact that the agent will send to ${buyerContext.name}. This will be shown to the buyer after agent approval.

Rules:
- Write directly to ${firstName} using their first name
- Professional but warm tone
- Clear structure with headers (use ## for headers)
- Actionable information with bullet points
- No legal advice
- No commitments the agent hasn't approved
- Keep it concise (under 250 words)
- End with a professional sign-off`;
      }
    } else if (intent === "thinking") {
      userPrompt = `${contextString}

AGENT QUESTION: ${command}

Provide internal analysis for the agent about ${buyerContext.name}. This will NOT be shared with the buyer.

Remember: You are speaking TO the agent ABOUT their client ${buyerContext.name}. Use "you" to refer to the agent and "${buyerContext.name}" or "your client" when discussing the buyer.

Include:
- Direct answer to the question about ${buyerContext.name}
- Risk assessment if applicable
- Strategic considerations for this client
- Regulatory or compliance notes if relevant
- Recommended approach for working with ${buyerContext.name}

Use **bold** for key points and bullet lists for clarity. Be analytical, direct, and thorough. This is professional peer-to-peer communication.`;
    }

    // Stream from Claude 3.5 Sonnet
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
    console.error("AgentGPT stream error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "AgentGPT unavailable — try again or contact support",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
