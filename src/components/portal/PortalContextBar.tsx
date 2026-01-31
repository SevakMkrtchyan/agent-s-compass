import { cn } from "@/lib/utils";
import type { PortalBuyer } from "@/pages/BuyerPortal";

interface PortalContextBarProps {
  buyer: PortalBuyer;
}

// Stage order for progress calculation
const STAGE_ORDER = [
  "Readiness & Expectations",
  "Financing & Capability",
  "Market Intelligence & Search Setup",
  "Touring, Filtering & Convergence",
  "Offer Strategy & Submission",
  "Negotiation & Contract",
  "Due Diligence & Inspections",
  "Appraisal & Lending",
  "Final Walkthrough & Preparation",
  "Closing & Post-Close",
];

function getStageNumber(stageName: string | null | undefined): number {
  const index = STAGE_ORDER.indexOf(stageName || "");
  return index >= 0 ? index + 1 : 1;
}

export function PortalContextBar({ buyer }: PortalContextBarProps) {
  const currentStageNumber = getStageNumber(buyer.current_stage);
  const totalStages = STAGE_ORDER.length;
  const progressPercent = (currentStageNumber / totalStages) * 100;
  const firstName = buyer.name.split(" ")[0];

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        {/* Top row: Name and Stage */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{firstName}'s Journey</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Stage {currentStageNumber} of {totalStages}
            </span>
          </div>
        </div>

        {/* Stage name */}
        <p className="text-xs text-muted-foreground/70 mb-2">
          {buyer.current_stage || "Getting Started"}
        </p>

        {/* Progress bar */}
        <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
