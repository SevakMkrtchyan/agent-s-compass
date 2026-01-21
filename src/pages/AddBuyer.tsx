import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useBuyers } from "@/hooks/useBuyers";

const propertyTypes = [
  { id: "single-family", label: "Single Family" },
  { id: "condo", label: "Condo" },
  { id: "townhouse", label: "Townhouse" },
  { id: "multi-family", label: "Multi-Family" },
  { id: "land", label: "Land" },
];

export default function AddBuyer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createBuyer } = useBuyers();
  const [copied, setCopied] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    budgetMin: "",
    budgetMax: "",
    loanStatus: "not-started",
    preApprovalAmount: "",
    preferredAreas: [] as string[],
    propertyTypes: [] as string[],
    minBedrooms: "",
    minBathrooms: "",
    mustHaves: "",
    niceToHaves: "",
    agentNotes: "",
  });

  const [areaInput, setAreaInput] = useState("");

  // Generate unique portal link
  const portalLink = `https://portal.example.com/buyer/${formData.fullName.toLowerCase().replace(/\s+/g, "-") || "new-buyer"}-${Date.now().toString(36)}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArea = () => {
    if (areaInput.trim() && !formData.preferredAreas.includes(areaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        preferredAreas: [...prev.preferredAreas, areaInput.trim()]
      }));
      setAreaInput("");
    }
  };

  const handleRemoveArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      preferredAreas: prev.preferredAreas.filter(a => a !== area)
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

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return new Intl.NumberFormat("en-US").format(parseInt(numbers));
  };

  const parseCurrency = (value: string): number | undefined => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? parseInt(numbers) : undefined;
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the buyer's name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newBuyer = await createBuyer.mutateAsync({
        name: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        avatar_url: avatarPreview || undefined,
        budget_min: parseCurrency(formData.budgetMin),
        budget_max: parseCurrency(formData.budgetMax),
        pre_approval_status: formData.loanStatus === "not-started" ? "Not Started" :
                            formData.loanStatus === "in-progress" ? "In Progress" : "Pre-Approved",
        pre_approval_amount: parseCurrency(formData.preApprovalAmount),
        min_beds: formData.minBedrooms ? parseInt(formData.minBedrooms) : undefined,
        min_baths: formData.minBathrooms ? parseFloat(formData.minBathrooms) : undefined,
        preferred_cities: formData.preferredAreas.length > 0 ? formData.preferredAreas : undefined,
        property_types: formData.propertyTypes.length > 0 ? formData.propertyTypes : undefined,
        must_haves: formData.mustHaves.trim() || undefined,
        nice_to_haves: formData.niceToHaves.trim() || undefined,
        agent_notes: formData.agentNotes.trim() || undefined,
        portal_link: portalLink,
      });

      // Navigate to the new workspace using the buyer's ID
      navigate(`/workspace/${newBuyer.id}`);
    } catch (error) {
      console.error("Error creating buyer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border/30 flex items-center px-6 bg-[#f9fafb]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="ml-4 text-lg font-medium text-foreground">Add New Buyer</h1>
      </header>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Basic Information */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-6">
              {/* Avatar Upload */}
              <div className="flex-shrink-0">
                <label className="cursor-pointer group">
                  <div className={cn(
                    "w-20 h-20 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden transition-colors",
                    "hover:border-foreground/30 group-hover:bg-muted/50",
                    avatarPreview && "border-solid border-foreground/20"
                  )}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
                <p className="text-[10px] text-muted-foreground text-center mt-1">Photo</p>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-xs text-muted-foreground">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter buyer's full name"
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
                    placeholder="buyer@email.com"
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
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buyer Portal */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">
            Buyer Portal
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">
              Portal Link (auto-generated)
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={portalLink}
                readOnly
                className="flex-1 bg-muted/30 text-muted-foreground text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </section>

        {/* Property Preferences */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">
            Property Preferences
          </h2>
          <div className="space-y-4">
            {/* Budget Range */}
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

            {/* Loan Status */}
            <div>
              <Label className="text-xs text-muted-foreground">Loan Pre-Approval Status</Label>
              <Select
                value={formData.loanStatus}
                onValueChange={(val) => setFormData(prev => ({ ...prev, loanStatus: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pre-approved">Pre-Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pre-Approval Amount (conditional) */}
            {formData.loanStatus === "pre-approved" && (
              <div>
                <Label className="text-xs text-muted-foreground">Pre-Approval Amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    value={formData.preApprovalAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, preApprovalAmount: formatCurrency(e.target.value) }))}
                    placeholder="Enter pre-approval amount"
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
                  placeholder="Type and press Enter to add"
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAddArea}>
                  Add
                </Button>
              </div>
              {formData.preferredAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.preferredAreas.map((area) => (
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
                  value={formData.minBedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, minBedrooms: e.target.value }))}
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
                  value={formData.minBathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, minBathrooms: e.target.value }))}
                  placeholder="Any"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Buyer Profile */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">
            Buyer Profile
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Must-Have Features</Label>
              <Textarea
                value={formData.mustHaves}
                onChange={(e) => setFormData(prev => ({ ...prev, mustHaves: e.target.value }))}
                placeholder="What are their non-negotiables?"
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nice-to-Have Features</Label>
              <Textarea
                value={formData.niceToHaves}
                onChange={(e) => setFormData(prev => ({ ...prev, niceToHaves: e.target.value }))}
                placeholder="What would they love but can compromise on?"
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Agent Notes</Label>
              <Textarea
                value={formData.agentNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, agentNotes: e.target.value }))}
                placeholder="Private notes about this buyer..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border/30">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Workspace"}
          </Button>
        </div>
      </div>
    </div>
  );
}
