import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DetectedField {
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "date" | "boolean";
  data_source: "buyer" | "property" | "agent" | "manual";
  is_required: boolean;
  source_field?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template_id, file_url, file_type } = await req.json();

    console.log("[analyze-offer-template] Starting analysis:", { template_id, file_type });

    if (!template_id || !file_url || !file_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: template_id, file_url, file_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.error("[analyze-offer-template] ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the file content
    console.log("[analyze-offer-template] Fetching file from:", file_url);
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    // Get file as base64 for Claude
    const fileBuffer = await fileResponse.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    console.log("[analyze-offer-template] File fetched, size:", fileBuffer.byteLength);

    // Determine media type for Claude
    const mediaType = file_type === "pdf" 
      ? "application/pdf" 
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Call Claude API with the document
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Content,
                },
              },
              {
                type: "text",
                text: `Analyze this real estate offer template document and identify all fillable fields or blanks that need to be completed when creating an offer. 

For each field you identify, provide:
- field_name: A snake_case identifier (e.g., buyer_full_name, purchase_price, closing_date)
- field_label: Human-readable label (e.g., "Buyer's Full Legal Name", "Purchase Price", "Closing Date")
- field_type: One of: text, number, date, or boolean
- data_source: Where this data typically comes from:
  - "buyer" - buyer information (name, email, phone, address, pre-approval info)
  - "property" - property details (address, price, bedrooms, etc.)
  - "agent" - agent information (name, license, brokerage)
  - "manual" - requires manual entry for each offer (offer amount, contingencies, dates)
- is_required: true if the field is essential for a valid offer, false if optional
- source_field: If data_source is buyer/property/agent, suggest which database field maps to it (e.g., "name", "email", "address", "price")

Focus on identifying:
1. Buyer information fields
2. Property address and details
3. Purchase price and financial terms
4. Dates (closing date, inspection period, etc.)
5. Contingencies and conditions
6. Agent/broker information
7. Signature lines

Return ONLY a valid JSON array of field objects, no additional text or explanation. Example format:
[
  {"field_name": "buyer_full_name", "field_label": "Buyer's Full Legal Name", "field_type": "text", "data_source": "buyer", "is_required": true, "source_field": "name"},
  {"field_name": "purchase_price", "field_label": "Purchase Price", "field_type": "number", "data_source": "manual", "is_required": true}
]`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[analyze-offer-template] Claude API error:", claudeResponse.status, errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    console.log("[analyze-offer-template] Claude response received");

    // Extract the text content from Claude's response
    const responseText = claudeData.content?.[0]?.text || "";
    
    // Parse the JSON from Claude's response
    let detectedFields: DetectedField[] = [];
    try {
      // Try to extract JSON from the response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        detectedFields = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("[analyze-offer-template] Failed to parse Claude response:", parseError);
      console.error("[analyze-offer-template] Raw response:", responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse AI response", 
          fields: [],
          raw_response: responseText 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-offer-template] Detected fields:", detectedFields.length);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear any existing fields for this template (in case of re-analysis)
    const { error: deleteError } = await supabase
      .from("offer_template_fields")
      .delete()
      .eq("template_id", template_id);

    if (deleteError) {
      console.warn("[analyze-offer-template] Error clearing existing fields:", deleteError);
    }

    // Insert detected fields into the database
    if (detectedFields.length > 0) {
      const fieldsToInsert = detectedFields.map((field) => ({
        template_id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type || "text",
        data_source: field.data_source || "manual",
        is_required: field.is_required ?? false,
        source_field: field.source_field || null,
      }));

      const { error: insertError } = await supabase
        .from("offer_template_fields")
        .insert(fieldsToInsert);

      if (insertError) {
        console.error("[analyze-offer-template] Error inserting fields:", insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      console.log("[analyze-offer-template] Saved", fieldsToInsert.length, "fields to database");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        fields_count: detectedFields.length,
        fields: detectedFields 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[analyze-offer-template] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
