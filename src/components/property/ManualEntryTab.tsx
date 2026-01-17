import { useState } from "react";
import { Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MLSProperty } from "@/types/property";

interface ManualEntryTabProps {
  onSelectProperty: (property: MLSProperty) => void;
}

export function ManualEntryTab({ onSelectProperty }: ManualEntryTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [propertyType, setPropertyType] = useState("single_family");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");

  const formatPriceInput = (value: string) => {
    const num = value.replace(/[^\d]/g, "");
    if (!num) return "";
    return parseInt(num).toLocaleString();
  };

  const handleSubmit = async () => {
    if (!address || !city || !state || !zipCode || !price || !bedrooms || !bathrooms || !sqft) {
      return;
    }

    setIsSubmitting(true);

    // Create property object
    const property: MLSProperty = {
      id: `manual-${Date.now()}`,
      mlsId: mlsNumber || undefined,
      address,
      city,
      state,
      zipCode,
      price: parseInt(price.replace(/,/g, "")),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseFloat(bathrooms),
      sqft: parseInt(sqft.replace(/,/g, "")),
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
      pricePerSqft: Math.round(parseInt(price.replace(/,/g, "")) / parseInt(sqft.replace(/,/g, ""))),
      daysOnMarket: 0,
      propertyType,
      status: status as MLSProperty["status"],
      description: description || undefined,
      features: [],
      photos: [],
      listingUrl: listingUrl || undefined,
      mlsNumber: mlsNumber || undefined,
    };

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsSubmitting(false);
    onSelectProperty(property);
  };

  const isFormValid = address && city && state && zipCode && price && bedrooms && bathrooms && sqft;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">Manual Property Entry</h3>
          <p className="text-sm text-muted-foreground">Enter property details manually when MLS data isn't available</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Address & Location */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Location
          </h4>
          
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="TX"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="78701"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mlsNumber">MLS Number (optional)</Label>
            <Input
              id="mlsNumber"
              value={mlsNumber}
              onChange={(e) => setMlsNumber(e.target.value)}
              placeholder="MLS-123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="listingUrl">Listing URL (optional)</Label>
            <Input
              id="listingUrl"
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Right Column - Property Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Property Details
          </h4>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(formatPriceInput(e.target.value))}
                placeholder="500,000"
                className="pl-7"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Beds *</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baths *</Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                step="0.5"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">Sqft *</Label>
              <Input
                id="sqft"
                value={sqft}
                onChange={(e) => setSqft(formatPriceInput(e.target.value))}
                placeholder="1,800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                placeholder="2020"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi_family">Multi-Family</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">For Sale</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Property description..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Continue with Property"
          )}
        </Button>
      </div>
    </div>
  );
}
