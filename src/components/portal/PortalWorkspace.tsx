import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, FileText, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalMessages } from "@/hooks/usePortalMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { PortalBuyer } from "@/pages/BuyerPortal";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

interface PortalWorkspaceProps {
  buyer: PortalBuyer;
}

// Stage guidance for buyers (shown when no artifacts)
const STAGE_GUIDANCE: Record<string, { title: string; description: string; tips: string[] }> = {
  "Readiness & Expectations": {
    title: "Getting Started",
    description: "You're at the beginning of your home buying journey. We'll help you understand the process and set realistic expectations.",
    tips: [
      "Review your finances and savings",
      "Think about your timeline and must-haves",
      "Prepare questions for your agent",
    ],
  },
  "Financing & Capability": {
    title: "Securing Your Buying Power",
    description: "This stage is about understanding what you can afford and getting pre-approved for a mortgage.",
    tips: [
      "Gather financial documents for pre-approval",
      "Review your credit score",
      "Understand your budget bands",
    ],
  },
  "Market Intelligence & Search Setup": {
    title: "Defining Your Search",
    description: "We're refining your criteria and setting up your property search based on your preferences.",
    tips: [
      "Be clear about must-haves vs nice-to-haves",
      "Consider commute times and neighborhoods",
      "Stay flexible on some criteria",
    ],
  },
  "Touring, Filtering & Convergence": {
    title: "Finding Your Home",
    description: "Time to tour properties and narrow down your favorites. Take notes and trust your instincts!",
    tips: [
      "Schedule showings promptly for new listings",
      "Take photos and notes at each property",
      "Rank properties after each viewing",
    ],
  },
  "Offer Strategy & Submission": {
    title: "Making an Offer",
    description: "You've found a property you love. Now we'll craft a competitive offer strategy.",
    tips: [
      "Review comparable sales data",
      "Understand contingencies and terms",
      "Be prepared to negotiate",
    ],
  },
  "Negotiation & Contract": {
    title: "Negotiating Terms",
    description: "Your offer is in! We're working to get you the best possible terms.",
    tips: [
      "Stay patient during negotiations",
      "Know your walk-away price",
      "Review all contract terms carefully",
    ],
  },
  "Due Diligence & Inspections": {
    title: "Verifying the Property",
    description: "Time for inspections and due diligence to ensure the property meets expectations.",
    tips: [
      "Attend the home inspection",
      "Ask questions about any concerns",
      "Review inspection reports carefully",
    ],
  },
  "Appraisal & Lending": {
    title: "Finalizing Your Loan",
    description: "The appraisal is being scheduled and your lender is finalizing your mortgage.",
    tips: [
      "Respond quickly to lender requests",
      "Don't make major purchases or credit changes",
      "Review your loan terms carefully",
    ],
  },
  "Final Walkthrough & Preparation": {
    title: "Preparing to Close",
    description: "Almost there! We're doing final checks and preparing for closing day.",
    tips: [
      "Schedule your final walkthrough",
      "Prepare funds for closing",
      "Set up utilities and services",
    ],
  },
  "Closing & Post-Close": {
    title: "Congratulations!",
    description: "You're closing on your new home. Welcome to homeownership!",
    tips: [
      "Review all closing documents",
      "Get your keys and celebrate!",
      "Keep important documents safe",
    ],
  },
};

// Artifact card component with expandable content
interface ArtifactCardProps {
  artifact: {
    id: string;
    title: string;
    content: string;
    artifact_type: string;
    shared_at: string | null;
    created_at: string;
  };
  defaultExpanded?: boolean;
}

function ArtifactCard({ artifact, defaultExpanded = true }: ArtifactCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sharedDate = artifact.shared_at || artifact.created_at;
  
  // Check if content is long (more than ~500 chars or 10 lines)
  const isLongContent = artifact.content.length > 500 || artifact.content.split('\n').length > 10;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-xl md:text-2xl font-medium text-foreground">
              {artifact.title}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Shared by your agent · {format(new Date(sharedDate), "MMM d, yyyy")}
          </p>
        </div>
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div 
        className={cn(
          "bg-white border border-border/30 rounded-sm p-6 md:p-8",
          !isExpanded && isLongContent && "max-h-[300px] overflow-hidden relative"
        )}
      >
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:my-3 prose-p:leading-relaxed prose-ul:my-3 prose-li:my-1 prose-headings:my-4 prose-headings:font-medium prose-h2:text-xl prose-h3:text-lg prose-strong:font-semibold">
          <ReactMarkdown>{artifact.content}</ReactMarkdown>
        </div>
        
        {/* Fade overlay when collapsed */}
        {!isExpanded && isLongContent && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Show more button when collapsed */}
      {!isExpanded && isLongContent && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Show full document →
        </button>
      )}
    </div>
  );
}

export function PortalWorkspace({ buyer }: PortalWorkspaceProps) {
  const {
    messages,
    isLoading: isLoadingHistory,
    addMessage,
    updateLastAssistantMessage,
    finalizeLastAssistantMessage,
    setMessages,
  } = usePortalMessages(buyer.id);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch shared artifacts for this buyer
  const { data: sharedArtifacts, isLoading: artifactsLoading } = useQuery({
    queryKey: ["portal-artifacts", buyer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("buyer_id", buyer.id)
        .eq("visibility", "shared")
        .order("shared_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!buyer.id,
  });

  const stageGuidance = STAGE_GUIDANCE[buyer.current_stage || ""] || STAGE_GUIDANCE["Readiness & Expectations"];

  // Scroll to bottom when response updates
  useEffect(() => {
    if (currentResponse) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [currentResponse]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleSend = async (message?: string) => {
    const trimmedInput = (message || input).trim();
    if (!trimmedInput || isStreaming) return;

    // Hide actions, show response area
    setShowActions(false);
    setInput("");
    setCurrentResponse("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    setIsStreaming(true);

    // Add user message to history (but we won't display it as bubbles)
    await addMessage("user", trimmedInput);

    // Create placeholder for assistant response
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempAssistantId,
      buyer_id: buyer.id,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    }]);

    let accumulatedContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/buyer-portal-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: trimmedInput,
            buyerId: buyer.id,
            buyerContext: {
              name: buyer.name,
              currentStage: buyer.current_stage,
              budgetMin: buyer.budget_min,
              budgetMax: buyer.budget_max,
              preApprovalStatus: buyer.pre_approval_status,
              preApprovalAmount: buyer.pre_approval_amount,
              preferredCities: buyer.preferred_cities,
              propertyTypes: buyer.property_types,
              minBeds: buyer.min_beds,
              minBaths: buyer.min_baths,
              mustHaves: buyer.must_haves,
              niceToHaves: buyer.nice_to_haves,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                accumulatedContent += parsed.delta.text;
                setCurrentResponse(accumulatedContent);
                updateLastAssistantMessage(accumulatedContent);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Save the complete assistant message to DB
      if (accumulatedContent) {
        await finalizeLastAssistantMessage(accumulatedContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setCurrentResponse("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBackToActions = () => {
    setShowActions(true);
    setCurrentResponse(null);
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f9fafb]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#f9fafb]">
      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12">
          
          {/* Stage Context - matches agent exactly */}
          <p className="text-xs text-muted-foreground/40 mb-8">
            Stage {getStageNumber(buyer.current_stage)}: {buyer.current_stage || "Getting Started"}
          </p>

          {/* Main Actions View */}
          {showActions && !currentResponse && (
            <div className="mb-16">
              {/* If there are shared artifacts, show them prominently */}
              {sharedArtifacts && sharedArtifacts.length > 0 ? (
                <>
                  {/* Show artifacts as the main content */}
                  {sharedArtifacts.map((artifact, idx) => (
                    <ArtifactCard 
                      key={artifact.id} 
                      artifact={artifact}
                      defaultExpanded={idx === 0} // First one expanded, others collapsed
                    />
                  ))}

                  {/* Stage guidance below artifacts */}
                  <div className="mt-12 pt-8 border-t border-border/20">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      What's Next: {stageGuidance.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/70 mb-4">
                      {stageGuidance.description}
                    </p>
                    <div className="space-y-2">
                      {stageGuidance.tips.map((tip, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground/60">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* No artifacts yet - show stage guidance as main content */}
                  <div className="flex items-center gap-3 mb-10">
                    <h2 className="text-2xl md:text-3xl font-medium text-foreground">
                      {stageGuidance.title}
                    </h2>
                  </div>

                  <p className="text-lg text-foreground/70 mb-8 max-w-2xl">
                    {stageGuidance.description}
                  </p>

                  <div className="space-y-0 mb-12">
                    {stageGuidance.tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center justify-between py-4",
                          idx < stageGuidance.tips.length - 1 && "border-b border-border/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-muted-foreground/40" />
                          <span className="text-lg text-foreground/70">{tip}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Empty state message */}
                  <div className="mt-12 pt-8 border-t border-border/20">
                    <p className="text-sm text-muted-foreground/60">
                      📄 Documents and guides will appear here when your agent shares them with you.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Response View - shown when user asks a question */}
          {currentResponse !== null && (
            <div className="mb-16">
              {/* Back button */}
              <button
                onClick={handleBackToActions}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                ← Back to overview
              </button>

              {/* Response header */}
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AgentGPT</span>
              </div>

              {/* Response content - same styling as agent artifacts */}
              <div className="prose prose-lg dark:prose-invert max-w-none prose-p:my-4 prose-p:leading-relaxed prose-ul:my-4 prose-li:my-1 prose-headings:my-6 prose-headings:font-medium">
                {isStreaming && !currentResponse ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                ) : (
                  <ReactMarkdown>{currentResponse || ""}</ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input - matches agent exactly */}
      <div className="border-t border-border/20 bg-[#f9fafb]">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-6">
          <div className="relative max-w-3xl">
            <textarea
              ref={textareaRef}
              placeholder="Ask AgentGPT anything about your home search..."
              value={input}
              onChange={handleInputChange}
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
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className={cn(
                "absolute right-4 bottom-4",
                "text-muted-foreground/40 hover:text-foreground transition-colors",
                "disabled:opacity-20 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground/40 mt-2 max-w-3xl">
            I can answer questions but can't take actions. Contact your agent for changes.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper to get stage number from name
function getStageNumber(stageName: string | null): number {
  const stageMap: Record<string, number> = {
    "Readiness & Expectations": 0,
    "Financing & Capability": 1,
    "Market Intelligence & Search Setup": 2,
    "Touring, Filtering & Convergence": 3,
    "Offer Strategy & Submission": 4,
    "Negotiation & Contract": 5,
    "Due Diligence & Inspections": 6,
    "Appraisal & Lending": 7,
    "Final Walkthrough & Preparation": 8,
    "Closing & Post-Close": 9,
  };
  return stageMap[stageName || ""] ?? 1;
}
