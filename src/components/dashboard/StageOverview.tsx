import { cn } from "@/lib/utils";
import { useBuyersByStage } from "@/hooks/useDashboardData";
import { Loader2 } from "lucide-react";

interface StageOverviewProps {
  selectedStage: number | null;
  onStageClick: (stage: number | null) => void;
}

const stageColors = [
  "bg-primary",
  "bg-info",
  "bg-purple-500",
  "bg-accent",
  "bg-success",
  "bg-pink-500",
  "bg-blue-400",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export function StageOverview({ selectedStage, onStageClick }: StageOverviewProps) {
  const { data: stageDistribution = [], isLoading } = useBuyersByStage();
  
  const totalBuyers = stageDistribution.reduce((sum, s) => sum + s.count, 0);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Pipeline Overview</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{totalBuyers} total buyers</span>
          {selectedStage !== null && (
            <button
              onClick={() => onStageClick(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Bar */}
      <div className="h-3 rounded-full bg-muted flex overflow-hidden mb-4">
        {stageDistribution.map((stage, idx) => {
          const percentage = totalBuyers > 0 ? (stage.count / totalBuyers) * 100 : 0;
          if (percentage === 0) return null;
          return (
            <button
              key={stage.stageNumber}
              onClick={() => onStageClick(selectedStage === stage.stageNumber ? null : stage.stageNumber)}
              className={cn(
                stageColors[idx],
                "h-full transition-all hover:opacity-80",
                selectedStage === stage.stageNumber && "ring-2 ring-foreground ring-offset-1"
              )}
              style={{ width: `${percentage}%` }}
              title={`Stage ${stage.stageNumber}: ${stage.count} buyers`}
            />
          );
        })}
      </div>

      {/* Stage Labels - Show first 6 for compact view */}
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
        {stageDistribution.map((stage, idx) => (
          <button
            key={stage.stageNumber}
            onClick={() => onStageClick(selectedStage === stage.stageNumber ? null : stage.stageNumber)}
            className={cn(
              "text-center p-2 rounded-lg transition-all",
              selectedStage === stage.stageNumber
                ? "bg-secondary ring-2 ring-primary"
                : "hover:bg-secondary/50"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full mx-auto mb-1.5",
                stageColors[idx]
              )}
            />
            <p className="text-lg font-bold text-foreground">{stage.count}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {stage.stageName}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
