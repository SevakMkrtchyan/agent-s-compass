/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapedPropertyData {
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  description: string | null;
  photos: string[];
  sourceUrl: string;
  propertyType: string | null;
  listingAgent: { name: string | null; phone: string | null } | null;
  rawData: any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Firecrawl connector not configured. Please connect Firecrawl in Settings → Connectors." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping property URL:", formattedUrl);

    // Scrape the page with multiple formats
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "html", "links"],
        onlyMainContent: false, // We need meta tags from full page
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error || `Scraping failed with status ${response.status}` 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scrape successful, parsing property data...");

    // Extract property data from scraped content
    const scrapedData = data.data || data;
    const html = scrapedData.html || "";
    const markdown = scrapedData.markdown || "";
    const metadata = scrapedData.metadata || {};

    // Parse property information
    const propertyData = parsePropertyData(html, markdown, metadata, formattedUrl);

    console.log("Parsed property data:", {
      address: propertyData.address,
      price: propertyData.price,
      beds: propertyData.bedrooms,
      baths: propertyData.bathrooms,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: propertyData,
        source: detectSource(formattedUrl),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping property:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to scrape property";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectSource(url: string): string {
  if (url.includes("zillow.com")) return "zillow";
  if (url.includes("realtor.com")) return "realtor";
  if (url.includes("redfin.com")) return "redfin";
  if (url.includes("trulia.com")) return "trulia";
  if (url.includes("homes.com")) return "homes";
  if (url.includes("century21.com")) return "century21";
  if (url.includes("coldwellbanker.com")) return "coldwellbanker";
  if (url.includes("kw.com") || url.includes("kellerwilliams.com")) return "kellerwilliams";
  return "unknown";
}

function parsePropertyData(html: string, markdown: string, metadata: any, sourceUrl: string): ScrapedPropertyData {
  const result: ScrapedPropertyData = {
    address: null,
    city: null,
    state: null,
    zipCode: null,
    price: null,
    bedrooms: null,
    bathrooms: null,
    sqft: null,
    yearBuilt: null,
    description: null,
    photos: [],
    sourceUrl,
    propertyType: null,
    listingAgent: null,
    rawData: { metadata },
  };

  // Try to extract from Open Graph meta tags first (most reliable)
  result.address = extractMetaContent(html, 'og:title') || 
                   extractMetaContent(html, 'og:street-address') ||
                   metadata.title;
  
  result.description = extractMetaContent(html, 'og:description') || 
                       metadata.description;
  
  const ogImage = extractMetaContent(html, 'og:image');
  if (ogImage) {
    result.photos.push(ogImage);
  }

  // Try to extract price from various sources
  const priceStr = extractMetaContent(html, 'og:price:amount') ||
                   extractMetaContent(html, 'product:price:amount');
  if (priceStr) {
    result.price = parsePrice(priceStr);
  }

  // Parse structured data (JSON-LD)
  const structuredData = extractStructuredData(html);
  if (structuredData) {
    result.rawData.structuredData = structuredData;
    
    // Extract from structured data
    if (structuredData['@type'] === 'SingleFamilyResidence' || 
        structuredData['@type'] === 'RealEstateListing' ||
        structuredData['@type'] === 'Product') {
      
      if (structuredData.address) {
        const addr = structuredData.address;
        result.address = result.address || addr.streetAddress;
        result.city = addr.addressLocality;
        result.state = addr.addressRegion;
        result.zipCode = addr.postalCode;
      }
      
      if (structuredData.offers?.price) {
        result.price = result.price || parsePrice(structuredData.offers.price);
      }
      
      if (structuredData.numberOfRooms) {
        result.bedrooms = structuredData.numberOfRooms;
      }
      
      if (structuredData.numberOfBathroomsTotal) {
        result.bathrooms = structuredData.numberOfBathroomsTotal;
      }
      
      if (structuredData.floorSize?.value) {
        result.sqft = parseFloat(structuredData.floorSize.value);
      }
      
      if (structuredData.yearBuilt) {
        result.yearBuilt = parseInt(structuredData.yearBuilt);
      }
      
      if (structuredData.image) {
        const images = Array.isArray(structuredData.image) 
          ? structuredData.image 
          : [structuredData.image];
        result.photos = [...new Set([...result.photos, ...images])];
      }
    }
  }

  // Extract from markdown/text content if not found
  if (!result.price) {
    result.price = extractPriceFromText(markdown);
  }
  
  if (!result.bedrooms) {
    result.bedrooms = extractNumberFromText(markdown, /(\d+)\s*(bed|bd|bedroom)/i);
  }
  
  if (!result.bathrooms) {
    result.bathrooms = extractNumberFromText(markdown, /(\d+\.?\d*)\s*(bath|ba|bathroom)/i);
  }
  
  if (!result.sqft) {
    result.sqft = extractNumberFromText(markdown, /(\d+,?\d*)\s*(sq\.?\s*ft|sqft|square feet)/i);
  }
  
  if (!result.yearBuilt) {
    result.yearBuilt = extractNumberFromText(markdown, /built\s*(?:in\s*)?(\d{4})/i);
  }

  // Extract additional images from HTML
  const additionalImages = extractImages(html);
  result.photos = [...new Set([...result.photos, ...additionalImages])].slice(0, 20);

  // Parse address components if we have a full address string
  if (result.address && (!result.city || !result.state)) {
    const addressParts = parseAddressString(result.address);
    result.city = result.city || addressParts.city;
    result.state = result.state || addressParts.state;
    result.zipCode = result.zipCode || addressParts.zipCode;
    result.address = addressParts.street || result.address;
  }

  return result;
}

function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];
  
  // Try alternate order
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
}

function extractStructuredData(html: string): any | null {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Look for real estate related types
      if (data['@type'] && (
        data['@type'].includes('RealEstate') ||
        data['@type'] === 'SingleFamilyResidence' ||
        data['@type'] === 'Apartment' ||
        data['@type'] === 'House' ||
        data['@type'] === 'Product' ||
        data['@type'] === 'Place'
      )) {
        return data;
      }
      // Check if it's a graph with real estate items
      if (data['@graph']) {
        for (const item of data['@graph']) {
          if (item['@type'] && (
            item['@type'].includes('RealEstate') ||
            item['@type'] === 'SingleFamilyResidence' ||
            item['@type'] === 'Product'
          )) {
            return item;
          }
        }
      }
    } catch (e) {
      // Continue to next script tag
    }
  }
  return null;
}

function parsePrice(priceStr: string | number): number | null {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return null;
  const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

function extractPriceFromText(text: string): number | null {
  // Match common price patterns like $485,000 or $485000
  const match = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    return parsePrice(match[1]);
  }
  return null;
}

function extractNumberFromText(text: string, regex: RegExp): number | null {
  const match = text?.match(regex);
  if (match) {
    const num = parseFloat(match[1].replace(',', ''));
    return isNaN(num) ? null : num;
  }
  return null;
}

function extractImages(html: string): string[] {
  const images: string[] = [];
  
  // Look for property images (common patterns in real estate sites)
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Filter for likely property images (skip small icons, logos, etc.)
    if (src && 
        !src.includes('logo') && 
        !src.includes('icon') && 
        !src.includes('avatar') &&
        !src.includes('placeholder') &&
        (src.includes('photo') || 
         src.includes('image') || 
         src.includes('property') ||
         src.includes('listing') ||
         src.includes('home') ||
         src.includes('zillowstatic') ||
         src.includes('rdcpix') ||
         src.includes('redfin'))) {
      images.push(src);
    }
  }
  
  return images.slice(0, 20);
}

function parseAddressString(address: string): { street: string | null; city: string | null; state: string | null; zipCode: string | null } {
  const result = { street: null as string | null, city: null as string | null, state: null as string | null, zipCode: null as string | null };
  
  // Try to parse "123 Main St, Austin, TX 78701" format
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length >= 3) {
    result.street = parts[0];
    result.city = parts[1];
    
    // State and zip usually in last part
    const stateZip = parts[parts.length - 1];
    const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/i);
    if (stateZipMatch) {
      result.state = stateZipMatch[1].toUpperCase();
      result.zipCode = stateZipMatch[2] || null;
    }
  } else if (parts.length === 2) {
    result.street = parts[0];
    const stateZipMatch = parts[1].match(/([A-Za-z\s]+),?\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/i);
    if (stateZipMatch) {
      result.city = stateZipMatch[1].trim();
      result.state = stateZipMatch[2].toUpperCase();
      result.zipCode = stateZipMatch[3] || null;
    }
  }
  
  return result;
}
