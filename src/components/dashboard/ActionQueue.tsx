import { AlertCircle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActionItem {
  id: string;
  type: "urgent" | "pending" | "completed";
  title: string;
  description: string;
  buyerId?: string;
  buyerName?: string;
}

interface ActionQueueProps {
  onActionClick: (action: ActionItem) => void;
}

// Mock action items
const mockActions: ActionItem[] = [
  {
    id: "1",
    type: "urgent",
    title: "AI Content Pending",
    description: "Property analysis needs approval",
    buyerId: "1",
    buyerName: "Sarah Johnson",
  },
  {
    id: "2",
    type: "urgent",
    title: "Deadline Tomorrow",
    description: "Inspection contingency expires",
    buyerId: "2",
    buyerName: "Michael Chen",
  },
  {
    id: "3",
    type: "pending",
    title: "Missing Documents",
    description: "Pre-approval letter needed",
    buyerId: "3",
    buyerName: "Emily Rodriguez",
  },
  {
    id: "4",
    type: "pending",
    title: "Review Requested",
    description: "Offer strategy ready for review",
    buyerId: "1",
    buyerName: "Sarah Johnson",
  },
  {
    id: "5",
    type: "completed",
    title: "Content Approved",
    description: "Stage 2 orientation approved",
    buyerId: "2",
    buyerName: "Michael Chen",
  },
];

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
  const urgentCount = mockActions.filter((a) => a.type === "urgent").length;
  const pendingCount = mockActions.filter((a) => a.type === "pending").length;

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      {/* Action Items */}
      <div className="divide-y divide-border/30">
        {mockActions.map((action) => {
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