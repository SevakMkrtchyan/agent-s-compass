import { useState, useEffect, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Heart, Share2, 
  Bed, Bath, Square, MapPin, Calendar, Home,
  ExternalLink, Building, Ruler, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MLSProperty } from '@/types/property';
import { toast } from '@/hooks/use-toast';

interface PropertyDetailModalProps {
  property: MLSProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (property: MLSProperty) => void;
  isPinned?: boolean;
  onTogglePin?: (property: MLSProperty) => void;
}

export function PropertyDetailModal({
  property,
  isOpen,
  onClose,
  onSelect,
  isPinned = false,
  onTogglePin,
}: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<Record<number, boolean>>({});
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Reset state when property changes
  useEffect(() => {
    if (property) {
      setCurrentImageIndex(0);
      setImageLoadError({});
      setIsImageLoading(true);
    }
  }, [property?.id]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentImageIndex, property]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Use photos directly - edge function already handles HTTPS
  const photos = property?.photos?.length 
    ? property.photos 
    : ['/placeholder.svg'];

  const goToPrevImage = useCallback(() => {
    setCurrentImageIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
    setIsImageLoading(true);
  }, [photos.length]);

  const goToNextImage = useCallback(() => {
    setCurrentImageIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
    setIsImageLoading(true);
  }, [photos.length]);

  const handleShare = async () => {
    if (!property) return;
    
    const shareData = {
      title: `${property.address}`,
      text: `Check out this property: ${property.address}, ${property.city}`,
      url: property.listingUrl || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(property.listingUrl || window.location.href);
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handlePin = () => {
    if (property && onTogglePin) {
      onTogglePin(property);
      toast({
        title: isPinned ? "Removed from saved" : "Saved to My Properties",
        description: isPinned 
          ? "Property removed from your saved list" 
          : "You can find it in the Properties tab",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleImageError = (index: number) => {
    setImageLoadError(prev => ({ ...prev, [index]: true }));
    setIsImageLoading(false);
  };

  if (!isOpen || !property) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Full-screen centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <div 
          className="pointer-events-auto w-full max-w-7xl max-h-[90vh] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Search Results</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Property Details</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-9 w-9"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePin}
                className={cn(
                  "h-9 w-9",
                  isPinned && "text-destructive hover:text-destructive"
                )}
              >
                <Heart className={cn("h-4 w-4", isPinned && "fill-current")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content - Two column layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Left: Image Gallery (60%) */}
            <div className="lg:w-[60%] bg-muted shrink-0 flex flex-col">
              {/* Main Image */}
              <div className="relative flex-1 min-h-[300px] lg:min-h-0">
                {isImageLoading && (
                  <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                    <Home className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <img
                  src={imageLoadError[currentImageIndex] ? '/placeholder.svg' : photos[currentImageIndex]}
                  alt={`${property.address} - Photo ${currentImageIndex + 1}`}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    isImageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => handleImageError(currentImageIndex)}
                />

                {/* Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background transition-all hover:scale-105"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background transition-all hover:scale-105"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Photo Counter */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium shadow-lg">
                    {currentImageIndex + 1} / {photos.length}
                  </div>
                )}

                {/* Status Badge */}
                {property.status && property.status !== 'active' && (
                  <Badge 
                    className={cn(
                      "absolute top-4 left-4 uppercase tracking-wide",
                      property.status === 'pending' && "bg-warning text-warning-foreground",
                      property.status === 'sold' && "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {property.status}
                  </Badge>
                )}
              </div>

              {/* Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-background/50 shrink-0">
                  {photos.slice(0, 8).map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setIsImageLoading(true);
                      }}
                      className={cn(
                        "flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all",
                        index === currentImageIndex 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={imageLoadError[index] ? '/placeholder.svg' : photo}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(index)}
                      />
                    </button>
                  ))}
                  {photos.length > 8 && (
                    <div className="flex-shrink-0 w-20 h-14 rounded-md bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      +{photos.length - 8}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Property Info (40%) */}
            <div className="lg:w-[40%] flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Price & Address */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {formatPrice(property.price)}
                        </p>
                        {property.pricePerSqft && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ${property.pricePerSqft.toLocaleString()}/sqft
                          </p>
                        )}
                      </div>
                      {property.daysOnMarket !== undefined && (
                        <Badge variant="secondary" className="flex items-center gap-1.5 shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                          {property.daysOnMarket === 0 ? 'New' : `${property.daysOnMarket}d`} on market
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-medium text-foreground mt-3">
                      {property.address}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      {property.city}, {property.state} {property.zipCode}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-y border-border">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">{property.bedrooms}</span>
                      <span className="text-muted-foreground">beds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">{property.bathrooms}</span>
                      <span className="text-muted-foreground">baths</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Square className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">{property.sqft.toLocaleString()}</span>
                      <span className="text-muted-foreground">sqft</span>
                    </div>
                    {property.lotSize && (
                      <div className="flex items-center gap-2">
                        <Ruler className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{property.lotSize}</span>
                        <span className="text-muted-foreground">lot</span>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full grid grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="description">Details</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                      <TabsTrigger value="agent">Agent</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {property.propertyType && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Type</p>
                              <p className="font-medium capitalize text-sm">{property.propertyType.replace('_', ' ')}</p>
                            </div>
                          </div>
                        )}
                        {property.yearBuilt && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Built</p>
                              <p className="font-medium text-sm">{property.yearBuilt}</p>
                            </div>
                          </div>
                        )}
                        {property.mlsNumber && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Home className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">MLS #</p>
                              <p className="font-medium text-sm">{property.mlsNumber}</p>
                            </div>
                          </div>
                        )}
                        {property.status && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              property.status === 'active' && "bg-success",
                              property.status === 'pending' && "bg-warning",
                              property.status === 'sold' && "bg-destructive",
                            )} />
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="font-medium capitalize text-sm">{property.status}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="description" className="mt-4">
                      {property.description ? (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                          {property.description}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic text-sm">
                          No description available for this property.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="features" className="mt-4">
                      {property.features && property.features.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {property.features.map((feature, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="px-3 py-1"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic text-sm">
                          No features listed for this property.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="agent" className="mt-4">
                      {property.listingAgent ? (
                        <div className="space-y-2">
                          {property.listingAgent.name && (
                            <p className="font-medium">{property.listingAgent.name}</p>
                          )}
                          {property.listingAgent.phone && (
                            <p className="text-muted-foreground text-sm">{property.listingAgent.phone}</p>
                          )}
                          {property.listingAgent.email && (
                            <p className="text-muted-foreground text-sm">{property.listingAgent.email}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic text-sm">
                          No agent information available.
                        </p>
                      )}
                      {property.listingUrl && property.listingUrl !== '#' && (
                        <Button
                          variant="outline"
                          className="mt-4 gap-2"
                          size="sm"
                          onClick={() => window.open(property.listingUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Original Listing
                        </Button>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border bg-background flex gap-3 shrink-0">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handlePin}
                >
                  <Heart className={cn("h-4 w-4", isPinned && "fill-current text-destructive")} />
                  {isPinned ? 'Saved' : 'Save Property'}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => onSelect(property)}
                >
                  Select Property
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
