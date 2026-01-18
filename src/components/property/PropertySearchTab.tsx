import { useState } from "react";
import { 
  Search, Filter, ChevronDown, ChevronUp, 
  Loader2, Home, Bed, Bath, Square, MapPin,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRealtorSearch } from "@/hooks/useRealtorSearch";
import { MLSProperty } from "@/types/property";
import { toast } from "@/hooks/use-toast";

interface PropertySearchTabProps {
  onSelectProperty: (property: MLSProperty) => void;
}

export function PropertySearchTab({ onSelectProperty }: PropertySearchTabProps) {
  const { search, loadMore, results, totalResults, isSearching, isMockData, error } = useRealtorSearch();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState<string>("any");
  const [minBaths, setMinBaths] = useState<string>("any");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a city and state (e.g., Austin, TX)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await search({
        location: searchQuery,
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
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadMore({
      location: searchQuery,
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
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

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter city and state (e.g., Austin, TX)"
              className="pl-10 h-11"
            />
          </div>
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

        {/* Filter Toggle */}
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

        {/* Expandable Filters */}
        {showFilters && (
          <div className="p-4 border border-border rounded-lg bg-card space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="border border-border rounded-lg overflow-hidden bg-card">
              <Skeleton className="aspect-[4/3]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {results.length} of {totalResults} properties
              {isMockData && <span className="ml-2 text-xs">(demo data)</span>}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((property) => (
              <PropertySearchCard 
                key={property.id} 
                property={property} 
                onSelect={() => onSelectProperty(property)}
              />
            ))}
          </div>

          {results.length < totalResults && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">No properties found</p>
          <p className="text-sm">Enter a location to search for properties</p>
        </div>
      )}
    </div>
  );
}

interface PropertySearchCardProps {
  property: MLSProperty;
  onSelect: () => void;
}

function PropertySearchCard({ property, onSelect }: PropertySearchCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const photos = property.photos.length > 0 
    ? property.photos 
    : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"];
  
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
  };

  const goToNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="group border border-border rounded-lg overflow-hidden bg-card hover:shadow-elevated transition-all duration-200 hover:scale-[1.02]">
      {/* Property Image Carousel */}
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img
          src={photos[currentPhotoIndex]}
          alt={`${property.address} - Photo ${currentPhotoIndex + 1}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Photo Navigation Arrows */}
        {hasMultiplePhotos && (
          <>
            <button
              onClick={goToPrevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        
        {/* Photo Counter */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        )}
        
        {/* Days on Market Badge */}
        {property.daysOnMarket !== undefined && (
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
            {property.daysOnMarket} days on market
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xl font-semibold text-foreground">
            {formatPrice(property.price)}
          </p>
          <p className="text-sm font-medium text-foreground mt-1">
            {property.address}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {property.city}, {property.state} {property.zipCode}
          </p>
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

        <Button 
          onClick={onSelect} 
          className="w-full"
        >
          Select Property
        </Button>
      </div>
    </div>
  );
}
