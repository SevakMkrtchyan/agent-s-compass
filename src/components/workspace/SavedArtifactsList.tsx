import { useState } from "react";
import { format } from "date-fns";
import { Eye, Lock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/hooks/useArtifacts";

interface SavedArtifactsListProps {
  artifacts: Artifact[];
  isLoading: boolean;
  onViewArtifact: (artifact: Artifact) => void;
}

export function SavedArtifactsList({
  artifacts,
  isLoading,
  onViewArtifact,
}: SavedArtifactsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No saved artifacts yet</p>
        <p className="text-xs mt-1">Generate and save artifacts using the actions above</p>
      </div>
    );
  }

  // Show first 3 or all if expanded
  const displayedArtifacts = isExpanded ? artifacts : artifacts.slice(0, 3);
  const hasMore = artifacts.length > 3;

  // Group by artifact type for display
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "agent-generated": "Generated",
      "budget-bands": "Budget Bands",
      "financing-brief": "Financing Brief",
      "offer-strategy": "Offer Strategy",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-2">
      {displayedArtifacts.map((artifact) => {
        const isShared = artifact.visibility === "shared";
        const createdDate = new Date(artifact.created_at);

        return (
          <button
            key={artifact.id}
            onClick={() => onViewArtifact(artifact)}
            className={cn(
              "w-full text-left p-3 rounded-lg border border-border/30 bg-background/50",
              "hover:bg-muted/50 hover:border-border/50 transition-all",
              "group"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {artifact.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={isShared ? "default" : "secondary"}
                    className="h-5 text-[10px] gap-1"
                  >
                    {isShared ? (
                      <Eye className="h-2.5 w-2.5" />
                    ) : (
                      <Lock className="h-2.5 w-2.5" />
                    )}
                    {isShared ? "Shared" : "Internal"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(createdDate, "MMM d")}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                View →
              </span>
            </div>
          </button>
        );
      })}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              View all {artifacts.length} artifacts
            </>
          )}
        </Button>
      )}
    </div>
  );
}
