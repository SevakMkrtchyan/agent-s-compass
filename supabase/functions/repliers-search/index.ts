import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyType?: string | string[];
  status?: string;
  pageSize?: number;
  pageNum?: number;
}

// Map frontend status values to Repliers API codes
function mapStatusToRepliers(status: string): string | undefined {
  switch (status?.toLowerCase()) {
    case "active":
      return "A";
    case "pending":
    case "sold":
    case "withdrawn":
      return "U";
    case "all":
      return undefined; // Don't filter by status
    default:
      return "A";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLIERS_API_KEY = Deno.env.get("REPLIERS_API_KEY");
    if (!REPLIERS_API_KEY) {
      throw new Error("REPLIERS_API_KEY is not configured");
    }

    const { searchParams }: { searchParams: SearchParams } = await req.json();
    
    // Build query parameters for Repliers API
    const queryParams = new URLSearchParams();
    
    // Use 'search' parameter for address/location queries instead of 'city'
    if (searchParams.location) {
      // Try to detect if it's a full address, city name, or ZIP
      const location = searchParams.location.trim();
      
      // Check if it looks like a ZIP code
      if (/^\d{5}(-\d{4})?$/.test(location)) {
        queryParams.append("zip", location);
      } 
      // Check if it contains numbers (likely an address)
      else if (/\d/.test(location)) {
        queryParams.append("search", location);
        queryParams.append("searchFields", "address,city,zip");
      }
      // Otherwise treat as city/area name
      else {
        queryParams.append("city", location);
      }
    }
    
    if (searchParams.minPrice) {
      queryParams.append("minPrice", searchParams.minPrice.toString());
    }
    if (searchParams.maxPrice) {
      queryParams.append("maxPrice", searchParams.maxPrice.toString());
    }
    if (searchParams.minBeds) {
      queryParams.append("minBeds", searchParams.minBeds.toString());
    }
    if (searchParams.minBaths) {
      queryParams.append("minBaths", searchParams.minBaths.toString());
    }
    if (searchParams.propertyType) {
      const types = Array.isArray(searchParams.propertyType) 
        ? searchParams.propertyType.join(",") 
        : searchParams.propertyType;
      queryParams.append("propertyType", types);
    }
    
    // Map status to Repliers API codes
    const mappedStatus = mapStatusToRepliers(searchParams.status || "active");
    if (mappedStatus) {
      queryParams.append("status", mappedStatus);
    }
    
    queryParams.append("pageSize", (searchParams.pageSize || 20).toString());
    queryParams.append("pageNum", (searchParams.pageNum || 1).toString());

    console.log("Searching Repliers API with params:", queryParams.toString());

    const response = await fetch(
      `https://api.repliers.io/listings?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "REPLIERS-API-KEY": REPLIERS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Repliers API error:", response.status, errorText);
      
      // Return mock data for development/demo purposes
      return new Response(
        JSON.stringify({
          success: true,
          data: getMockProperties(searchParams),
          isMock: true,
          message: "Using mock data (API unavailable or rate limited)"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    
    // Transform Repliers response to our format
    const properties = transformRepliersData(data);

    return new Response(
      JSON.stringify({ success: true, data: properties }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in repliers-search:", error);
    
    // Return mock data on error for development
    return new Response(
      JSON.stringify({
        success: true,
        data: getMockProperties({}),
        isMock: true,
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function transformRepliersData(data: any): any[] {
  if (!data?.listings) return [];
  
  return data.listings.map((listing: any) => ({
    id: listing.mlsNumber || listing.id,
    mlsId: listing.mlsNumber,
    address: listing.address?.streetAddress || listing.address,
    city: listing.address?.city || "",
    state: listing.address?.state || "",
    zipCode: listing.address?.postalCode || "",
    price: listing.listPrice || listing.price,
    bedrooms: listing.beds || listing.bedrooms,
    bathrooms: listing.baths || listing.bathrooms,
    sqft: listing.sqft || listing.livingArea,
    yearBuilt: listing.yearBuilt,
    pricePerSqft: listing.sqft ? Math.round(listing.listPrice / listing.sqft) : null,
    daysOnMarket: listing.daysOnMarket || listing.dom,
    propertyType: listing.propertyType,
    status: mapRepliersStatusToFrontend(listing.status),
    description: listing.description || listing.publicRemarks,
    features: listing.features || [],
    photos: listing.photos || listing.images || [],
    listingUrl: listing.url,
    mlsNumber: listing.mlsNumber,
    listingAgent: listing.agent,
    lotSize: listing.lotSize,
    rawData: listing
  }));
}

// Map Repliers status codes back to frontend values
function mapRepliersStatusToFrontend(status: string): string {
  switch (status?.toUpperCase()) {
    case "A":
      return "active";
    case "U":
      return "pending";
    case "S":
      return "sold";
    default:
      return status?.toLowerCase() || "active";
  }
}

function getMockProperties(params: SearchParams): any[] {
  const mockData = [
    {
      id: "mls-001",
      mlsId: "MLS12345678",
      address: "2847 Sunset Boulevard",
      city: "Austin",
      state: "TX",
      zipCode: "78703",
      price: 549000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1950,
      yearBuilt: 2019,
      pricePerSqft: 282,
      daysOnMarket: 8,
      propertyType: "single_family",
      status: "active",
      description: "Beautiful modern home with open floor plan, updated kitchen with quartz countertops, and spacious backyard. Located in a quiet neighborhood with excellent schools nearby.",
      features: ["Open Floor Plan", "Quartz Countertops", "Smart Home", "2-Car Garage", "Hardwood Floors"],
      photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
      listingUrl: "https://example.com/listing/1",
      mlsNumber: "MLS12345678",
      lotSize: "0.25 acres"
    },
    {
      id: "mls-002",
      mlsId: "MLS23456789",
      address: "1523 Oak Hill Lane",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      price: 675000,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      yearBuilt: 2021,
      pricePerSqft: 281,
      daysOnMarket: 3,
      propertyType: "single_family",
      status: "active",
      description: "Stunning family home in sought-after neighborhood. Features chef's kitchen, home office, and resort-style backyard with pool.",
      features: ["Pool", "Home Office", "Chef's Kitchen", "Walk-in Closets", "Crown Molding"],
      photos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
      listingUrl: "https://example.com/listing/2",
      mlsNumber: "MLS23456789",
      lotSize: "0.35 acres"
    },
    {
      id: "mls-003",
      mlsId: "MLS34567890",
      address: "891 Meadow Creek Drive",
      city: "Round Rock",
      state: "TX",
      zipCode: "78665",
      price: 425000,
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1800,
      yearBuilt: 2017,
      pricePerSqft: 236,
      daysOnMarket: 15,
      propertyType: "single_family",
      status: "pending",
      description: "Well-maintained home in growing community. Open concept living, updated appliances, and covered patio perfect for entertaining.",
      features: ["Covered Patio", "Updated Appliances", "Open Concept", "Energy Efficient"],
      photos: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"],
      listingUrl: "https://example.com/listing/3",
      mlsNumber: "MLS34567890",
      lotSize: "0.20 acres"
    },
    {
      id: "mls-004",
      mlsId: "MLS45678901",
      address: "456 Riverside Terrace",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      price: 899000,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      yearBuilt: 2022,
      pricePerSqft: 281,
      daysOnMarket: 1,
      propertyType: "single_family",
      status: "active",
      description: "Luxury new construction with premium finishes throughout. Gourmet kitchen, primary suite with spa bath, and three-car garage.",
      features: ["New Construction", "Gourmet Kitchen", "Spa Bath", "3-Car Garage", "Smart Home"],
      photos: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80"],
      listingUrl: "https://example.com/listing/4",
      mlsNumber: "MLS45678901",
      lotSize: "0.40 acres"
    },
    {
      id: "mls-005",
      mlsId: "MLS56789012",
      address: "234 Downtown Lofts",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      price: 395000,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      yearBuilt: 2020,
      pricePerSqft: 329,
      daysOnMarket: 21,
      propertyType: "condo",
      status: "active",
      description: "Modern condo with luxury finishes in the heart of East Austin. Rooftop access, concierge service, and walkable to restaurants.",
      features: ["Rooftop Deck", "Concierge", "Gym Access", "Dog Park", "EV Charging"],
      photos: ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80"],
      listingUrl: "https://example.com/listing/5",
      mlsNumber: "MLS56789012",
      lotSize: "N/A"
    },
    {
      id: "mls-006",
      mlsId: "MLS67890123",
      address: "789 Highland Park Avenue",
      city: "Austin",
      state: "TX",
      zipCode: "78756",
      price: 725000,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2600,
      yearBuilt: 2018,
      pricePerSqft: 279,
      daysOnMarket: 6,
      propertyType: "single_family",
      status: "active",
      description: "Elegant home in prestigious neighborhood. Features formal dining, butler's pantry, and professionally landscaped yard.",
      features: ["Formal Dining", "Butler's Pantry", "Landscaped Yard", "Wine Cellar"],
      photos: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80"],
      listingUrl: "https://example.com/listing/6",
      mlsNumber: "MLS67890123",
      lotSize: "0.30 acres"
    }
  ];

  // Filter by price if provided
  let filtered = mockData;
  if (params.minPrice) {
    filtered = filtered.filter(p => p.price >= params.minPrice!);
  }
  if (params.maxPrice) {
    filtered = filtered.filter(p => p.price <= params.maxPrice!);
  }
  if (params.minBeds) {
    filtered = filtered.filter(p => p.bedrooms >= params.minBeds!);
  }
  if (params.minBaths) {
    filtered = filtered.filter(p => p.bathrooms >= params.minBaths!);
  }
  if (params.status && params.status !== "all") {
    filtered = filtered.filter(p => p.status === params.status);
  }

  return filtered;
}
