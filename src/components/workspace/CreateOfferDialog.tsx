import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, Home } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CreateOfferInput } from "@/hooks/useOffers";
import { MLSProperty } from "@/types/property";

interface CreateOfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateOfferInput) => Promise<any>;
  properties: Array<{ id: string; property: MLSProperty }>;
  preselectedPropertyId?: string;
  prefilledValues?: {
    offerAmount?: number;
    earnestMoney?: number;
    contingencies?: string[];
    closingCostCredit?: number;
  };
}

const CONTINGENCY_OPTIONS = [
  { id: "financing", label: "Financing" },
  { id: "inspection", label: "Inspection" },
  { id: "appraisal", label: "Appraisal" },
  { id: "sale-of-home", label: "Sale of Home" },
];

export function CreateOfferDialog({
  isOpen,
  onClose,
  onSubmit,
  properties,
  preselectedPropertyId,
  prefilledValues,
}: CreateOfferDialogProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedPropertyId || "");
  const [offerAmount, setOfferAmount] = useState(prefilledValues?.offerAmount?.toString() || "");
  const [earnestMoney, setEarnestMoney] = useState(prefilledValues?.earnestMoney?.toString() || "");
  const [closingDate, setClosingDate] = useState<Date | undefined>();
  const [contingencies, setContingencies] = useState<string[]>(prefilledValues?.contingencies || ["financing", "inspection"]);
  const [closingCostCredit, setClosingCostCredit] = useState(prefilledValues?.closingCostCredit?.toString() || "0");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens with prefilled values
  useEffect(() => {
    if (isOpen) {
      setSelectedPropertyId(preselectedPropertyId || "");
      setOfferAmount(prefilledValues?.offerAmount?.toString() || "");
      setEarnestMoney(prefilledValues?.earnestMoney?.toString() || "");
      setContingencies(prefilledValues?.contingencies || ["financing", "inspection"]);
      setClosingCostCredit(prefilledValues?.closingCostCredit?.toString() || "0");
      setClosingDate(undefined);
      setNotes("");
    }
  }, [isOpen, preselectedPropertyId, prefilledValues]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)?.property;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  const handleContingencyChange = (id: string, checked: boolean) => {
    setContingencies(prev =>
      checked ? [...prev, id] : prev.filter(c => c !== id)
    );
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId || !offerAmount || !earnestMoney) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        propertyId: selectedPropertyId,
        offerAmount: parseFloat(offerAmount),
        earnestMoney: parseFloat(earnestMoney),
        closingDate: closingDate?.toISOString(),
        contingencies,
        notes: notes || undefined,
        closingCostCredit: parseFloat(closingCostCredit) || 0,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const property = properties.find(p => p.id === propertyId)?.property;
    if (property && !offerAmount) {
      // Suggest offer at list price
      setOfferAmount(property.price.toString());
      // Suggest 3% earnest money
      setEarnestMoney(Math.round(property.price * 0.03).toString());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Create New Offer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label>Select Property</Label>
            <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a property..." />
              </SelectTrigger>
              <SelectContent>
                {properties.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No properties saved</p>
                    <p className="text-xs">Add properties first to create offers</p>
                  </div>
                ) : (
                  properties.map((bp) => (
                    <SelectItem key={bp.id} value={bp.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bp.property.address}</span>
                        <span className="text-muted-foreground">
                          {formatPrice(bp.property.price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedProperty && (
              <p className="text-xs text-muted-foreground">
                {selectedProperty.bedrooms} bed, {selectedProperty.bathrooms} bath, {selectedProperty.sqft.toLocaleString()} sqft • List: {formatPrice(selectedProperty.price)}
              </p>
            )}
          </div>

          {/* Offer Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Offer Amount ($)</Label>
              <Input
                type="number"
                placeholder="485000"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
              />
              {selectedProperty && offerAmount && (
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const diff = parseFloat(offerAmount) - selectedProperty.price;
                    const percent = ((diff / selectedProperty.price) * 100).toFixed(1);
                    return diff >= 0 
                      ? `+${formatPrice(diff)} (+${percent}%) above list`
                      : `${formatPrice(diff)} (${percent}%) below list`;
                  })()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Earnest Money Deposit ($)</Label>
              <Input
                type="number"
                placeholder="15000"
                value={earnestMoney}
                onChange={(e) => setEarnestMoney(e.target.value)}
              />
              {offerAmount && earnestMoney && (
                <p className="text-xs text-muted-foreground">
                  {((parseFloat(earnestMoney) / parseFloat(offerAmount)) * 100).toFixed(1)}% of offer
                </p>
              )}
            </div>
          </div>

          {/* Closing Cost Credit */}
          <div className="space-y-2">
            <Label>Closing Cost Credit Request ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={closingCostCredit}
              onChange={(e) => setClosingCostCredit(e.target.value)}
            />
          </div>

          {/* Closing Date */}
          <div className="space-y-2">
            <Label>Proposed Closing Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !closingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {closingDate ? format(closingDate, "PPP") : "Select date..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={closingDate}
                  onSelect={setClosingDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Contingencies */}
          <div className="space-y-2">
            <Label>Contingencies</Label>
            <div className="grid grid-cols-2 gap-3">
              {CONTINGENCY_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={contingencies.includes(option.id)}
                    onCheckedChange={(checked) =>
                      handleContingencyChange(option.id, !!checked)
                    }
                  />
                  <label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any special terms or conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPropertyId || !offerAmount || !earnestMoney || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Draft Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
