import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Edit3,
  FileText,
  Home,
  Info,
  Send,
  Sparkles,
  Trash2,
  BarChart3,
  MessageSquare,
  DollarSign,
  RefreshCw,
  ClipboardList,
  Loader2,
  Eye,
  Lock,
  Share2,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAgentGPT } from "@/hooks/useAgentGPT";
import { useAgentGPTStream } from "@/hooks/useAgentGPTStream";
import { useRecommendationCache } from "@/hooks/useRecommendationCache";
import { useStage, type NextAction, type NextActionShowIf } from "@/hooks/useStages";
import { useArtifacts } from "@/hooks/useArtifacts";
import { useToast } from "@/hooks/use-toast";
import { useCreateTaskFromAction, useTasksBySourceActions } from "@/hooks/useTasks";
import { StreamingText, ThinkingDots } from "./StreamingText";
import { InlineBuyerUpdate, detectMissingField, type MissingField } from "./InlineBuyerUpdate";
import type { StageGroup } from "@/types/conversation";
import type { Stage, Buyer } from "@/types";
import { STAGES } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedAction {
  id: string;
  label: string;
  command: string;
  type: "artifact" | "thinking";
  icon?: React.ElementType;
  dbType?: "task" | "generate";
  visibility?: "internal" | "buyer_approval_required";
}

interface ChatMessage {
  id: string;
  type: "user" | "artifact" | "thinking";
  content: string;
  timestamp: Date;
  status?: "streaming" | "complete" | "pending" | "saved";
  savedVisibility?: "internal" | "shared";
  missingField?: MissingField | null;
  originalCommand?: string;
}

interface GuidedAgentGPTProps {
  stages: StageGroup[];
  currentStage: Stage;
  buyerName: string;
  buyer: Buyer;
  onExpandStage: (stageId: Stage) => void;
  onSendCommand: (command: string) => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onExpandBlock: (itemId: string) => void;
  onOpenDetails: () => void;
  onPrefillFromProgress?: (command: string) => void;
  prefillCommand?: string;
  initialAction?: string;
  initialCommand?: string;
  onBuyerUpdated?: (updatedBuyer: Buyer) => void;
}

export function GuidedAgentGPT({
  currentStage,
  buyerName,
  buyer,
  onSendCommand,
  onApprove,
  prefillCommand,
  initialAction,
  initialCommand,
  onBuyerUpdated,
}: GuidedAgentGPTProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Helper to navigate to tasks tab - uses direct navigation to bypass React Router state issues
  const navigateToTasksTab = useCallback(() => {
    console.log("[navigateToTasksTab] Navigating to tasks tab, buyerId:", buyer?.id);
    if (buyer?.id) {
      window.location.href = `/workspace/${buyer.id}?tab=tasks`;
    }
  }, [buyer?.id]);
  const [commandInput, setCommandInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [hasTriggeredInitial, setHasTriggeredInitial] = useState(false);
  const [isUpdatingBuyer, setIsUpdatingBuyer] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<{ command: string; type: "artifact" | "thinking" } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Mutable ref to hold latest buyer for callbacks
  const buyerRef = useRef(buyer);
  buyerRef.current = buyer;

  const { isLoading, fetchRecommendedActions } = useAgentGPT();
  const { isStreaming, streamedContent, streamArtifact, streamThinking, clearStream, error: streamError } = useAgentGPTStream();
  const { getCachedActions, setCachedActions, lastRefreshed, isCacheHit } = useRecommendationCache();
  const { createArtifact, isCreating } = useArtifacts(buyer.id);
  const { toast } = useToast();
  const createTaskFromAction = useCreateTaskFromAction();
  
  // Fetch stage data from database
  const { data: dbStage, isLoading: stageLoading } = useStage(currentStage);

  // Get task action IDs from current stage for checking existing tasks
  const taskActionIds = useMemo(() => {
    if (!dbStage?.next_actions) return [];
    return dbStage.next_actions
      .filter((action) => action.type === "task")
      .map((action) => action.id);
  }, [dbStage]);

  // Check for existing tasks for task-type actions
  const { data: existingTasksMap, refetch: refetchExistingTasks } = useTasksBySourceActions(
    buyer.id,
    taskActionIds
  );

  const currentStageData = STAGES[currentStage];

  // Filter actions based on show_if conditions and buyer data
  const filterActionsByBuyerData = useCallback((actions: NextAction[], buyerData: Buyer): NextAction[] => {
    return actions.filter(action => {
      // If no show_if conditions, always show
      if (!action.show_if) return true;

      // Check each condition in show_if
      for (const [field, allowedValues] of Object.entries(action.show_if)) {
        if (!allowedValues) continue;

        // Map show_if field names to buyer object keys
        const buyerFieldMap: Record<string, string> = {
          pre_approval_status: "pre_approval_status",
          loan_pre_approval_status: "pre_approval_status", // alias
        };

        const buyerKey = buyerFieldMap[field] || field;
        // Access buyer data dynamically - buyer may have additional fields from DB
        const buyerValue = (buyerData as unknown as Record<string, unknown>)[buyerKey];

        // If buyer doesn't have this field or value doesn't match allowed values, hide action
        if (buyerValue === undefined || buyerValue === null) {
          // Treat undefined/null as not matching any condition
          continue;
        }

        const valueAsString = String(buyerValue);
        if (!allowedValues.includes(valueAsString)) {
          return false; // Hide this action
        }
      }

      return true; // All conditions passed
    });
  }, []);

  // Convert database next_actions to RecommendedAction format
  // Look up visibility from the stage artifacts array by matching action ID patterns
  const mapDbActionsToRecommended = useCallback((dbActions: NextAction[], buyerName: string, artifacts?: { id: string; visibility: string }[]): RecommendedAction[] => {
    return dbActions.map((action, idx) => {
      // Try to find matching artifact visibility
      // Action IDs like "create-scoring-rubric" map to artifact IDs like "property-scoring-rubric"
      let visibility: "internal" | "buyer_approval_required" | undefined = undefined;
      
      if (artifacts) {
        // Direct match first
        const directMatch = artifacts.find(a => a.id === action.id);
        if (directMatch) {
          visibility = directMatch.visibility === "internal" ? "internal" : "buyer_approval_required";
        } else {
          // Try fuzzy match: action "generate-neighborhood-brief" → artifact "neighborhood-intelligence-brief"
          const actionKeywords = action.id.toLowerCase().split('-').filter(w => !['create', 'generate', 'prep', 'setup', 'prepare'].includes(w));
          const matchedArtifact = artifacts.find(a => {
            const artifactKeywords = a.id.toLowerCase().split('-');
            return actionKeywords.some(kw => artifactKeywords.includes(kw));
          });
          if (matchedArtifact) {
            visibility = matchedArtifact.visibility === "internal" ? "internal" : "buyer_approval_required";
          }
        }
      }
      
      // Default: if no artifact match found, default to internal for safety
      if (!visibility) {
        visibility = "internal";
      }
      
      return {
        id: action.id || `action-${idx}`,
        label: action.label,
        command: generateCommandFromDbAction(action, buyerName),
        type: "artifact" as const,
        dbType: action.type,
        icon: getIconForDbAction(action),
        visibility,
      };
    });
  }, []);

  // Load actions on mount, buyer change, or when stage data loads
  useEffect(() => {
    const loadActions = async () => {
      // First priority: Use database stage actions if available
      if (dbStage?.next_actions && dbStage.next_actions.length > 0) {
        // Filter actions based on buyer data before mapping
        const filteredActions = filterActionsByBuyerData(dbStage.next_actions, buyer);
        // Pass artifacts to map visibility
        const dbActions = mapDbActionsToRecommended(filteredActions, buyerName, dbStage.artifacts);
        setRecommendedActions(dbActions);
        setShowActions(true);
        return;
      }

      // Fallback to hardcoded actions while DB loads
      const fallback = getFallbackActions(currentStage, buyerName);
      setRecommendedActions(fallback);
      setShowActions(true);
    };

    setMessages([]);
    setShowActions(true);
    setHasTriggeredInitial(false);
    loadActions();
  }, [buyer, currentStage, buyerName, dbStage, filterActionsByBuyerData, mapDbActionsToRecommended]);

  // Handle initial action/command from URL params
  useEffect(() => {
    if (hasTriggeredInitial) return;

    const actionParam = searchParams.get('action') || initialAction;
    const commandParam = searchParams.get('command') || initialCommand;

    if (commandParam) {
      setHasTriggeredInitial(true);
      // Trigger the command directly
      setTimeout(() => {
        triggerCommand(commandParam, "artifact");
      }, 100);
    } else if (actionParam) {
      setHasTriggeredInitial(true);
      // Map action to appropriate command
      const actionCommand = getCommandForAction(actionParam, buyerName);
      if (actionCommand) {
        setTimeout(() => {
          triggerCommand(actionCommand.command, actionCommand.type);
        }, 100);
      }
    }
  }, [searchParams, initialAction, initialCommand, hasTriggeredInitial, buyerName]);

  useEffect(() => {
    if (prefillCommand) {
      setCommandInput(prefillCommand);
    }
  }, [prefillCommand]);

  useEffect(() => {
    if (streamError) {
      toast({
        title: "AgentGPT Error",
        description: streamError,
        variant: "destructive",
      });
    }
  }, [streamError, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  useEffect(() => {
    if (streamedContent && isStreaming) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.status === "streaming") {
          return prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, content: streamedContent } : msg
          );
        }
        return prev;
      });
    }
  }, [streamedContent, isStreaming]);

  useEffect(() => {
    if (!isStreaming && streamedContent) {
      // Detect if AI response indicates missing data
      let detectedMissing = detectMissingField(streamedContent);
      
      // Only show inline form if buyer needs to complete pre-approval
      // Don't show if already "Pre-Approved" - they have valid pre-approval
      if (detectedMissing) {
        const status = buyer.pre_approval_status;
        const isPreApprovalComplete = status === "Pre-Approved";
        
        if (isPreApprovalComplete) {
          // Buyer has completed pre-approval, don't show inline form
          detectedMissing = null;
        }
      }
      
      setMessages(prev => {
        return prev.map(msg =>
          msg.status === "streaming" 
            ? { 
                ...msg, 
                status: "pending" as const, 
                content: streamedContent,
                missingField: detectedMissing,
                originalCommand: pendingCommand?.command,
              } 
            : msg
        );
      });
    }
  }, [isStreaming, streamedContent, pendingCommand, buyer]);

  const determineIntent = (command: string): "artifact" | "thinking" => {
    const lowerCommand = command.toLowerCase();
    const thinkingPatterns = [
      "why", "what does", "what are the", "explain to me",
      "help me understand", "what should i", "risks", "mean",
      "analyze", "assessment", "evaluate"
    ];
    return thinkingPatterns.some(p => lowerCommand.includes(p)) ? "thinking" : "artifact";
  };

  const triggerCommand = useCallback(async (command: string, type: "artifact" | "thinking", visibility?: "internal" | "buyer_approval_required") => {
    clearStream();
    setShowActions(false);
    setPendingCommand({ command, type });

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: "user",
      content: command,
      timestamp: new Date(),
      status: "complete",
    }]);

    setMessages(prev => [...prev, {
      id: `${type}-${Date.now()}`,
      type: type,
      content: "",
      timestamp: new Date(),
      status: "streaming",
      originalCommand: command,
    }]);

    try {
      if (type === "thinking") {
        await streamThinking(command, buyerRef.current);
      } else {
        // Pass visibility to streamArtifact, default to internal if not specified
        await streamArtifact(command, buyerRef.current, visibility || "internal");
      }
    } catch {
      // Error handled by hook
    }
  }, [streamArtifact, streamThinking, clearStream]);

  // Handler for inline buyer updates
  const handleInlineBuyerUpdate = useCallback(async (
    messageId: string,
    field: MissingField,
    value: number,
    originalCommand?: string
  ) => {
    setIsUpdatingBuyer(true);
    
    try {
      // Build the update payload
      const updatePayload: Record<string, unknown> = {};
      
      // Map field name to database column and add to payload
      if (field === "pre_approval_amount") {
        updatePayload.pre_approval_amount = value;
        // Automatically set status to Pre-Approved when amount is entered
        updatePayload.pre_approval_status = "Pre-Approved";
      } else if (field === "budget_max") {
        updatePayload.budget_max = value;
      } else if (field === "budget_min") {
        updatePayload.budget_min = value;
      }
      
      // Update buyer in database
      const { error } = await supabase
        .from("buyers")
        .update(updatePayload)
        .eq("id", buyer.id);

      if (error) throw error;

      // Fetch the FRESH buyer data from database after update
      const { data: freshDbBuyer, error: fetchError } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", buyer.id)
        .single();

      if (fetchError) throw fetchError;

      // Map fresh DB data to local Buyer type (same pattern as Workspace.tsx)
      const stageMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5> = {
        "Readiness & Expectations": 0,
        "Home Search": 1,
        "Offer Strategy": 2,
        "Under Contract": 3,
        "Closing Preparation": 4,
        "Closing & Post-Close": 5,
      };
      
      const updatedBuyer: Buyer = {
        id: freshDbBuyer.id,
        name: freshDbBuyer.name,
        email: freshDbBuyer.email || "",
        phone: freshDbBuyer.phone || undefined,
        currentStage: stageMap[freshDbBuyer.current_stage || "Home Search"] ?? 1,
        createdAt: new Date(freshDbBuyer.created_at),
        lastActivity: new Date(freshDbBuyer.updated_at),
        financingConfirmed: freshDbBuyer.pre_approval_status === "Approved",
        buyerType: freshDbBuyer.buyer_type as Buyer["buyerType"],
        // Extended profile fields for AgentGPT context
        pre_approval_status: freshDbBuyer.pre_approval_status,
        pre_approval_amount: freshDbBuyer.pre_approval_amount,
        budget_min: freshDbBuyer.budget_min,
        budget_max: freshDbBuyer.budget_max,
        preferred_cities: freshDbBuyer.preferred_cities,
        property_types: freshDbBuyer.property_types,
        min_beds: freshDbBuyer.min_beds,
        min_baths: freshDbBuyer.min_baths,
        must_haves: freshDbBuyer.must_haves,
        nice_to_haves: freshDbBuyer.nice_to_haves,
        agent_notes: freshDbBuyer.agent_notes,
      };

      // Update the ref immediately so triggerCommand uses fresh data
      buyerRef.current = updatedBuyer;

      // Notify parent to update buyer state
      onBuyerUpdated?.(updatedBuyer);

      toast({ title: "Buyer profile updated" });

      // Remove the message with missing field indicator
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      // Re-trigger the original command with updated buyer (ref already has fresh data)
      if (originalCommand) {
        const type = determineIntent(originalCommand);
        // Small delay to ensure React state has propagated
        setTimeout(() => {
          triggerCommand(originalCommand, type);
        }, 100);
      }
    } catch (err) {
      console.error("Failed to update buyer:", err);
      toast({ 
        title: "Failed to update buyer", 
        description: "Please try again or update from the profile page",
        variant: "destructive" 
      });
    } finally {
      setIsUpdatingBuyer(false);
    }
  }, [buyer.id, onBuyerUpdated, toast, triggerCommand]);

  const handleSend = useCallback(async () => {
    if (!commandInput.trim() || isStreaming) return;

    const command = commandInput.trim();
    const intent = determineIntent(command);
    onSendCommand(command);
    setCommandInput("");
    
    await triggerCommand(command, intent);
  }, [commandInput, isStreaming, onSendCommand, triggerCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRecommendationClick = useCallback(async (action: RecommendedAction) => {
    // Handle task-type actions: auto-create task instead of streaming
    if (action.dbType === "task") {
      try {
        await createTaskFromAction.mutateAsync({
          actionId: action.id,
          actionLabel: action.label,
          buyerId: buyer.id,
          stageId: dbStage?.id,
        });
        
        toast({
          title: "✓ Task created",
          description: `${action.label} — Click to view`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("[Toast] View Tasks clicked, buyerId:", buyer.id);
                window.location.href = `/workspace/${buyer.id}?tab=tasks`;
              }}
              className="shrink-0"
            >
              View Tasks
            </Button>
          ),
        });
        
        // Refetch existing tasks to update the UI badges
        refetchExistingTasks();
      } catch (error) {
        if (error instanceof Error && error.message === "TASK_EXISTS") {
          toast({
            title: "Task already exists",
            description: `"${action.label}" was already created for this buyer`,
            variant: "default",
          });
        } else {
          toast({
            title: "Failed to create task",
            description: "Please try again",
            variant: "destructive",
          });
        }
      }
      return;
    }
    
    // Non-task actions: proceed with normal streaming
    await triggerCommand(action.command, action.type, action.visibility);
  }, [triggerCommand, createTaskFromAction, buyer.id, dbStage?.id, toast, refetchExistingTasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const actions = await fetchRecommendedActions(buyer);
      if (actions.length > 0) {
        const actionsWithIcons = actions.map(action => ({
          ...action,
          icon: getIconForAction(action),
        }));
        setRecommendedActions(actionsWithIcons);
        await setCachedActions(buyer.id, actions);
        toast({ title: "Recommendations updated" });
      }
    } catch {
      toast({ title: "Failed to refresh", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApproveArtifact = (messageId: string) => {
    onApprove(messageId);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, status: "complete" as const } : msg
      )
    );
    toast({ title: "Artifact approved and published" });
  };

  const handleDiscardArtifact = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleSaveArtifact = async (messageId: string, visibility: "internal" | "shared") => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.content) return;

    try {
      // Generate a title from the first line or first 50 chars
      const firstLine = message.content.split('\n')[0];
      const title = firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine;

      await createArtifact({
        buyer_id: buyer.id,
        stage_id: dbStage?.id || null,
        artifact_type: "agent-generated",
        title,
        content: message.content,
        visibility,
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId 
            ? { ...msg, status: "saved" as const, savedVisibility: visibility } 
            : msg
        )
      );
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f9fafb]">
      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
          
          {/* Stage Context */}
          <p className="text-xs text-muted-foreground/40 mb-8">
            {dbStage ? (
              <span>Stage {currentStage}: {dbStage.stage_name}</span>
            ) : stageLoading ? (
              <span>Loading stage data...</span>
            ) : null}
          </p>

          {/* Recommended Actions - Plain Text */}
          {showActions && messages.length === 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-10">
                <h2 className="text-2xl md:text-3xl font-medium text-foreground">What would you like to do for {buyerName}?</h2>
                {stageLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {stageLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 bg-muted/30 rounded animate-pulse w-3/4" />
                  ))}
                </div>
              ) : (
                <div className="space-y-0">
                  {recommendedActions.slice(0, 4).map((action, idx) => {
                    const existingTask = action.dbType === "task" ? existingTasksMap?.[action.id] : null;
                    const isTaskAction = action.dbType === "task";
                    
                    return (
                      <div
                        key={action.id}
                        className={cn(
                          "flex items-center justify-between py-4",
                          idx < 3 && "border-b border-border/10"
                        )}
                      >
                        <button
                          onClick={() => handleRecommendationClick(action)}
                          disabled={isStreaming || createTaskFromAction.isPending}
                          className={cn(
                            "text-left text-lg text-foreground/70 hover:text-foreground transition-colors",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            existingTask && "text-foreground/50"
                          )}
                        >
                          {action.label}
                        </button>
                        
                        {/* Task indicator badge */}
                        {isTaskAction && (
                          existingTask ? (
                            <button
                              onClick={() => {
                                console.log("[Badge] Task created badge clicked, buyerId:", buyer.id);
                                window.location.href = `/workspace/${buyer.id}?tab=tasks`;
                              }}
                              className="flex items-center gap-1.5 text-xs text-success hover:text-success/80 hover:underline transition-colors cursor-pointer group"
                            >
                              <ListTodo className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                              Task created →
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
                              <ListTodo className="h-3.5 w-3.5" />
                              Creates task
                            </span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Message Stream */}
          <div className="space-y-12 md:space-y-16">
            {messages.map((message) => (
              <MessageBlock
                key={message.id}
                message={message}
                isStreaming={message.status === "streaming"}
                isSaving={isCreating}
                buyerId={buyer.id}
                buyerName={buyerName}
                isUpdatingBuyer={isUpdatingBuyer}
                onApprove={() => handleApproveArtifact(message.id)}
                onDiscard={() => handleDiscardArtifact(message.id)}
                onSaveInternal={() => handleSaveArtifact(message.id, "internal")}
                onSaveShared={() => handleSaveArtifact(message.id, "shared")}
                onInlineUpdate={(field, value) => 
                  handleInlineBuyerUpdate(message.id, field, value, message.originalCommand)
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Input */}
      <div className="border-t border-border/20 bg-[#f9fafb]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6">
          <div className="relative max-w-3xl">
            <textarea
              placeholder={`Tell AgentGPT what to do for ${buyerName}...`}
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              rows={1}
              className={cn(
                "w-full min-h-[52px] max-h-[200px] resize-none pr-14 py-4 px-5",
                "text-base",
                "bg-white border border-border/30 focus:border-border/60 focus:outline-none",
                "placeholder:text-muted-foreground/40",
                "disabled:opacity-50"
              )}
              style={{ borderRadius: '2px' }}
            />
            <button
              onClick={handleSend}
              disabled={!commandInput.trim() || isStreaming}
              className={cn(
                "absolute right-4 bottom-4",
                "text-muted-foreground/40 hover:text-foreground transition-colors",
                "disabled:opacity-20 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBlock({
  message,
  isStreaming,
  isSaving,
  buyerId,
  buyerName,
  isUpdatingBuyer,
  onApprove,
  onDiscard,
  onSaveInternal,
  onSaveShared,
  onInlineUpdate,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  isSaving: boolean;
  buyerId: string;
  buyerName: string;
  isUpdatingBuyer: boolean;
  onApprove: () => void;
  onDiscard: () => void;
  onSaveInternal: () => void;
  onSaveShared: () => void;
  onInlineUpdate: (field: MissingField, value: number) => Promise<void>;
}) {
  if (message.type === "user") {
    return (
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">You</p>
        <p className="text-xl font-medium text-foreground leading-relaxed">{message.content}</p>
      </div>
    );
  }

  if (message.type === "thinking") {
    return (
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">
          AgentGPT
        </p>
        <div className="text-base leading-[1.75] text-foreground/80">
          {isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <StreamingText
              content={message.content}
              isComplete={!isStreaming}
              className="text-base leading-[1.75]"
            />
          )}
        </div>
      </div>
    );
  }

  if (message.type === "artifact") {
    const isPending = message.status === "pending";
    const isSaved = message.status === "saved";
    const hasMissingField = message.missingField && isPending;
    
    return (
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground/40 mb-4">
          {hasMissingField ? "AgentGPT" : "Draft"}
          {isPending && !hasMissingField && <span className="ml-2 text-warning normal-case">· Ready to save</span>}
          {isSaved && message.savedVisibility === "internal" && (
            <span className="ml-2 text-muted-foreground normal-case flex items-center gap-1 inline-flex">
              · <Lock className="h-3 w-3" /> Saved (internal)
            </span>
          )}
          {isSaved && message.savedVisibility === "shared" && (
            <span className="ml-2 text-success normal-case flex items-center gap-1 inline-flex">
              · <Eye className="h-3 w-3" /> Saved & shared with buyer
            </span>
          )}
        </p>
        
        <div className="text-base leading-[1.75] text-foreground mb-8">
          {isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <StreamingText
              content={message.content}
              isComplete={!isStreaming}
              className="text-base leading-[1.75]"
            />
          )}
        </div>

        {/* Inline Update Form when missing field detected */}
        {hasMissingField && message.missingField && (
          <InlineBuyerUpdate
            buyerId={buyerId}
            buyerName={buyerName}
            missingField={message.missingField}
            onSave={async () => {}}
            onSaveAndGenerate={(field, value) => onInlineUpdate(field, value)}
            isUpdating={isUpdatingBuyer}
          />
        )}

        {isPending && !hasMissingField && (
          <div className="flex items-center gap-4 pt-6 border-t border-border/10">
            <button 
              className="text-sm border border-border/30 text-foreground px-4 py-2 hover:bg-muted/50 flex items-center gap-2 transition-colors disabled:opacity-50" 
              onClick={onSaveInternal}
              disabled={isSaving}
              style={{ borderRadius: '2px' }}
            >
              <Lock className="h-4 w-4" />
              Save as Internal
            </button>
            <button 
              className="text-sm bg-foreground text-background px-4 py-2 hover:bg-foreground/90 flex items-center gap-2 transition-colors disabled:opacity-50" 
              onClick={onSaveShared}
              disabled={isSaving}
              style={{ borderRadius: '2px' }}
            >
              <Share2 className="h-4 w-4" />
              Save & Share with Buyer
            </button>
            <button
              className="text-sm text-muted-foreground/40 hover:text-destructive transition-colors"
              onClick={onDiscard}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function getIconForAction(action: RecommendedAction): React.ElementType {
  const label = action.label.toLowerCase();
  const command = action.command.toLowerCase();

  if (label.includes("comp") || command.includes("comp") || label.includes("market")) return BarChart3;
  if (label.includes("offer") || command.includes("offer") || label.includes("price")) return DollarSign;
  if (label.includes("update") || label.includes("draft") || command.includes("draft")) return MessageSquare;
  if (label.includes("document") || label.includes("checklist") || command.includes("checklist")) return FileText;
  if (label.includes("inspection") || label.includes("walkthrough")) return Home;
  if (action.type === "thinking") return Info;

  return Sparkles;
}

// Generate command string from database action
function generateCommandFromDbAction(action: NextAction, buyerName: string): string {
  const firstName = buyerName.split(" ")[0];
  
  // Map action IDs to specific commands
  const commandMap: Record<string, string> = {
    "schedule-consultation": `Create a task to schedule a consultation call with ${buyerName}`,
    "prep-consultation": `Prepare a consultation agenda for my upcoming call with ${firstName}`,
    "create-strategy-brief": `Create a buyer strategy brief for ${buyerName} based on their preferences and goals`,
    "share-process-overview": `Draft a home buying process overview to share with ${firstName}`,
  };

  // Check if we have a specific command for this action ID
  if (commandMap[action.id]) {
    return commandMap[action.id];
  }

  // Generate command from label if no specific mapping
  const actionVerb = action.type === "task" ? "Create a task to" : "Generate";
  return `${actionVerb} ${action.label.toLowerCase()} for ${buyerName}`;
}

// Get icon based on database action type and label
function getIconForDbAction(action: NextAction): React.ElementType {
  const label = action.label.toLowerCase();
  
  if (label.includes("schedule") || label.includes("call")) return MessageSquare;
  if (label.includes("prep") || label.includes("agenda") || label.includes("checklist")) return ClipboardList;
  if (label.includes("strategy") || label.includes("brief")) return FileText;
  if (label.includes("overview") || label.includes("process")) return Info;
  if (label.includes("offer") || label.includes("price")) return DollarSign;
  if (label.includes("property") || label.includes("home")) return Home;
  if (label.includes("market") || label.includes("comp")) return BarChart3;
  
  // Default icons by type
  return action.type === "task" ? ClipboardList : Sparkles;
}

function getCommandForAction(action: string, buyerName: string): { command: string; type: "artifact" | "thinking" } | null {
  const firstName = buyerName.split(" ")[0];
  
  const actionMap: Record<string, { command: string; type: "artifact" | "thinking" }> = {
    "needs-attention": {
      command: `Review open tasks and pending items for ${buyerName} and suggest next steps`,
      type: "artifact"
    },
    "review-approvals": {
      command: `Show pending approvals for ${buyerName} that need my review`,
      type: "artifact"
    },
    "weekly-summary": {
      command: `Generate a weekly activity summary for ${buyerName}`,
      type: "artifact"
    },
    "create-buyer-intro": {
      command: `Draft an introduction and set expectations for a new buyer`,
      type: "artifact"
    },
  };

  return actionMap[action] || null;
}

function getFallbackActions(stage: Stage, buyerName: string): RecommendedAction[] {
  const firstName = buyerName.split(" ")[0];

  const baseActions: Partial<Record<Stage, RecommendedAction[]>> = {
    0: [
      { id: "1", label: "Set buyer expectations", command: "Draft buyer introduction and set expectations for the home buying journey", type: "artifact", icon: MessageSquare },
      { id: "2", label: "Confirm financing status", command: "Create task to confirm financing and pre-approval status", type: "artifact", icon: FileText },
      { id: "3", label: "Explain market conditions", command: "Why is understanding market conditions important for buyers?", type: "thinking", icon: Info },
    ],
    1: [
      { id: "1", label: `Draft update for ${firstName}`, command: `Draft buyer update about new listings matching ${buyerName}'s criteria`, type: "artifact", icon: MessageSquare },
      { id: "2", label: "Generate property comps", command: "Generate comparable sales analysis for saved properties", type: "artifact", icon: BarChart3 },
      { id: "3", label: "Explain days on market", command: `Explain "days on market" concept to ${buyerName}`, type: "artifact", icon: MessageSquare },
    ],
    2: [
      { id: "1", label: "Prepare offer strategy", command: "Prepare offer strategy summary for buyer review", type: "artifact", icon: DollarSign },
      { id: "2", label: "Generate offer scenarios", command: "Generate offer scenarios with different price points", type: "artifact", icon: BarChart3 },
      { id: "3", label: "Explain contingencies", command: "Draft explanation of key contingencies for buyer", type: "artifact", icon: MessageSquare },
    ],
    3: [
      { id: "1", label: "Inspection summary", command: "Draft inspection findings summary for buyer", type: "artifact", icon: FileText },
      { id: "2", label: "Create repair request", command: "Generate repair request list based on inspection", type: "artifact", icon: FileText },
      { id: "3", label: "Timeline update", command: "Create closing timeline update for buyer", type: "artifact", icon: MessageSquare },
    ],
    4: [
      { id: "1", label: "Final walkthrough prep", command: "Generate final walkthrough checklist", type: "artifact", icon: Home },
      { id: "2", label: "Closing cost breakdown", command: "Draft closing costs explanation for buyer", type: "artifact", icon: DollarSign },
      { id: "3", label: "What to verify at closing?", command: "What should I verify before closing?", type: "thinking", icon: Info },
    ],
    5: [
      { id: "1", label: "Post-closing resources", command: "Generate post-closing resources and next steps", type: "artifact", icon: Home },
      { id: "2", label: "Request review", command: "Create task to request buyer review and referrals", type: "artifact", icon: MessageSquare },
      { id: "3", label: "What's next for retention?", command: "What's the best approach for client retention?", type: "thinking", icon: Info },
    ],
  };

  return baseActions[stage] || baseActions[1];
}
