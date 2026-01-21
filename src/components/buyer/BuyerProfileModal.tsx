import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuyers, type Buyer } from "@/hooks/useBuyers";

const propertyTypes = [
  { id: "single-family", label: "Single Family" },
  { id: "condo", label: "Condo" },
  { id: "townhouse", label: "Townhouse" },
  { id: "multi-family", label: "Multi-Family" },
  { id: "land", label: "Land" },
];

interface BuyerProfileModalProps {
  buyer: Buyer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyerProfileModal({ buyer, open, onOpenChange }: BuyerProfileModalProps) {
  const { updateBuyer } = useBuyers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areaInput, setAreaInput] = useState("");

  const [formData, setFormData] = useState({
    name: buyer.name,
    email: buyer.email || "",
    phone: buyer.phone || "",
    budgetMin: buyer.budget_min?.toString() || "",
    budgetMax: buyer.budget_max?.toString() || "",
    preApprovalStatus: buyer.pre_approval_status || "Not Started",
    preApprovalAmount: buyer.pre_approval_amount?.toString() || "",
    currentStage: buyer.current_stage || "Home Search",
    preferredCities: buyer.preferred_cities || [],
    propertyTypes: buyer.property_types || [],
    minBeds: buyer.min_beds?.toString() || "",
    minBaths: buyer.min_baths?.toString() || "",
    mustHaves: buyer.must_haves || "",
    niceToHaves: buyer.nice_to_haves || "",
    agentNotes: buyer.agent_notes || "",
  });

  useEffect(() => {
    setFormData({
      name: buyer.name,
      email: buyer.email || "",
      phone: buyer.phone || "",
      budgetMin: buyer.budget_min?.toString() || "",
      budgetMax: buyer.budget_max?.toString() || "",
      preApprovalStatus: buyer.pre_approval_status || "Not Started",
      preApprovalAmount: buyer.pre_approval_amount?.toString() || "",
      currentStage: buyer.current_stage || "Home Search",
      preferredCities: buyer.preferred_cities || [],
      propertyTypes: buyer.property_types || [],
      minBeds: buyer.min_beds?.toString() || "",
      minBaths: buyer.min_baths?.toString() || "",
      mustHaves: buyer.must_haves || "",
      niceToHaves: buyer.nice_to_haves || "",
      agentNotes: buyer.agent_notes || "",
    });
  }, [buyer]);

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return new Intl.NumberFormat("en-US").format(parseInt(numbers));
  };

  const parseCurrency = (value: string): number | undefined => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? parseInt(numbers) : undefined;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleAddArea = () => {
    if (areaInput.trim() && !formData.preferredCities.includes(areaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferredCities: [...prev.preferredCities, areaInput.trim()]
      }));
      setAreaInput("");
    }
  };

  const handleRemoveArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      preferredCities: prev.preferredCities.filter(a => a !== area)
    }));
  };

  const handlePropertyTypeToggle = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(typeId)
        ? prev.propertyTypes.filter(t => t !== typeId)
        : [...prev.propertyTypes, typeId]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await updateBuyer.mutateAsync({
        id: buyer.id,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        budget_min: parseCurrency(formData.budgetMin),
        budget_max: parseCurrency(formData.budgetMax),
        pre_approval_status: formData.preApprovalStatus,
        pre_approval_amount: parseCurrency(formData.preApprovalAmount),
        min_beds: formData.minBeds ? parseInt(formData.minBeds) : undefined,
        min_baths: formData.minBaths ? parseFloat(formData.minBaths) : undefined,
        preferred_cities: formData.preferredCities.length > 0 ? formData.preferredCities : undefined,
        property_types: formData.propertyTypes.length > 0 ? formData.propertyTypes : undefined,
        must_haves: formData.mustHaves.trim() || undefined,
        nice_to_haves: formData.niceToHaves.trim() || undefined,
        agent_notes: formData.agentNotes.trim() || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating buyer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Buyer Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs text-muted-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* Status */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
              Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Current Stage</Label>
                <Select
                  value={formData.currentStage}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, currentStage: val }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home Search">Home Search</SelectItem>
                    <SelectItem value="Offer Strategy">Offer Strategy</SelectItem>
                    <SelectItem value="Under Contract">Under Contract</SelectItem>
                    <SelectItem value="Closing Preparation">Closing Preparation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pre-Approval Status</Label>
                <Select
                  value={formData.preApprovalStatus}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, preApprovalStatus: val }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pre-Approved">Pre-Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Property Preferences */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
              Property Preferences
            </h3>
            <div className="space-y-4">
              {/* Budget */}
              <div>
                <Label className="text-xs text-muted-foreground">Budget Range</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      value={formData.budgetMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: formatCurrency(e.target.value) }))}
                      placeholder="Min"
                      className="pl-7"
                    />
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      value={formData.budgetMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: formatCurrency(e.target.value) }))}
                      placeholder="Max"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-Approval Amount */}
              {formData.preApprovalStatus === "Pre-Approved" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Pre-Approval Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      value={formData.preApprovalAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, preApprovalAmount: formatCurrency(e.target.value) }))}
                      className="pl-7"
                    />
                  </div>
                </div>
              )}

              {/* Preferred Areas */}
              <div>
                <Label className="text-xs text-muted-foreground">Preferred Cities/Neighborhoods</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddArea())}
                    placeholder="Type and press Enter"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddArea}>
                    Add
                  </Button>
                </div>
                {formData.preferredCities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.preferredCities.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                      >
                        {area}
                        <button onClick={() => handleRemoveArea(area)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Types */}
              <div>
                <Label className="text-xs text-muted-foreground">Property Type</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {propertyTypes.map((type) => (
                    <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.propertyTypes.includes(type.id)}
                        onCheckedChange={() => handlePropertyTypeToggle(type.id)}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Min Bedrooms</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minBeds}
                    onChange={(e) => setFormData(prev => ({ ...prev, minBeds: e.target.value }))}
                    placeholder="Any"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Min Bathrooms</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.minBaths}
                    onChange={(e) => setFormData(prev => ({ ...prev, minBaths: e.target.value }))}
                    placeholder="Any"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
              Buyer Profile
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Must-Have Features</Label>
                <Textarea
                  value={formData.mustHaves}
                  onChange={(e) => setFormData(prev => ({ ...prev, mustHaves: e.target.value }))}
                  placeholder="What are their non-negotiables?"
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nice-to-Have Features</Label>
                <Textarea
                  value={formData.niceToHaves}
                  onChange={(e) => setFormData(prev => ({ ...prev, niceToHaves: e.target.value }))}
                  placeholder="What would they love but can compromise on?"
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Agent Notes</Label>
                <Textarea
                  value={formData.agentNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, agentNotes: e.target.value }))}
                  placeholder="Private notes about this buyer..."
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
