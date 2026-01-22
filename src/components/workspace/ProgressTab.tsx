import { useState } from "react";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Home, 
  DollarSign,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Lock,
  Eye,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";
import { STAGES } from "@/types";
import type { StageGroup, SystemEvent } from "@/types/conversation";
import { useArtifacts, type Artifact } from "@/hooks/useArtifacts";

interface ProgressTabProps {
  stages: StageGroup[];
  currentStage: Stage;
  buyerName: string;
  buyerId: string;
  onPrefillAgentGPT: (command: string) => void;
  onOpenDetails: () => void;
}

export function ProgressTab({
  stages,
  currentStage,
  buyerName,
  buyerId,
  onPrefillAgentGPT,
}: ProgressTabProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const currentStageData = STAGES[currentStage];

  // Fetch artifacts from database
  const { artifacts, isLoading: artifactsLoading } = useArtifacts(buyerId);

  // Extract system events from stages (keep this for activity log)
  const systemEvents = stages.flatMap(stage =>
    stage.items.filter(item => item.type === "system-event")
  ) as SystemEvent[];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleStageClick = (stage: StageGroup) => {
    const stageInfo = STAGES[stage.stageId];
    const command = `Generate ${stageInfo.title.toLowerCase()} strategy and next steps for ${buyerName} - include 3-4 actionable recommendations`;
    onPrefillAgentGPT(command);
  };

  const handleAdvanceStage = () => {
    const nextStageIndex = currentStage + 1;
    if (nextStageIndex <= 5) {
      const nextStage = STAGES[nextStageIndex as Stage];
      const command = `Check CA compliance prerequisites and advance ${buyerName} from ${currentStageData.title} to ${nextStage.title}. Verify all required documents are complete (BR-11, disclosures) and generate a stage transition confirmation draft for the buyer.`;
      onPrefillAgentGPT(command);
    }
  };

  const handleArtifactClick = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
  };

  const handleActivityClick = (event: SystemEvent) => {
    const command = `Provide context and next actions for: "${event.title}" - ${event.description || "Analyze this activity and suggest follow-up steps"}`;
    onPrefillAgentGPT(command);
  };

  const handleGenerateNextSteps = () => {
    const command = `Generate 3-4 prioritized next actions for ${buyerName} in the ${currentStageData.title} stage. Include one artifact draft, one internal analysis, and stage-specific recommendations.`;
    onPrefillAgentGPT(command);
  };

  return (
    <ScrollArea className="h-full">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12 bg-[#f9fafb]">
        
        {/* Current Stage Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>
            Current Stage
          </p>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl">{currentStageData.icon}</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-medium" style={{ color: '#111827' }}>
                {currentStageData.title}
              </h2>
              <p className="text-base mt-1" style={{ color: '#6b7280' }}>
                {buyerName} is in the {currentStageData.title.toLowerCase()} phase
              </p>
            </div>
          </div>

          {/* Action Buttons - Plain text style */}
          <div className="flex flex-wrap gap-6">
            <button
              onClick={handleGenerateNextSteps}
              className="inline-flex items-center gap-2 text-base transition-colors hover:underline underline-offset-4"
              style={{ color: '#374151' }}
            >
              <Sparkles className="h-4 w-4" />
              Generate next steps
            </button>
            {currentStage < 5 && (
              <button
                onClick={handleAdvanceStage}
                className="inline-flex items-center gap-2 text-base transition-colors hover:underline underline-offset-4"
                style={{ color: '#374151' }}
              >
                <ArrowUpRight className="h-4 w-4" />
                Advance stage
              </button>
            )}
          </div>
        </div>

        <hr className="max-w-3xl mb-10" style={{ borderColor: '#e5e7eb' }} />

        {/* Stage Journey - Interactive Timeline */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
            Stage Journey
          </p>
          <div className="space-y-0">
            {stages.map((stage) => {
              const stageInfo = STAGES[stage.stageId];
              const isComplete = stage.status === "completed";
              const isCurrent = stage.status === "current";
              const isLocked = stage.status === "locked";

              return (
                <button
                  key={stage.stageId}
                  onClick={() => !isLocked && handleStageClick(stage)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center justify-between py-4 text-left group transition-colors",
                    isLocked && "opacity-40 cursor-not-allowed"
                  )}
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-8 w-8 flex items-center justify-center text-lg",
                      isComplete && "opacity-60",
                      isCurrent && "opacity-100"
                    )}>
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5" style={{ color: '#10b981' }} />
                      ) : (
                        <span>{stageInfo.icon}</span>
                      )}
                    </div>
                    <div>
                      <span 
                        className={cn(
                          "text-base font-medium",
                          isCurrent && "font-semibold"
                        )}
                        style={{ color: isCurrent ? '#111827' : '#374151' }}
                      >
                        {stageInfo.title}
                      </span>
                      {stage.startedAt && (
                        <p className="text-sm" style={{ color: '#9ca3af' }}>
                          {stage.completedAt 
                            ? `Completed ${formatDate(stage.completedAt)}`
                            : `Started ${formatDate(stage.startedAt)}`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  {!isLocked && (
                    <ChevronRight 
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                      style={{ color: '#9ca3af' }} 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Saved Artifacts */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
              Saved Artifacts
            </p>
            {artifactsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#9ca3af' }} />
            ) : (
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {artifacts?.filter(a => a.visibility === "shared").length || 0} shared with buyer
              </span>
            )}
          </div>
          
          {artifactsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : artifacts && artifacts.length > 0 ? (
            <div className="space-y-0">
              {artifacts.slice(0, 10).map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => handleArtifactClick(artifact)}
                  className="w-full flex items-start justify-between py-4 text-left group transition-colors"
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {artifact.visibility === "shared" ? (
                      <Eye className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#10b981' }} />
                    ) : (
                      <Lock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#9ca3af' }} />
                    )}
                    <div className="min-w-0">
                      <p className="text-base" style={{ color: '#374151' }}>
                        {artifact.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm" style={{ color: '#9ca3af' }}>
                          {formatTime(new Date(artifact.created_at))}
                        </span>
                        <span className="text-sm" style={{ color: artifact.visibility === "shared" ? '#10b981' : '#9ca3af' }}>
                          · {artifact.visibility === "shared" ? "Visible to buyer" : "Internal only"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink 
                    className="h-4 w-4 ml-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                    style={{ color: '#9ca3af' }} 
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm py-4" style={{ color: '#9ca3af' }}>
              No artifacts saved yet. Generate content in AgentGPT and save it here.
            </p>
          )}

          {artifacts && artifacts.length > 10 && (
            <button
              onClick={() => onPrefillAgentGPT("Show all saved artifacts and their status")}
              className="mt-4 text-sm transition-colors hover:underline underline-offset-4"
              style={{ color: '#6b7280' }}
            >
              View all {artifacts.length} artifacts →
            </button>
          )}
        </div>

        {/* Artifact Preview Modal */}
        {selectedArtifact && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedArtifact(null)}
          >
            <div 
              className="bg-white max-w-2xl w-full max-h-[80vh] overflow-auto p-8"
              style={{ borderRadius: '2px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {selectedArtifact.visibility === "shared" ? (
                    <Eye className="h-4 w-4" style={{ color: '#10b981' }} />
                  ) : (
                    <Lock className="h-4 w-4" style={{ color: '#9ca3af' }} />
                  )}
                  <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                    {selectedArtifact.visibility === "shared" ? "Shared with buyer" : "Internal only"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="text-sm hover:underline"
                  style={{ color: '#6b7280' }}
                >
                  Close
                </button>
              </div>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#111827' }}>
                {selectedArtifact.title}
              </h3>
              <div className="prose prose-sm max-w-none" style={{ color: '#374151' }}>
                <p className="whitespace-pre-wrap leading-relaxed">{selectedArtifact.content}</p>
              </div>
              <p className="text-sm mt-6" style={{ color: '#9ca3af' }}>
                Created {formatTime(new Date(selectedArtifact.created_at))}
                {selectedArtifact.shared_at && ` · Shared ${formatTime(new Date(selectedArtifact.shared_at))}`}
              </p>
              <div className="mt-8 pt-6 flex gap-4" style={{ borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => {
                    onPrefillAgentGPT(`Edit and update this artifact: "${selectedArtifact.title}"`);
                    setSelectedArtifact(null);
                  }}
                  className="text-sm hover:underline underline-offset-4"
                  style={{ color: '#374151' }}
                >
                  Edit with AgentGPT
                </button>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="text-sm"
                  style={{ color: '#9ca3af' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log */}
        {systemEvents.length > 0 && (
          <div className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
              Activity Log
            </p>
            <div className="space-y-0">
              {systemEvents.slice(0, 10).map((event) => {
                const getEventIcon = () => {
                  switch (event.eventType) {
                    case "stage-advanced": 
                      return <CheckCircle className="h-4 w-4" style={{ color: '#10b981' }} />;
                    case "offer-submitted": 
                      return <DollarSign className="h-4 w-4" style={{ color: '#6366f1' }} />;
                    case "document-uploaded": 
                      return <FileText className="h-4 w-4" style={{ color: '#6b7280' }} />;
                    case "property-added": 
                      return <Home className="h-4 w-4" style={{ color: '#6366f1' }} />;
                    default: 
                      return <Clock className="h-4 w-4" style={{ color: '#9ca3af' }} />;
                  }
                };

                return (
                  <button
                    key={event.id}
                    onClick={() => handleActivityClick(event)}
                    className="w-full flex items-center justify-between py-3 text-left group transition-colors"
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    <div className="flex items-center gap-4">
                      {getEventIcon()}
                      <div>
                        <span className="text-base" style={{ color: '#374151' }}>
                          {event.title}
                        </span>
                        {event.description && (
                          <p className="text-sm" style={{ color: '#9ca3af' }}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: '#d1d5db' }}>
                        {formatTime(event.timestamp)}
                      </span>
                      <ChevronRight 
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                        style={{ color: '#9ca3af' }} 
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="max-w-3xl text-center pt-8">
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Progress is the canonical system-of-record. All changes flow through AgentGPT.
          </p>
        </div>

      </div>
    </ScrollArea>
  );
}
