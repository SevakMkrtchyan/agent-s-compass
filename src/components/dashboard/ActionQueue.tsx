import { AlertCircle, Clock, FileWarning, CheckCircle2, ChevronRight } from "lucide-react";
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
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-l-destructive",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-l-warning",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-l-muted-foreground",
  },
};

export function ActionQueue({ onActionClick }: ActionQueueProps) {
  const urgentCount = mockActions.filter((a) => a.type === "urgent").length;
  const pendingCount = mockActions.filter((a) => a.type === "pending").length;

  return (
    <div className="bg-card rounded-xl border shadow-sm h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground mb-2">Action Queue</h3>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            {urgentCount} urgent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {pendingCount} pending
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {mockActions.map((action) => {
            const config = typeConfig[action.type];
            const Icon = config.icon;

            return (
              <button
                key={action.id}
                onClick={() => onActionClick(action)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-l-4 transition-all",
                  "hover:shadow-sm hover:bg-secondary/30",
                  config.border,
                  config.bg
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                    {action.buyerName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.buyerName}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
