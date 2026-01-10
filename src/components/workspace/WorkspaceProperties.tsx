import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  DollarSign,
  Heart,
  ExternalLink,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { mockProperties } from "@/data/mockData";
import { Property } from "@/types";
import { cn } from "@/lib/utils";

interface WorkspacePropertiesProps {
  buyerId: string;
}

export function WorkspaceProperties({ buyerId }: WorkspacePropertiesProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<string[]>(["1", "2"]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const toggleFavorite = (propertyId: string) => {
    setFavorites((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card className="overflow-hidden group hover:shadow-elevated transition-all">
      <div className="relative aspect-video">
        <img
          src={property.images[0]}
          alt={property.address}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge
            className={cn(
              "capitalize",
              property.status === "active"
                ? "bg-success text-success-foreground"
                : property.status === "pending"
                ? "bg-warning text-warning-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {property.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              favorites.includes(property.id)
                ? "fill-destructive text-destructive"
                : "text-muted-foreground"
            )}
          />
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-foreground">{formatPrice(property.price)}</h3>
          <span className="text-xs text-muted-foreground">
            ${property.pricePerSqft}/sqft
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          {property.address}, {property.city}, {property.state}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {property.daysOnMarket} days on market
          </span>
          <Button variant="ghost" size="sm" className="gap-1">
            <ExternalLink className="h-3 w-3" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Mock comparison data
  const comparisonData = [
    { address: "123 Oak Street", price: 485000, sqft: 1850, pricePerSqft: 262, status: "selected" },
    { address: "145 Oak Street", price: 478000, sqft: 1820, pricePerSqft: 263, status: "comp" },
    { address: "98 Maple Ave", price: 492000, sqft: 1900, pricePerSqft: 259, status: "comp" },
    { address: "210 Cedar Lane", price: 469000, sqft: 1780, pricePerSqft: 264, status: "comp" },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="properties" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="comparables">Comparables</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button size="sm" className="gap-2 ml-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>

        <TabsContent value="properties">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "space-y-3"
            )}
          >
            {mockProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparables">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Comparable Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Address</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sq Ft</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">$/Sq Ft</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">vs Selected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((comp, index) => {
                      const diff = comp.price - comparisonData[0].price;
                      const isSelected = comp.status === "selected";
                      return (
                        <tr
                          key={index}
                          className={cn(
                            "border-b last:border-0",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <Badge variant="default" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                              <span className={isSelected ? "font-medium" : ""}>
                                {comp.address}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {formatPrice(comp.price)}
                          </td>
                          <td className="text-right py-3 px-4">{comp.sqft.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">${comp.pricePerSqft}</td>
                          <td className="text-right py-3 px-4">
                            {!isSelected && (
                              <span
                                className={cn(
                                  "flex items-center justify-end gap-1",
                                  diff > 0 ? "text-destructive" : "text-success"
                                )}
                              >
                                {diff > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {diff > 0 ? "+" : ""}
                                {formatPrice(diff)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4 p-3 bg-info/10 rounded-lg">
                💡 This comparison is for educational purposes. Your agent can provide detailed market analysis with approved pricing recommendations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "space-y-3"
            )}
          >
            {mockProperties
              .filter((p) => favorites.includes(p.id))
              .map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
          </div>
          {favorites.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No favorite properties yet
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
