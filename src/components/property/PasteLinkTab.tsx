import { useState } from "react";
import { Link2, Loader2, ExternalLink, Bed, Bath, Square, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useZillowSearch } from "@/hooks/useZillowSearch";
import { MLSProperty } from "@/types/property";

interface PasteLinkTabProps {
  onSelectProperty: (property: MLSProperty) => void;
}

export function PasteLinkTab({ onSelectProperty }: PasteLinkTabProps) {
  const { fetchPropertyDetails } = useZillowSearch();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedProperty, setFetchedProperty] = useState<MLSProperty | null>(null);

  const isValidUrl = (input: string) => {
    try {
      const parsed = new URL(input);
      return parsed.hostname.includes("zillow.com") || 
             parsed.hostname.includes("redfin.com") ||
             parsed.hostname.includes("realtor.com") ||
             parsed.hostname.includes("trulia.com");
    } catch {
      return false;
    }
  };

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Please enter a property URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid Zillow, Redfin, Realtor.com, or Trulia URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFetchedProperty(null);

    try {
      const property = await fetchPropertyDetails(url);
      if (property) {
        setFetchedProperty(property);
      } else {
        setError("Unable to fetch property details. Please try a different URL or use manual entry.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch property");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="property-url" className="text-sm font-medium">
            Property Listing URL
          </Label>
          <p className="text-sm text-muted-foreground">
            Paste a link from Zillow, Redfin, Realtor.com, or Trulia
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="property-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="https://www.zillow.com/homedetails/..."
              className="pl-10 h-11"
            />
          </div>
          <Button onClick={handleFetch} disabled={isLoading} className="h-11 px-6">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch Property"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Supported Sites */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Supported sites:</span>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-muted rounded">Zillow</span>
          <span className="px-2 py-1 bg-muted rounded">Redfin</span>
          <span className="px-2 py-1 bg-muted rounded">Realtor.com</span>
          <span className="px-2 py-1 bg-muted rounded">Trulia</span>
        </div>
      </div>

      {/* Fetched Property Preview */}
      {fetchedProperty && (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="aspect-video relative overflow-hidden bg-muted">
            <img
              src={fetchedProperty.photos[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"}
              alt={fetchedProperty.address}
              className="w-full h-full object-cover"
            />
            {fetchedProperty.daysOnMarket !== undefined && (
              <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                {fetchedProperty.daysOnMarket} days on market
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {formatPrice(fetchedProperty.price)}
              </p>
              <p className="text-base font-medium text-foreground mt-1">
                {fetchedProperty.address}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {fetchedProperty.city}, {fetchedProperty.state} {fetchedProperty.zipCode}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fetchedProperty.bedrooms}</span> beds
              </span>
              <span className="flex items-center gap-1.5">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fetchedProperty.bathrooms}</span> baths
              </span>
              <span className="flex items-center gap-1.5">
                <Square className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fetchedProperty.sqft.toLocaleString()}</span> sqft
              </span>
            </div>

            {fetchedProperty.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {fetchedProperty.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => onSelectProperty(fetchedProperty)} className="flex-1">
                Use This Property
              </Button>
              {fetchedProperty.listingUrl && fetchedProperty.listingUrl !== "#" && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(fetchedProperty.listingUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!fetchedProperty && !isLoading && !error && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Link2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">Paste a property link</p>
          <p className="text-sm">We'll automatically extract the property details</p>
        </div>
      )}
    </div>
  );
}
