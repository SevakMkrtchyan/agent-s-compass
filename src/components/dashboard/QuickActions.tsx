import { Plus, ArrowRight, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  selectedCount: number;
  onOpenWorkspace: () => void;
  onAdvanceStage: () => void;
  onApproveContent: () => void;
  onAssignBuyer: () => void;
}

export function QuickActions({
  selectedCount,
  onOpenWorkspace,
  onAdvanceStage,
  onApproveContent,
  onAssignBuyer,
}: QuickActionsProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-card border shadow-float rounded-full px-2 py-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full"
          onClick={onAssignBuyer}
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">New Buyer</span>
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button
          variant={hasSelection ? "default" : "ghost"}
          size="sm"
          className={cn("gap-2 rounded-full", !hasSelection && "opacity-50")}
          disabled={!hasSelection}
          onClick={onOpenWorkspace}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Open Workspace</span>
        </Button>

        <Button
          variant={hasSelection ? "secondary" : "ghost"}
          size="sm"
          className={cn("gap-2 rounded-full", !hasSelection && "opacity-50")}
          disabled={!hasSelection}
          onClick={onAdvanceStage}
        >
          <ArrowRight className="h-4 w-4" />
          <span className="hidden sm:inline">Advance Stage</span>
          {hasSelection && (
            <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </Button>

        <Button
          variant={hasSelection ? "secondary" : "ghost"}
          size="sm"
          className={cn("gap-2 rounded-full", !hasSelection && "opacity-50")}
          disabled={!hasSelection}
          onClick={onApproveContent}
        >
          <CheckCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Approve AI</span>
        </Button>
      </div>
    </div>
  );
}
