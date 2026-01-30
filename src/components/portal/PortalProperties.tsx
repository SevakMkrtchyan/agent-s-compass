import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Bed, Bath, Square, Heart, MapPin } from "lucide-react";

interface PortalPropertiesProps {
  buyerId: string;
}

interface PropertyWithDetails {
  id: string;
  property_id: string;
  favorited: boolean;
  viewed: boolean;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    photos: string[] | null;
    status: string;
  } | null;
}

export function PortalProperties({ buyerId }: PortalPropertiesProps) {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["portal-properties", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyer_properties")
        .select(`
          id,
          property_id,
          favorited,
          viewed,
          property:properties(id, address, city, state, zip_code, price, bedrooms, bathrooms, sqft, photos, status)
        `)
        .eq("buyer_id", buyerId)
        .eq("archived", false)
        .order("favorited", { ascending: false });

      if (error) throw error;
      return data as unknown as PropertyWithDetails[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Your Properties</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Your Properties</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No properties yet</p>
            <p className="text-muted-foreground text-sm">
              Your agent will add properties for you to review
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Properties</h1>
        <Badge variant="secondary">{properties.length} properties</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((bp) => {
          const property = bp.property;
          if (!property) return null;

          const photos = Array.isArray(property.photos) ? property.photos : [];
          const imageUrl = photos[0] || "/placeholder.svg";

          return (
            <Card key={bp.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={property.address}
                    className="h-48 w-full object-cover"
                  />
                  {bp.favorited && (
                    <div className="absolute top-2 right-2">
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </div>
                  )}
                  <Badge 
                    className="absolute top-2 left-2"
                    variant={property.status === "active" ? "default" : "secondary"}
                  >
                    {property.status}
                  </Badge>
                </div>

                <div className="p-4">
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </p>
                  <p className="font-medium mt-1">{property.address}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.city}, {property.state} {property.zip_code}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms} bd
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms} ba
                    </span>
                    <span className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {property.sqft.toLocaleString()} sqft
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
