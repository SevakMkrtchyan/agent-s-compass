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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";
import { STAGES } from "@/types";
import type { StageGroup, AIExplanation, SystemEvent } from "@/types/conversation";

interface ProgressTabProps {
  stages: StageGroup[];
  currentStage: Stage;
  buyerName: string;
  onPrefillAgentGPT: (command: string) => void;
  onOpenDetails: () => void;
}

export function ProgressTab({
  stages,
  currentStage,
  buyerName,
  onPrefillAgentGPT,
}: ProgressTabProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<AIExplanation | null>(null);
  const currentStageData = STAGES[currentStage];

  // Extract approved artifacts
  const approvedArtifacts = stages.flatMap(stage => 
    stage.items.filter(item => 
      item.type === "ai-explanation" && 
      (item as AIExplanation).approvalStatus === "approved"
    )
  ) as AIExplanation[];

  // Extract system events
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

  const handleArtifactClick = (artifact: AIExplanation) => {
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

        {/* Published Artifacts */}
        {approvedArtifacts.length > 0 && (
          <div className="max-w-3xl mb-12">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                Published Artifacts
              </p>
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {approvedArtifacts.length} visible to buyer
              </span>
            </div>
            
            <div className="space-y-0">
              {approvedArtifacts.slice(0, 5).map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => handleArtifactClick(artifact)}
                  className="w-full flex items-start justify-between py-4 text-left group transition-colors"
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#10b981' }} />
                    <div className="min-w-0">
                      <p className="text-base line-clamp-2" style={{ color: '#374151' }}>
                        {artifact.content.slice(0, 100)}...
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                        Published {formatTime(artifact.approvedAt || artifact.timestamp)}
                      </p>
                    </div>
                  </div>
                  <ExternalLink 
                    className="h-4 w-4 ml-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                    style={{ color: '#9ca3af' }} 
                  />
                </button>
              ))}
            </div>

            {approvedArtifacts.length > 5 && (
              <button
                onClick={() => onPrefillAgentGPT("Show all published artifacts and their status")}
                className="mt-4 text-sm transition-colors hover:underline underline-offset-4"
                style={{ color: '#6b7280' }}
              >
                View all {approvedArtifacts.length} artifacts →
              </button>
            )}
          </div>
        )}

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
                <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  Published Artifact
                </p>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="text-sm hover:underline"
                  style={{ color: '#6b7280' }}
                >
                  Close
                </button>
              </div>
              <div className="prose prose-sm max-w-none" style={{ color: '#374151' }}>
                <p className="whitespace-pre-wrap leading-relaxed">{selectedArtifact.content}</p>
              </div>
              <div className="mt-8 pt-6 flex gap-4" style={{ borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => {
                    onPrefillAgentGPT(`Edit and update this artifact: "${selectedArtifact.content.slice(0, 50)}..."`);
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
