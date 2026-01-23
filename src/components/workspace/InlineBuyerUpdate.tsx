import { useState } from "react";
import { AlertTriangle, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export type MissingField = "pre_approval_amount" | "budget_max" | "budget_min";

interface InlineBuyerUpdateProps {
  buyerId: string;
  buyerName: string;
  missingField: MissingField;
  onSave: (field: MissingField, value: number) => Promise<void>;
  onSaveAndGenerate: (field: MissingField, value: number) => Promise<void>;
  isUpdating: boolean;
}

const FIELD_CONFIG: Record<MissingField, { label: string; placeholder: string; helpText: string }> = {
  pre_approval_amount: {
    label: "Pre-Approval Amount",
    placeholder: "e.g., 450000",
    helpText: "Enter the pre-approval amount from the lender",
  },
  budget_max: {
    label: "Maximum Budget",
    placeholder: "e.g., 500000",
    helpText: "Enter the buyer's maximum budget",
  },
  budget_min: {
    label: "Minimum Budget",
    placeholder: "e.g., 300000",
    helpText: "Enter the buyer's minimum budget",
  },
};

export function InlineBuyerUpdate({
  buyerId,
  buyerName,
  missingField,
  onSaveAndGenerate,
  isUpdating,
}: InlineBuyerUpdateProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const config = FIELD_CONFIG[missingField];
  const firstName = buyerName.split(" ")[0];

  const formatCurrency = (input: string): string => {
    // Remove non-numeric characters
    const numericValue = input.replace(/[^0-9]/g, "");
    if (!numericValue) return "";
    
    // Format with commas
    return Number(numericValue).toLocaleString();
  };

  const parseCurrency = (input: string): number | null => {
    const numericValue = input.replace(/[^0-9]/g, "");
    if (!numericValue) return null;
    return Number(numericValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setValue(formatted);
    setError(null);
  };

  const handleSaveAndGenerate = async () => {
    const numericValue = parseCurrency(value);
    
    if (numericValue === null || numericValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (numericValue < 10000) {
      setError("Amount seems too low. Did you forget zeros?");
      return;
    }

    try {
      await onSaveAndGenerate(missingField, numericValue);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-600" />
        <span>Updated {firstName}'s {config.label.toLowerCase()}. Generating...</span>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4 max-w-md">
      {/* Warning Message */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            I need {firstName}'s {config.label.toLowerCase()} to continue.
          </p>
          <p className="text-xs text-muted-foreground">
            {config.helpText}
          </p>
        </div>
      </div>

      {/* Inline Form */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={config.placeholder}
            value={value}
            onChange={handleChange}
            disabled={isUpdating}
            className={cn(
              "pl-7 h-10",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>
        <Button
          onClick={handleSaveAndGenerate}
          disabled={!value || isUpdating}
          size="sm"
          className="h-10 px-4"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save & Generate"
          )}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Link to Full Profile */}
      <div className="pt-2">
        <Link
          to={`/buyers?edit=${buyerId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Or update {firstName}'s full profile
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// Utility to detect missing data from AI response
export function detectMissingField(content: string): MissingField | null {
  const lowerContent = content.toLowerCase();
  
  // Patterns that indicate missing pre-approval amount
  if (
    lowerContent.includes("pre-approval amount") ||
    lowerContent.includes("preapproval amount") ||
    lowerContent.includes("need") && lowerContent.includes("approval") && lowerContent.includes("amount")
  ) {
    return "pre_approval_amount";
  }

  // Patterns for missing budget
  if (
    (lowerContent.includes("maximum budget") || lowerContent.includes("budget max")) &&
    (lowerContent.includes("need") || lowerContent.includes("missing") || lowerContent.includes("provide"))
  ) {
    return "budget_max";
  }

  if (
    (lowerContent.includes("minimum budget") || lowerContent.includes("budget min")) &&
    (lowerContent.includes("need") || lowerContent.includes("missing") || lowerContent.includes("provide"))
  ) {
    return "budget_min";
  }

  return null;
}
