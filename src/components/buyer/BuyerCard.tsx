import { ChevronRight, Calendar, Mail, Phone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STAGES, type Buyer } from "@/types";
import { cn } from "@/lib/utils";

interface BuyerCardProps {
  buyer: Buyer;
  onSelect: () => void;
}

export function BuyerCard({ buyer, onSelect }: BuyerCardProps) {
  const stage = STAGES[buyer.currentStage];
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const stageColors = {
    0: "bg-stage-0 text-primary-foreground",
    1: "bg-stage-1 text-white",
    2: "bg-stage-2 text-white",
    3: "bg-stage-3 text-accent-foreground",
    4: "bg-stage-4 text-white",
    5: "bg-stage-5 text-white",
  };

  return (
    <Card className="group hover:shadow-elevated transition-all duration-300 cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {buyer.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              {buyer.email}
            </div>
            {buyer.phone && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {buyer.phone}
              </div>
            )}
          </div>
          <Badge className={cn("font-medium", stageColors[buyer.currentStage])}>
            {stage.icon} Stage {buyer.currentStage}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {stage.title}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {formatDate(buyer.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Active {formatDate(buyer.lastActivity)}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="group-hover:bg-secondary">
            Open
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full gradient-accent transition-all duration-500 rounded-full"
            style={{ width: `${((buyer.currentStage + 1) / 6) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
