/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

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
  propertyType?: string[];
  status?: string;
  page?: number;
}

interface PropertyDetails {
  zpid?: string;
  url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!rapidApiKey) {
      console.error("RAPIDAPI_KEY not configured");
      return new Response(
        JSON.stringify({
          success: true,
          data: getMockProperties({}),
          isMock: true,
          message: "API key not configured. Showing demo properties.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { searchParams, propertyDetails } = await req.json();
    
    // If propertyDetails is provided, fetch single property details
    if (propertyDetails) {
      return await handlePropertyDetails(propertyDetails, rapidApiKey, corsHeaders);
    }

    // Otherwise, perform property search
    return await handlePropertySearch(searchParams || {}, rapidApiKey, corsHeaders);
  } catch (error: unknown) {
    console.error("Zillow search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: true,
        data: getMockProperties({}),
        isMock: true,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handlePropertySearch(
  params: SearchParams,
  apiKey: string,
  headers: Record<string, string>
) {
  const { location, minPrice, maxPrice, minBeds, minBaths, status, page = 1 } = params;

  if (!location) {
    return new Response(
      JSON.stringify({ success: false, error: "Location is required" }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 400 }
    );
  }

  console.log("Searching Zillow for:", location, params);

  // Map status to Zillow API format
  const statusMapping: Record<string, string> = {
    active: "forSale",
    pending: "recentlySold", // Zillow doesn't have pending, use recently sold
    sold: "recentlySold",
    all: "forSale",
  };

  const zillowStatus = statusMapping[status || "active"] || "forSale";

  // Build the search URL for RapidAPI Zillow
  const searchUrl = new URL("https://zillow-com1.p.rapidapi.com/propertyExtendedSearch");
  searchUrl.searchParams.set("location", location);
  searchUrl.searchParams.set("status_type", zillowStatus);
  searchUrl.searchParams.set("page", page.toString());
  
  if (minPrice) searchUrl.searchParams.set("minPrice", minPrice.toString());
  if (maxPrice) searchUrl.searchParams.set("maxPrice", maxPrice.toString());
  if (minBeds) searchUrl.searchParams.set("bedsMin", minBeds.toString());
  if (minBaths) searchUrl.searchParams.set("bathsMin", minBaths.toString());

  console.log("Zillow API URL:", searchUrl.toString());

  try {
    const response = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
      },
    });

    console.log("Zillow API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zillow API error:", errorText);
      throw new Error(`Zillow API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Zillow API response keys:", Object.keys(data));
    console.log("Properties count:", data.props?.length || 0);

    const properties = transformZillowData(data);

    if (properties.length === 0) {
      console.log("No properties found, returning mock data");
      return new Response(
        JSON.stringify({
          success: true,
          data: getMockProperties(params),
          isMock: true,
          message: "No properties found. Showing demo properties.",
          totalResults: 12,
        }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: properties,
        isMock: false,
        totalResults: data.totalResultCount || properties.length,
        currentPage: page,
      }),
      { headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Zillow search failed:", error);
    return new Response(
      JSON.stringify({
        success: true,
        data: getMockProperties(params),
        isMock: true,
        message: "Search failed. Showing demo properties.",
      }),
      { headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
}

async function handlePropertyDetails(
  details: PropertyDetails,
  apiKey: string,
  headers: Record<string, string>
) {
  const { zpid, url } = details;

  if (!zpid && !url) {
    return new Response(
      JSON.stringify({ success: false, error: "Either zpid or url is required" }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 400 }
    );
  }

  console.log("Fetching property details for:", zpid || url);

  try {
    const detailsUrl = new URL("https://zillow-com1.p.rapidapi.com/property");
    if (zpid) {
      detailsUrl.searchParams.set("zpid", zpid);
    } else if (url) {
      detailsUrl.searchParams.set("property_url", url);
    }

    const response = await fetch(detailsUrl.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Property details received:", Object.keys(data));

    const property = transformSingleProperty(data);

    return new Response(
      JSON.stringify({ success: true, data: property }),
      { headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Property details fetch failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

function transformZillowData(data: any): any[] {
  const props = data.props || data.results || [];
  
  return props.map((prop: any) => ({
    id: prop.zpid?.toString() || crypto.randomUUID(),
    mlsId: prop.zpid?.toString(),
    address: prop.streetAddress || prop.address || "Address unavailable",
    city: prop.city || "",
    state: prop.state || "",
    zipCode: prop.zipcode || "",
    price: prop.price || 0,
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 0,
    sqft: prop.livingArea || 0,
    yearBuilt: prop.yearBuilt,
    pricePerSqft: prop.livingArea ? Math.round(prop.price / prop.livingArea) : null,
    daysOnMarket: prop.daysOnZillow || 0,
    propertyType: mapPropertyType(prop.propertyType),
    status: mapZillowStatus(prop.listingStatus),
    description: prop.description || "",
    features: [],
    photos: prop.imgSrc ? [prop.imgSrc] : [],
    listingUrl: `https://www.zillow.com/homedetails/${prop.zpid}_zpid/`,
    mlsNumber: prop.zpid?.toString(),
    listingAgent: null,
    lotSize: prop.lotAreaValue ? `${prop.lotAreaValue} ${prop.lotAreaUnit || "sqft"}` : null,
    rawData: prop,
  }));
}

function transformSingleProperty(data: any): any {
  return {
    id: data.zpid?.toString() || crypto.randomUUID(),
    mlsId: data.zpid?.toString(),
    address: data.streetAddress || data.address?.streetAddress || "Address unavailable",
    city: data.city || data.address?.city || "",
    state: data.state || data.address?.state || "",
    zipCode: data.zipcode || data.address?.zipcode || "",
    price: data.price || data.zestimate || 0,
    bedrooms: data.bedrooms || 0,
    bathrooms: data.bathrooms || 0,
    sqft: data.livingArea || 0,
    yearBuilt: data.yearBuilt,
    pricePerSqft: data.resoFacts?.pricePerSquareFoot || (data.livingArea ? Math.round((data.price || data.zestimate) / data.livingArea) : null),
    daysOnMarket: data.daysOnZillow || 0,
    propertyType: mapPropertyType(data.homeType),
    status: mapZillowStatus(data.homeStatus),
    description: data.description || "",
    features: extractFeatures(data),
    photos: data.photos?.map((p: any) => p.url || p) || (data.imgSrc ? [data.imgSrc] : []),
    listingUrl: data.url || `https://www.zillow.com/homedetails/${data.zpid}_zpid/`,
    mlsNumber: data.zpid?.toString(),
    listingAgent: data.attributionInfo ? {
      name: data.attributionInfo.agentName,
      phone: data.attributionInfo.agentPhoneNumber,
      email: null,
    } : null,
    lotSize: data.resoFacts?.lotSize || null,
    rawData: data,
  };
}

function extractFeatures(data: any): string[] {
  const features: string[] = [];
  const facts = data.resoFacts || {};
  
  if (facts.hasGarage) features.push("Garage");
  if (facts.hasPool) features.push("Pool");
  if (facts.hasFireplace) features.push("Fireplace");
  if (facts.hasAC) features.push("Air Conditioning");
  if (facts.hasHeating) features.push("Heating");
  if (data.isNewConstruction) features.push("New Construction");
  
  return features;
}

function mapPropertyType(type: string | undefined): string {
  if (!type) return "single_family";
  const typeMap: Record<string, string> = {
    SINGLE_FAMILY: "single_family",
    CONDO: "condo",
    TOWNHOUSE: "townhouse",
    MULTI_FAMILY: "multi_family",
    LAND: "land",
    APARTMENT: "condo",
    MANUFACTURED: "single_family",
  };
  return typeMap[type.toUpperCase()] || "single_family";
}

function mapZillowStatus(status: string | undefined): string {
  if (!status) return "active";
  const statusMap: Record<string, string> = {
    FOR_SALE: "active",
    PENDING: "pending",
    SOLD: "sold",
    RECENTLY_SOLD: "sold",
    OFF_MARKET: "withdrawn",
  };
  return statusMap[status.toUpperCase()] || "active";
}

function getMockProperties(params: SearchParams): any[] {
  const location = params.location || "Austin, TX";
  const mockData = [
    {
      id: "mock-1",
      mlsId: "ZM-001",
      address: "1234 Live Oak Blvd",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      price: 485000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1850,
      yearBuilt: 2018,
      pricePerSqft: 262,
      daysOnMarket: 12,
      propertyType: "single_family",
      status: "active",
      description: "Beautiful modern home in the heart of Austin with an open floor plan and updated kitchen.",
      features: ["Garage", "Pool", "Updated Kitchen"],
      photos: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-001",
      listingAgent: { name: "Jane Smith", phone: "512-555-0101" },
      lotSize: "0.25 acres",
    },
    {
      id: "mock-2",
      mlsId: "ZM-002",
      address: "567 Congress Ave Unit 1205",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      price: 625000,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1400,
      yearBuilt: 2020,
      pricePerSqft: 446,
      daysOnMarket: 5,
      propertyType: "condo",
      status: "active",
      description: "Luxury downtown condo with stunning skyline views and premium finishes throughout.",
      features: ["Balcony", "Gym", "Concierge"],
      photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-002",
      listingAgent: { name: "John Doe", phone: "512-555-0102" },
      lotSize: null,
    },
    {
      id: "mock-3",
      mlsId: "ZM-003",
      address: "890 Barton Springs Rd",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      price: 750000,
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      yearBuilt: 2015,
      pricePerSqft: 312,
      daysOnMarket: 8,
      propertyType: "single_family",
      status: "active",
      description: "Spacious family home near Zilker Park with a large backyard and modern upgrades.",
      features: ["Pool", "Large Backyard", "Home Office"],
      photos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-003",
      listingAgent: { name: "Sarah Wilson", phone: "512-555-0103" },
      lotSize: "0.35 acres",
    },
    {
      id: "mock-4",
      mlsId: "ZM-004",
      address: "321 East 6th Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      price: 395000,
      bedrooms: 1,
      bathrooms: 1,
      sqft: 850,
      yearBuilt: 2019,
      pricePerSqft: 465,
      daysOnMarket: 22,
      propertyType: "condo",
      status: "active",
      description: "Urban living at its finest. Walking distance to entertainment district.",
      features: ["Rooftop Deck", "Pet Friendly", "In-Unit Laundry"],
      photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-004",
      listingAgent: { name: "Mike Brown", phone: "512-555-0104" },
      lotSize: null,
    },
    {
      id: "mock-5",
      mlsId: "ZM-005",
      address: "456 Mueller Blvd",
      city: "Austin",
      state: "TX",
      zipCode: "78723",
      price: 545000,
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1950,
      yearBuilt: 2021,
      pricePerSqft: 279,
      daysOnMarket: 3,
      propertyType: "townhouse",
      status: "active",
      description: "New construction townhome in the vibrant Mueller community with smart home features.",
      features: ["Smart Home", "Energy Efficient", "2-Car Garage"],
      photos: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-005",
      listingAgent: { name: "Lisa Chen", phone: "512-555-0105" },
      lotSize: "0.12 acres",
    },
    {
      id: "mock-6",
      mlsId: "ZM-006",
      address: "789 South Lamar Blvd",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      price: 875000,
      bedrooms: 4,
      bathrooms: 3.5,
      sqft: 2800,
      yearBuilt: 2017,
      pricePerSqft: 312,
      daysOnMarket: 15,
      propertyType: "single_family",
      status: "active",
      description: "Stunning contemporary home with high ceilings and designer finishes.",
      features: ["Wine Cellar", "Home Theater", "Chef's Kitchen"],
      photos: ["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-006",
      listingAgent: { name: "David Park", phone: "512-555-0106" },
      lotSize: "0.28 acres",
    },
    {
      id: "mock-7",
      mlsId: "ZM-007",
      address: "234 West Lake Hills Dr",
      city: "West Lake Hills",
      state: "TX",
      zipCode: "78746",
      price: 1250000,
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3500,
      yearBuilt: 2010,
      pricePerSqft: 357,
      daysOnMarket: 28,
      propertyType: "single_family",
      status: "active",
      description: "Luxurious estate home with panoramic hill country views and resort-style pool.",
      features: ["Infinity Pool", "Guest Suite", "3-Car Garage"],
      photos: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-007",
      listingAgent: { name: "Amanda Foster", phone: "512-555-0107" },
      lotSize: "0.75 acres",
    },
    {
      id: "mock-8",
      mlsId: "ZM-008",
      address: "678 East Riverside Dr",
      city: "Austin",
      state: "TX",
      zipCode: "78741",
      price: 320000,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1100,
      yearBuilt: 2022,
      pricePerSqft: 291,
      daysOnMarket: 7,
      propertyType: "condo",
      status: "active",
      description: "Brand new waterfront condo with stunning lake views and modern amenities.",
      features: ["Lake View", "Fitness Center", "Pool"],
      photos: ["https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-008",
      listingAgent: { name: "Chris Martinez", phone: "512-555-0108" },
      lotSize: null,
    },
    {
      id: "mock-9",
      mlsId: "ZM-009",
      address: "901 North Loop Blvd",
      city: "Austin",
      state: "TX",
      zipCode: "78756",
      price: 425000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1600,
      yearBuilt: 1965,
      pricePerSqft: 266,
      daysOnMarket: 45,
      propertyType: "single_family",
      status: "active",
      description: "Charming mid-century home in established neighborhood with mature trees.",
      features: ["Original Hardwoods", "Large Lot", "Detached Garage"],
      photos: ["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-009",
      listingAgent: { name: "Emily Rodriguez", phone: "512-555-0109" },
      lotSize: "0.40 acres",
    },
    {
      id: "mock-10",
      mlsId: "ZM-010",
      address: "543 South First Street",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      price: 575000,
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1800,
      yearBuilt: 2016,
      pricePerSqft: 319,
      daysOnMarket: 11,
      propertyType: "townhouse",
      status: "active",
      description: "Modern SoCo townhome with rooftop deck and walkability to local shops.",
      features: ["Rooftop Deck", "Walkable Location", "Modern Design"],
      photos: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-010",
      listingAgent: { name: "Tom Anderson", phone: "512-555-0110" },
      lotSize: "0.08 acres",
    },
    {
      id: "mock-11",
      mlsId: "ZM-011",
      address: "876 Round Rock Ave",
      city: "Round Rock",
      state: "TX",
      zipCode: "78681",
      price: 385000,
      bedrooms: 4,
      bathrooms: 2.5,
      sqft: 2200,
      yearBuilt: 2014,
      pricePerSqft: 175,
      daysOnMarket: 19,
      propertyType: "single_family",
      status: "active",
      description: "Spacious family home in top-rated school district with open layout.",
      features: ["Great Schools", "Community Pool", "Large Kitchen"],
      photos: ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-011",
      listingAgent: { name: "Rachel Kim", phone: "512-555-0111" },
      lotSize: "0.22 acres",
    },
    {
      id: "mock-12",
      mlsId: "ZM-012",
      address: "432 Domain Dr Unit 801",
      city: "Austin",
      state: "TX",
      zipCode: "78758",
      price: 450000,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1250,
      yearBuilt: 2023,
      pricePerSqft: 360,
      daysOnMarket: 2,
      propertyType: "condo",
      status: "active",
      description: "Brand new luxury condo in The Domain with high-end finishes and amenities.",
      features: ["New Construction", "Luxury Finishes", "Prime Location"],
      photos: ["https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80"],
      listingUrl: "#",
      mlsNumber: "ZM-012",
      listingAgent: { name: "Jennifer Lee", phone: "512-555-0112" },
      lotSize: null,
    },
  ];

  // Apply price filters
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

  return filtered;
}
