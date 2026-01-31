import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artifactContent, buyerName } = await req.json();

    if (!artifactContent) {
      return new Response(
        JSON.stringify({ error: "Artifact content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Warm, conversational prompt for buyer-friendly content
    const systemPrompt = `You are helping a first-time home buyer understand their budget strategy. Rewrite this agent-facing budget analysis as a warm, personal guide.

TONE & STYLE:
- Start with: "Hi ${buyerName || "there"}! Based on your pre-approval, here's your personalized budget guide:"
- Use "you" and "your" throughout
- Conversational but professional (like a helpful advisor)
- Encouraging and supportive tone
- Short paragraphs, easy to scan

STRUCTURE:
- Brief intro (2-3 sentences)
- Budget Bands section with clear headers
- Each band: price range + 2-3 sentences explaining why
- Financial tips section (bullet points, concise)
- Encouraging closing: "Ready to start looking? Let's find your perfect home!"

REMOVE:
- All agent-only content (action items, red flags, internal notes)
- Checkboxes [ ]
- Overly formal language
- Banking/financial jargon

KEEP:
- Budget band numbers and explanations
- Important financial considerations
- Practical tips

FORMAT OUTPUT:
- Use clear markdown headers (##, ###)
- Bold key terms (**like this**)
- Short bullet points
- Clean spacing between sections

Make it feel like a personalized email from a friendly advisor, not a bank document.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Transform this into a warm, personalized buyer guide:\n\n${artifactContent}` 
          },
        ],
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const buyerVersion = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ buyerVersion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating buyer artifact:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
