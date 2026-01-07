import { cn } from "@/lib/utils";
import { STAGES } from "@/types";
import { Buyer } from "@/types";

interface StageOverviewProps {
  buyers: Buyer[];
  selectedStage: number | null;
  onStageClick: (stage: number | null) => void;
}

export function StageOverview({ buyers, selectedStage, onStageClick }: StageOverviewProps) {
  const totalBuyers = buyers.length;

  const stageColors = [
    "bg-primary",
    "bg-info",
    "bg-purple-500",
    "bg-accent",
    "bg-success",
    "bg-pink-500",
  ];

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Pipeline Overview</h3>
        {selectedStage !== null && (
          <button
            onClick={() => onStageClick(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Horizontal Bar */}
      <div className="h-3 rounded-full bg-muted flex overflow-hidden mb-4">
        {STAGES.map((stage, idx) => {
          const count = buyers.filter((b) => b.currentStage === stage.stage).length;
          const percentage = totalBuyers > 0 ? (count / totalBuyers) * 100 : 0;
          if (percentage === 0) return null;
          return (
            <button
              key={stage.stage}
              onClick={() => onStageClick(selectedStage === stage.stage ? null : stage.stage)}
              className={cn(
                stageColors[idx],
                "h-full transition-all hover:opacity-80",
                selectedStage === stage.stage && "ring-2 ring-foreground ring-offset-1"
              )}
              style={{ width: `${percentage}%` }}
              title={`Stage ${stage.stage}: ${count} buyers`}
            />
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="grid grid-cols-6 gap-2">
        {STAGES.map((stage, idx) => {
          const count = buyers.filter((b) => b.currentStage === stage.stage).length;
          return (
            <button
              key={stage.stage}
              onClick={() => onStageClick(selectedStage === stage.stage ? null : stage.stage)}
              className={cn(
                "text-center p-2 rounded-lg transition-all",
                selectedStage === stage.stage
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
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {stage.title.split(" ").slice(0, 2).join(" ")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
