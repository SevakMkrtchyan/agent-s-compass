import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface PortalActionButtonProps {
  label: string;
  description?: string;
  onClick?: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "acknowledge";
  disabled?: boolean;
  completed?: boolean;
}

export function PortalActionButton({
  label,
  description,
  onClick,
  variant = "primary",
  disabled = false,
  completed = false,
}: PortalActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading || completed || !onClick) return;
    
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "bg-muted text-foreground hover:bg-muted/80",
        variant === "acknowledge" && "bg-transparent border border-border text-foreground hover:bg-muted/50",
        (disabled || isLoading) && "opacity-50 cursor-not-allowed"
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : null}
      <span>{label}</span>
    </button>
  );
}

// Selection buttons for choosing between options
interface PortalSelectionProps {
  options: Array<{ value: string; label: string; description?: string }>;
  selected?: string;
  onSelect?: (value: string) => void;
}

export function PortalSelection({ options, selected, onSelect }: PortalSelectionProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect?.(option.value)}
          className={cn(
            "w-full text-left px-4 py-3 rounded-lg border transition-all",
            selected === option.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selected === option.value ? "border-primary" : "border-muted-foreground/30"
            )}>
              {selected === option.value && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{option.label}</p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Acknowledgement checkbox
interface PortalAcknowledgeProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function PortalAcknowledge({ label, checked = false, onChange }: PortalAcknowledgeProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className={cn(
        "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
        checked 
          ? "bg-primary border-primary" 
          : "border-muted-foreground/30 group-hover:border-primary/50"
      )}>
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <span className="text-sm text-foreground/80 leading-relaxed">{label}</span>
    </label>
  );
}
