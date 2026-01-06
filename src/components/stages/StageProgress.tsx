import { cn } from "@/lib/utils";
import { STAGES, type Stage } from "@/types";
import { Check } from "lucide-react";

interface StageProgressProps {
  currentStage: Stage;
  onStageClick?: (stage: Stage) => void;
  interactive?: boolean;
}

export function StageProgress({ currentStage, onStageClick, interactive = false }: StageProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-border -translate-y-1/2 z-0" />
        <div 
          className="absolute left-0 top-1/2 h-1 gradient-accent -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentStage / 5) * 100}%` }}
        />

        {STAGES.map((stage) => {
          const isCompleted = stage.stage < currentStage;
          const isCurrent = stage.stage === currentStage;
          const isLocked = stage.stage > currentStage;

          return (
            <button
              key={stage.stage}
              onClick={() => interactive && !isLocked && onStageClick?.(stage.stage)}
              disabled={!interactive || isLocked}
              className={cn(
                "relative z-10 flex flex-col items-center gap-2 transition-all duration-300",
                interactive && !isLocked && "cursor-pointer hover:scale-105",
                isLocked && "opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-accent border-accent text-accent-foreground",
                  isCurrent && "bg-primary border-primary text-primary-foreground shadow-elevated",
                  isLocked && "bg-card border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-lg">{stage.icon}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-20 leading-tight",
                  isCurrent && "text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {stage.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">
            Stage {currentStage}: {STAGES[currentStage].title}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentStage}/5
          </span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full gradient-accent transition-all duration-500 rounded-full"
            style={{ width: `${((currentStage + 1) / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
