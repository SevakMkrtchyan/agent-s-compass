import { Heart, MapPin, Bed, Bath, Square, Calendar } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'compact' | 'swipe';
  onLike?: () => void;
  onPass?: () => void;
  onViewDetails?: () => void;
}

export function PropertyCard({ 
  property, 
  variant = 'default',
  onLike,
  onPass,
  onViewDetails 
}: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (variant === 'swipe') {
    return (
      <Card className="w-full max-w-md mx-auto overflow-hidden shadow-float">
        <div className="relative aspect-[4/3]">
          <img
            src={property.images[imageIndex]}
            alt={property.address}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Image Navigation */}
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1">
            {property.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  idx === imageIndex ? "w-8 bg-white" : "w-4 bg-white/50"
                )}
              />
            ))}
          </div>

          {/* Status Badge */}
          <Badge className="absolute top-4 right-4 bg-success text-success-foreground">
            {property.status}
          </Badge>

          {/* Price & Address */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="font-display text-3xl font-bold mb-1">
              {formatPrice(property.price)}
            </p>
            <p className="flex items-center gap-1 text-white/90">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.city}
            </p>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                {property.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                {property.bathrooms}
              </span>
              <span className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                {property.sqft.toLocaleString()} sqft
              </span>
            </div>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {property.daysOnMarket}d
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={onPass}
            >
              Pass
            </Button>
            <Button
              variant="accent"
              size="lg"
              className="flex-1"
              onClick={() => {
                setLiked(true);
                onLike?.();
              }}
            >
              <Heart className={cn("h-5 w-5", liked && "fill-current")} />
              Like
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden property-card group">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.address}
          className="absolute inset-0 w-full h-full object-cover image-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
        >
          <Heart className={cn("h-5 w-5", liked ? "fill-accent text-accent" : "text-muted-foreground")} />
        </button>

        <Badge className="absolute top-3 left-3 bg-card/90 text-foreground">
          {property.daysOnMarket}d on market
        </Badge>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="font-display text-2xl font-bold">
            {formatPrice(property.price)}
          </p>
        </div>
      </div>

      <CardContent className="p-4">
        <p className="flex items-center gap-1 text-foreground font-medium mb-2">
          <MapPin className="h-4 w-4 text-accent" />
          {property.address}
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          {property.city}, {property.state} {property.zipCode}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {property.bedrooms} beds
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {property.bathrooms} baths
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {property.sqft.toLocaleString()} sqft
          </span>
        </div>

        <Button variant="stage" className="w-full" onClick={onViewDetails}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
