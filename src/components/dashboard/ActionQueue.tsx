import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActionQueue, type ActionItem } from "@/hooks/useDashboardData";
import { Loader2 } from "lucide-react";

interface ActionQueueProps {
  onActionClick: (action: ActionItem) => void;
}

const typeConfig = {
  urgent: {
    label: "Urgent",
    dotColor: "bg-red-500",
    textColor: "text-red-600",
  },
  pending: {
    label: "Pending",
    dotColor: "bg-amber-500",
    textColor: "text-amber-600",
  },
  completed: {
    label: "Completed",
    dotColor: "bg-muted-foreground/40",
    textColor: "text-muted-foreground",
  },
};

export function ActionQueue({ onActionClick }: ActionQueueProps) {
  const { data: actions = [], isLoading } = useActionQueue();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-foreground font-medium mb-1">All caught up!</p>
        <p className="text-muted-foreground text-sm">No urgent items in your pipeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      {/* Action Items */}
      <div className="divide-y divide-border/30">
        {actions.map((action) => {
          const config = typeConfig[action.type];

          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action)}
              className="w-full text-left px-4 py-3.5 transition-colors hover:bg-muted/30 group"
            >
              <div className="flex items-start gap-3">
                {/* Priority Dot */}
                <div className="pt-1.5">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", config.dotColor)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-[10px] font-medium uppercase tracking-wider", config.textColor)}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {action.description}
                  </p>
                  {action.buyerName && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {action.buyerName}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1 group-hover:text-muted-foreground transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
