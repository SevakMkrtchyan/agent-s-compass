import { useState, useCallback } from "react";
import { 
  Filter, ChevronDown, ChevronUp, 
  Loader2, Home, Bed, Bath, Square, MapPin,
  ChevronLeft, ChevronRight, Heart, ImageOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRealtorSearch } from "@/hooks/useRealtorSearch";
import { usePinnedProperties } from "@/hooks/usePinnedProperties";
import { MLSProperty } from "@/types/property";
import { toast } from "@/hooks/use-toast";
import { MapboxLocationSearch } from "./MapboxLocationSearch";
import { PropertyDetailModal } from "./PropertyDetailModal";

interface PropertySearchTabProps {
  onSelectProperty: (property: MLSProperty) => void;
}

export function PropertySearchTab({ onSelectProperty }: PropertySearchTabProps) {
  const { search, loadMore, results, totalResults, isSearching, isMockData, error } = useRealtorSearch();
  const { isPinned, togglePin, pinnedCount } = usePinnedProperties();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState<string>("any");
  const [minBaths, setMinBaths] = useState<string>("any");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal state
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<MLSProperty | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = useCallback(async () => {
    const locationToSearch = searchLocation || searchQuery;
    
    if (!locationToSearch.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a city, state, or address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await search({
        location: locationToSearch,
        minPrice: minPrice ? parseInt(minPrice.replace(/,/g, "")) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice.replace(/,/g, "")) : undefined,
        minBeds: minBeds !== "any" ? parseInt(minBeds) : undefined,
        minBaths: minBaths !== "any" ? parseInt(minBaths) : undefined,
        propertyType: propertyTypes.length > 0 ? propertyTypes : undefined,
        status: statusFilter,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      toast({
        title: "Search Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [searchLocation, searchQuery, minPrice, maxPrice, minBeds, minBaths, propertyTypes, statusFilter, search]);

  const handleLocationSelect = useCallback((location: string, _fullAddress: string) => {
    setSearchLocation(location);
  }, []);

  const handleLoadMore = async () => {
    const locationToSearch = searchLocation || searchQuery;
    setIsLoadingMore(true);
    await loadMore({
      location: locationToSearch,
      minPrice: minPrice ? parseInt(minPrice.replace(/,/g, "")) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice.replace(/,/g, "")) : undefined,
      minBeds: minBeds !== "any" ? parseInt(minBeds) : undefined,
      minBaths: minBaths !== "any" ? parseInt(minBaths) : undefined,
      propertyType: propertyTypes.length > 0 ? propertyTypes : undefined,
      status: statusFilter,
    });
    setIsLoadingMore(false);
  };

  const handlePropertyTypeToggle = (type: string) => {
    setPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatPriceInput = (value: string) => {
    const num = value.replace(/[^\d]/g, "");
    if (!num) return "";
    return parseInt(num).toLocaleString();
  };

  const propertyTypeOptions = [
    { value: "single_family", label: "Single Family" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "multi_family", label: "Multi-Family" },
    { value: "land", label: "Land" },
  ];

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setMinBeds("any");
    setMinBaths("any");
    setPropertyTypes([]);
    setStatusFilter("active");
  };

  const openPropertyModal = (property: MLSProperty) => {
    setSelectedPropertyForModal(property);
    setIsModalOpen(true);
  };

  const handleSelectFromModal = (property: MLSProperty) => {
    setIsModalOpen(false);
    onSelectProperty(property);
  };

  const handleQuickPin = (e: React.MouseEvent, property: MLSProperty) => {
    e.stopPropagation();
    togglePin(property);
    toast({
      title: isPinned(property.id) ? "Removed from saved" : "Saved to My Properties",
      description: isPinned(property.id) 
        ? "Property removed from your saved list" 
        : "You can find it in your saved properties",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MapboxLocationSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            onLocationSelect={handleLocationSelect}
            placeholder="Search address, city, or ZIP code..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching} className="h-11 px-6">
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Filter Toggle with Pinned Count */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 text-muted-foreground"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {pinnedCount > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <Heart className="h-3.5 w-3.5 fill-current text-destructive" />
              {pinnedCount} saved
            </Badge>
          )}
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="p-4 border border-border rounded-lg bg-card space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Price Range */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Min Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    value={minPrice}
                    onChange={(e) => setMinPrice(formatPriceInput(e.target.value))}
                    placeholder="0"
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Max Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(formatPriceInput(e.target.value))}
                    placeholder="Any"
                    className="pl-7"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Bedrooms</Label>
                <Select value={minBeds} onValueChange={setMinBeds}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Bathrooms</Label>
                <Select value={minBaths} onValueChange={setMinBaths}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Types */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {propertyTypeOptions.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handlePropertyTypeToggle(type.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-colors",
                      propertyTypes.includes(type.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">For Sale</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
              <Button onClick={handleSearch} disabled={isSearching}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground animate-pulse">
            Searching properties...
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
                <Skeleton className="h-[280px]" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-16 border border-destructive/20 rounded-xl bg-destructive/5">
          <div className="text-destructive mb-4">
            <Home className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <p className="text-lg font-medium text-destructive mb-2">Search Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={handleSearch}>
            Try Again
          </Button>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {results.length} of {totalResults} properties
              {isMockData && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">(demo data)</span>}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((property) => (
              <PropertySearchCard 
                key={property.id} 
                property={property} 
                onSelect={() => onSelectProperty(property)}
                onClick={() => openPropertyModal(property)}
                isPinned={isPinned(property.id)}
                onTogglePin={(e) => handleQuickPin(e, property)}
              />
            ))}
          </div>

          {results.length < totalResults && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  `Load More (${totalResults - results.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-16 text-muted-foreground border border-border rounded-xl bg-muted/30">
          <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">No properties found</p>
          <p className="text-sm">No properties found in this location. Try a different city or adjust your filters.</p>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">Enter a location to search</p>
          <p className="text-sm">Search for properties by address, city, or ZIP code</p>
        </div>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedPropertyForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromModal}
        isPinned={selectedPropertyForModal ? isPinned(selectedPropertyForModal.id) : false}
        onTogglePin={togglePin}
      />
    </div>
  );
}

interface PropertySearchCardProps {
  property: MLSProperty;
  onSelect: () => void;
  onClick: () => void;
  isPinned: boolean;
  onTogglePin: (e: React.MouseEvent) => void;
}

function PropertySearchCard({ property, onSelect, onClick, isPinned, onTogglePin }: PropertySearchCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  // Get high-res images
  const getHighResImage = (url: string) => {
    return url
      .replace(/-m(\d+)/g, '-b$1')
      .replace('l-m', 'l-b')
      .replace('/s_', '/l_')
      .replace('_s.', '_l.');
  };
  
  const defaultPhoto = "/placeholder.svg";
  const photos = property.photos.length > 0 && !imageError
    ? property.photos.map(getHighResImage)
    : [defaultPhoto];
  
  const hasMultiplePhotos = photos.length > 1;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const goToPrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
    setIsImageLoading(true);
  };

  const goToNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
    setIsImageLoading(true);
  };

  const handleImageError = () => {
    // Try medium res as fallback
    if (!imageError) {
      setImageError(true);
      setCurrentPhotoIndex(0);
    }
    setIsImageLoading(false);
  };

  return (
    <div 
      className="group border border-border rounded-xl overflow-hidden bg-card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 cursor-pointer"
      onClick={onClick}
    >
      {/* Property Image Carousel */}
      <div className="h-[280px] relative overflow-hidden bg-muted">
        {/* Progressive loading blur effect */}
        {isImageLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
            <ImageOff className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        
        <img
          src={photos[currentPhotoIndex]}
          alt={`${property.address} - Photo ${currentPhotoIndex + 1}`}
          className={cn(
            "w-full h-full object-cover group-hover:scale-105 transition-all duration-500",
            isImageLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsImageLoading(false)}
          onError={handleImageError}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Pin/Save Button */}
        <button
          onClick={onTogglePin}
          className={cn(
            "absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 z-20",
            isPinned 
              ? "bg-destructive text-white" 
              : "bg-background/90 text-muted-foreground hover:text-destructive hover:bg-background"
          )}
          aria-label={isPinned ? "Remove from saved" : "Save property"}
        >
          <Heart className={cn("h-4 w-4", isPinned && "fill-current")} />
        </button>
        
        {/* Photo Navigation Arrows */}
        {hasMultiplePhotos && (
          <>
            <button
              onClick={goToPrevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background hover:scale-110 shadow-lg z-20"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background hover:scale-110 shadow-lg z-20"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        {/* Photo Counter Badge */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        )}
        
        {/* Days on Market Badge */}
        {property.daysOnMarket !== undefined && property.daysOnMarket >= 0 && (
          <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium shadow-md">
            {property.daysOnMarket === 0 ? 'New listing' : `${property.daysOnMarket} days`}
          </div>
        )}
        
        {/* Status Badge */}
        {property.status && property.status !== 'active' && (
          <div className={cn(
            "absolute top-12 left-3 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md uppercase tracking-wide",
            property.status === 'pending' && "bg-warning text-warning-foreground",
            property.status === 'sold' && "bg-destructive text-destructive-foreground",
          )}>
            {property.status}
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-5 space-y-4">
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {formatPrice(property.price)}
          </p>
          {property.pricePerSqft && (
            <p className="text-xs text-muted-foreground mt-0.5">
              ${property.pricePerSqft.toLocaleString()}/sqft
            </p>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">
            {property.address}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {property.city}, {property.state} {property.zipCode}
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <Bed className="h-4 w-4" />
            <span className="font-medium text-foreground">{property.bedrooms}</span> bd
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            <span className="font-medium text-foreground">{property.bathrooms}</span> ba
          </span>
          <span className="flex items-center gap-1.5">
            <Square className="h-4 w-4" />
            <span className="font-medium text-foreground">{property.sqft.toLocaleString()}</span> sqft
          </span>
        </div>

        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }} 
          className="w-full h-11 font-medium"
          size="lg"
        >
          Select Property
        </Button>
      </div>
    </div>
  );
}
