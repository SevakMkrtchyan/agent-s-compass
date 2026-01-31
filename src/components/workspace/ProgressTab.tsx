import { useState, useMemo, forwardRef } from "react";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Home, 
  DollarSign,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ExternalLink,
  Lock,
  Eye,
  Loader2,
  Circle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";
import type { StageGroup, SystemEvent } from "@/types/conversation";
import { useArtifacts, type Artifact } from "@/hooks/useArtifacts";
import { useStages, type DbStage } from "@/hooks/useStages";
import { useStageCompletion } from "@/hooks/useStageCompletion";
import { useBuyers } from "@/hooks/useBuyers";
import { useToast } from "@/hooks/use-toast";
import { AgentBudgetStrategyCard } from "./AgentBudgetStrategyCard";
import { ArtifactViewerDialog } from "./ArtifactViewerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProgressTabProps {
  stages: StageGroup[];
  currentStage: Stage;
  buyerName: string;
  buyerId: string;
  onPrefillAgentGPT: (command: string) => void;
  onOpenDetails: () => void;
}

export const ProgressTab = forwardRef<HTMLDivElement, ProgressTabProps>(function ProgressTab({
  stages,
  currentStage,
  buyerName,
  buyerId,
  onPrefillAgentGPT,
}, ref) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [artifactDialogOpen, setArtifactDialogOpen] = useState(false);
  const [showAllArtifacts, setShowAllArtifacts] = useState(false);
  const [stageJumpTarget, setStageJumpTarget] = useState<DbStage | null>(null);
  const { toast } = useToast();

  // Fetch artifacts from database
  const { 
    artifacts, 
    isLoading: artifactsLoading, 
    shareArtifact, 
    deleteArtifact,
    isSharing,
    isDeleting 
  } = useArtifacts(buyerId);
  
  // Fetch ALL stages from database ordered by stage_number
  const { data: allDbStages, isLoading: stagesLoading } = useStages();
  
  // Get current stage data from database (by stage number)
  const currentDbStage = useMemo(() => {
    return allDbStages?.find(s => s.stage_number === currentStage);
  }, [allDbStages, currentStage]);
  
  // Fetch stage completion status
  const { 
    isCriterionCompleted, 
    allCriteriaCompleted, 
    toggleCriterion,
    isLoading: completionLoading 
  } = useStageCompletion(buyerId, currentStage);
  
  // Get buyer mutation for advancing stage
  const { updateBuyer } = useBuyers();

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

  // Filter artifacts to show only recent stages (current stage - 2 to current stage)
  const filteredArtifacts = useMemo(() => {
    if (!artifacts || !allDbStages) return [];
    
    const minStage = Math.max(0, currentStage - 2);
    const maxStage = currentStage;
    
    // Get stage IDs for stages in range
    const stageIdsInRange = allDbStages
      .filter(s => s.stage_number >= minStage && s.stage_number <= maxStage)
      .map(s => s.id);
    
    // Filter artifacts that belong to stages in range (or have no stage_id)
    return artifacts.filter(artifact => {
      if (!artifact.stage_id) return true; // Include artifacts without stage
      return stageIdsInRange.includes(artifact.stage_id);
    });
  }, [artifacts, allDbStages, currentStage]);

  const minDisplayStage = Math.max(0, currentStage - 2);
  const totalArtifactCount = artifacts?.length || 0;

  // Generic stage change handler - can move forward or backward
  const handleStageChange = async (targetStageNumber: number, direction: 'forward' | 'backward' | 'jump') => {
    console.log(`[ProgressTab] Stage change: ${direction}`);
    console.log("[ProgressTab] Current stage:", currentStage);
    console.log("[ProgressTab] Target stage:", targetStageNumber);
    
    if (targetStageNumber < 0 || targetStageNumber > 9) {
      console.log("[ProgressTab] Cannot change: stage out of range");
      return;
    }
    
    // Find target stage name from database
    const targetDbStage = allDbStages?.find(s => s.stage_number === targetStageNumber);
    const targetStageName = targetDbStage?.stage_name;
    
    if (!targetStageName) {
      console.error("[ProgressTab] Target stage not found in database for index:", targetStageNumber);
      toast({
        title: "Stage not found",
        description: `Stage ${targetStageNumber} is not yet configured in the system.`,
        variant: "destructive",
      });
      return;
    }
    
    console.log(`[ProgressTab] Changing to stage: ${targetStageName}`);
    
    try {
      await updateBuyer.mutateAsync({
        id: buyerId,
        current_stage: targetStageName,
      });
      
      console.log("[ProgressTab] Database update successful");
      
      const actionText = direction === 'forward' 
        ? 'advanced to' 
        : direction === 'backward' 
          ? 'moved back to' 
          : 'jumped to';
      
      toast({
        title: direction === 'forward' ? "Stage advanced" : direction === 'backward' ? "Stage moved back" : "Stage changed",
        description: `${buyerName} has been ${actionText} Stage ${targetStageNumber}: ${targetStageName}`,
      });
    } catch (error) {
      console.error("[ProgressTab] Error changing stage:", error);
      toast({
        title: "Error changing stage",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdvanceStage = () => handleStageChange(currentStage + 1, 'forward');
  const handlePreviousStage = () => handleStageChange(currentStage - 1, 'backward');
  
  const handleStageJumpConfirm = async () => {
    if (!stageJumpTarget) return;
    await handleStageChange(stageJumpTarget.stage_number, 'jump');
    setStageJumpTarget(null);
  };

  const handleStageJourneyClick = (stage: DbStage) => {
    // If clicking on current stage, generate strategy instead
    if (stage.stage_number === currentStage) {
      const command = `Generate ${stage.stage_name.toLowerCase()} strategy and next steps for ${buyerName} - include 3-4 actionable recommendations`;
      onPrefillAgentGPT(command);
      return;
    }
    // Otherwise, prompt to jump to that stage
    setStageJumpTarget(stage);
  };

  const handleToggleCriterion = (index: number) => {
    const currentValue = isCriterionCompleted(index);
    toggleCriterion.mutate({ criteriaIndex: index, isCompleted: !currentValue });
  };

  const completionCriteria = currentDbStage?.completion_criteria || [];
  const canAdvanceStage = allCriteriaCompleted(completionCriteria.length);

  const handleArtifactClick = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setArtifactDialogOpen(true);
  };

  const handleShareArtifact = async (artifact: Artifact) => {
    await shareArtifact(artifact.id);
  };

  const handleDeleteArtifact = async (artifact: Artifact) => {
    await deleteArtifact(artifact.id);
    setArtifactDialogOpen(false);
    setSelectedArtifact(null);
  };

  const handleRegenerateArtifact = (artifact: Artifact) => {
    const command = `Regenerate and improve this artifact: "${artifact.title}" - create an updated version with fresh analysis`;
    onPrefillAgentGPT(command);
    setArtifactDialogOpen(false);
    setSelectedArtifact(null);
  };

  const handleActivityClick = (event: SystemEvent) => {
    const command = `Provide context and next actions for: "${event.title}" - ${event.description || "Analyze this activity and suggest follow-up steps"}`;
    onPrefillAgentGPT(command);
  };

  const handleGenerateNextSteps = () => {
    const stageName = currentDbStage?.stage_name || `Stage ${currentStage}`;
    const command = `Generate 3-4 prioritized next actions for ${buyerName} in the ${stageName} stage. Include one artifact draft, one internal analysis, and stage-specific recommendations.`;
    onPrefillAgentGPT(command);
  };

  // Get stage status for Stage Journey
  const getStageStatus = (stageNumber: number): 'completed' | 'current' | 'upcoming' => {
    if (stageNumber < currentStage) return 'completed';
    if (stageNumber === currentStage) return 'current';
    return 'upcoming';
  };

  // Get mock dates for stages (in a real app, these would come from buyer history)
  const getStageDates = (stageNumber: number): { startedAt?: Date; completedAt?: Date } => {
    // For now, use mock dates based on buyer creation
    // In production, this would come from a stage_history table
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (currentStage - stageNumber) * 7);
    
    if (stageNumber < currentStage) {
      const completedDate = new Date(baseDate);
      completedDate.setDate(completedDate.getDate() + 5);
      return { startedAt: baseDate, completedAt: completedDate };
    }
    if (stageNumber === currentStage) {
      return { startedAt: baseDate };
    }
    return {};
  };

  return (
    <ScrollArea className="h-full">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12 bg-[#f9fafb]">
        
        {/* Budget Strategy Section - Top of Progress tab */}
        <AgentBudgetStrategyCard buyerId={buyerId} />

        <hr className="max-w-3xl mb-10" style={{ borderColor: '#e5e7eb' }} />

        {/* Current Stage Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>
            Current Stage
          </p>
          
          {stagesLoading ? (
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 bg-muted/30 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-7 w-64 bg-muted/30 rounded animate-pulse" />
                <div className="h-5 w-96 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
          ) : currentDbStage ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl">{currentDbStage.icon || '📋'}</span>
                <h2 className="text-2xl md:text-3xl font-medium" style={{ color: '#111827' }}>
                  Stage {currentDbStage.stage_number}: {currentDbStage.stage_name}
                </h2>
              </div>
              {currentDbStage.stage_objective && (
                <p className="text-base mb-6" style={{ color: '#6b7280' }}>
                  {currentDbStage.stage_objective}
                </p>
              )}
            </>
          ) : (
            <p className="text-base" style={{ color: '#9ca3af' }}>
              Stage data not available
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-6">
            <button
              onClick={handleGenerateNextSteps}
              className="inline-flex items-center gap-2 text-base transition-colors hover:underline underline-offset-4"
              style={{ color: '#374151' }}
            >
              <Sparkles className="h-4 w-4" />
              Generate next steps
            </button>
            {currentStage > 0 && (
              <button
                onClick={handlePreviousStage}
                disabled={updateBuyer.isPending}
                className="inline-flex items-center gap-2 text-base transition-colors hover:underline underline-offset-4"
                style={{ color: '#9ca3af' }}
              >
                <ArrowDownLeft className="h-4 w-4" />
                {updateBuyer.isPending ? "Moving..." : "Previous stage"}
              </button>
            )}
            {currentStage < 9 && (
              <button
                onClick={handleAdvanceStage}
                disabled={!canAdvanceStage || updateBuyer.isPending}
                className={cn(
                  "inline-flex items-center gap-2 text-base transition-colors",
                  canAdvanceStage 
                    ? "hover:underline underline-offset-4" 
                    : "opacity-50 cursor-not-allowed"
                )}
                style={{ color: canAdvanceStage ? '#374151' : '#9ca3af' }}
              >
                <ArrowUpRight className="h-4 w-4" />
                {updateBuyer.isPending ? "Advancing..." : "Advance stage"}
              </button>
            )}
          </div>
        </div>

        <hr className="max-w-3xl mb-10" style={{ borderColor: '#e5e7eb' }} />

        {/* Stage Completion Section */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
            Stage Completion
          </p>
          
          {stagesLoading || completionLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : completionCriteria.length > 0 ? (
            <div className="space-y-3">
              {completionCriteria.map((criterion, index) => {
                const isCompleted = isCriterionCompleted(index);
                return (
                  <div
                    key={index}
                    onClick={() => handleToggleCriterion(index)}
                    className="w-full flex items-start gap-3 py-2 text-left group transition-colors hover:bg-muted/20 rounded px-2 -mx-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={isCompleted}
                      className="mt-0.5"
                      disabled={toggleCriterion.isPending}
                    />
                    <span 
                      className={cn(
                        "text-base leading-relaxed",
                        isCompleted && "line-through"
                      )}
                      style={{ color: isCompleted ? '#9ca3af' : '#374151' }}
                    >
                      {criterion}
                    </span>
                  </div>
                );
              })}
              
              {/* Progress summary */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-sm" style={{ color: '#9ca3af' }}>
                  {completionCriteria.filter((_, i) => isCriterionCompleted(i)).length} of {completionCriteria.length} completed
                </span>
                {canAdvanceStage && (
                  <span className="text-sm font-medium" style={{ color: '#10b981' }}>
                    ✓ Ready to advance
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm py-2" style={{ color: '#9ca3af' }}>
              No completion criteria defined for this stage.
            </p>
          )}
        </div>

        <hr className="max-w-3xl mb-10" style={{ borderColor: '#e5e7eb' }} />

        {/* Stage Journey - Rebuilt with Database Stages */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
            Stage Journey
          </p>
          
          {stagesLoading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="h-6 w-6 bg-muted/30 rounded-full animate-pulse" />
                  <div className="h-5 w-48 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : allDbStages && allDbStages.length > 0 ? (
            <div className="space-y-0">
              {allDbStages.map((stage) => {
                const status = getStageStatus(stage.stage_number);
                const dates = getStageDates(stage.stage_number);
                const isCompleted = status === 'completed';
                const isCurrent = status === 'current';
                const isUpcoming = status === 'upcoming';

                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStageJourneyClick(stage)}
                    className={cn(
                      "w-full flex items-center justify-between py-4 text-left group transition-colors hover:bg-muted/30 rounded px-2 -mx-2",
                      isCurrent && "bg-muted/20"
                    )}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 flex items-center justify-center text-lg">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" style={{ color: '#10b981' }} />
                        ) : isUpcoming ? (
                          <Circle className="h-5 w-5" style={{ color: '#d1d5db' }} />
                        ) : (
                          <span>{stage.icon || '📋'}</span>
                        )}
                      </div>
                      <div>
                        <span 
                          className={cn(
                            "text-base group-hover:underline underline-offset-4",
                            isCurrent && "font-semibold"
                          )}
                          style={{ color: isCurrent ? '#111827' : isUpcoming ? '#6b7280' : '#374151' }}
                        >
                          Stage {stage.stage_number}: {stage.stage_name}
                        </span>
                        {dates.completedAt && isCompleted && (
                          <p className="text-sm" style={{ color: '#9ca3af' }}>
                            Completed {formatDate(dates.completedAt)}
                          </p>
                        )}
                        {isCurrent && dates.startedAt && (
                          <p className="text-sm font-medium" style={{ color: '#6366f1' }}>
                            Started {formatDate(dates.startedAt)}
                          </p>
                        )}
                        {isUpcoming && (
                          <p className="text-sm" style={{ color: '#9ca3af' }}>
                            Click to jump ahead
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight 
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                      style={{ color: '#9ca3af' }} 
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm py-2" style={{ color: '#9ca3af' }}>
              No stages configured in the system.
            </p>
          )}
          
          {/* Stage Jump Confirmation Dialog */}
          <AlertDialog open={!!stageJumpTarget} onOpenChange={(open) => !open && setStageJumpTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Move buyer to different stage?</AlertDialogTitle>
                <AlertDialogDescription>
                  {stageJumpTarget && (
                    <>
                      This will move <strong>{buyerName}</strong> from{" "}
                      <strong>Stage {currentStage}: {currentDbStage?.stage_name}</strong> to{" "}
                      <strong>Stage {stageJumpTarget.stage_number}: {stageJumpTarget.stage_name}</strong>.
                      {stageJumpTarget.stage_number < currentStage && (
                        <span className="block mt-2 text-amber-600">
                          ⚠️ This will move the buyer backward in the process.
                        </span>
                      )}
                      {stageJumpTarget.stage_number > currentStage && (
                        <span className="block mt-2 text-blue-600">
                          ℹ️ This will skip ahead in the process.
                        </span>
                      )}
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStageJumpConfirm} disabled={updateBuyer.isPending}>
                  {updateBuyer.isPending ? "Moving..." : "Confirm Move"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <hr className="max-w-3xl mb-10" style={{ borderColor: '#e5e7eb' }} />

        {/* Saved Artifacts - Filtered by Stage Range */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>
              Saved Artifacts
            </p>
            {artifactsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#9ca3af' }} />
            ) : (
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {filteredArtifacts.filter(a => a.visibility === "shared").length || 0} shared with buyer
              </span>
            )}
          </div>
          
          {/* Stage range indicator */}
          {!showAllArtifacts && !artifactsLoading && (
            <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
              Showing artifacts from Stages {minDisplayStage}-{currentStage}
            </p>
          )}
          
          {artifactsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : (showAllArtifacts ? artifacts : filteredArtifacts)?.length ? (
            <div className="space-y-0">
              {(showAllArtifacts ? artifacts : filteredArtifacts)?.slice(0, 10).map((artifact) => (
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

          {/* View all artifacts link */}
          {!showAllArtifacts && totalArtifactCount > filteredArtifacts.length && (
            <button
              onClick={() => setShowAllArtifacts(true)}
              className="mt-4 text-sm transition-colors hover:underline underline-offset-4"
              style={{ color: '#6b7280' }}
            >
              View all artifacts ({totalArtifactCount} total) →
            </button>
          )}
          
          {showAllArtifacts && (
            <button
              onClick={() => setShowAllArtifacts(false)}
              className="mt-4 text-sm transition-colors hover:underline underline-offset-4"
              style={{ color: '#6b7280' }}
            >
              ← Show recent stages only
            </button>
          )}
        </div>

        {/* Artifact Viewer Dialog - Shared component with full actions */}
        <ArtifactViewerDialog
          artifact={selectedArtifact}
          open={artifactDialogOpen}
          onOpenChange={(open) => {
            setArtifactDialogOpen(open);
            if (!open) setSelectedArtifact(null);
          }}
          onShare={handleShareArtifact}
          onDelete={handleDeleteArtifact}
          onRegenerate={handleRegenerateArtifact}
          isSharing={isSharing}
          isDeleting={isDeleting}
          buyerName={buyerName}
        />

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
});
