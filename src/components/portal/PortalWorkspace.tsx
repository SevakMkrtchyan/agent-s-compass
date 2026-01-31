import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, FileText, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortalMessages } from "@/hooks/usePortalMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { PortalBuyer } from "@/pages/BuyerPortal";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

interface PortalWorkspaceProps {
  buyer: PortalBuyer;
}

// Stage guidance with conversational content
const STAGE_GUIDANCE: Record<string, { 
  title: string; 
  greeting: string;
  description: string;
  nextSteps: string[];
  whatsNext: string;
}> = {
  "Readiness & Expectations": {
    title: "Getting Started",
    greeting: "Welcome to your home buying journey! 🏡",
    description: "We're going to make this process as smooth as possible. First, let's make sure you're set up for success.",
    nextSteps: [
      "Review your finances and timeline",
      "Think about what matters most in your new home",
      "Get ready to discuss your goals with your agent",
    ],
    whatsNext: "Once we understand your situation, we'll move on to securing your financing and buying power.",
  },
  "Financing & Capability": {
    title: "Understanding Your Buying Power",
    greeting: "Let's figure out exactly what you can afford! 💪",
    description: "This is one of the most important steps. Understanding your budget will help us find homes that fit perfectly within your range.",
    nextSteps: [
      "Review your personalized budget guide below",
      "Understand your Conservative, Target, and Stretch ranges",
      "Get pre-approved with a lender if you haven't already",
    ],
    whatsNext: "With your budget locked in, we'll start searching for properties that match your criteria.",
  },
  "Market Intelligence & Search Setup": {
    title: "Setting Up Your Search",
    greeting: "Time to define what you're looking for! 🔍",
    description: "We're setting up your personalized property search based on your preferences and budget.",
    nextSteps: [
      "Confirm your must-haves and nice-to-haves",
      "Review the neighborhoods we've identified",
      "Set up alerts for new listings",
    ],
    whatsNext: "Once your search is dialed in, we'll start touring properties that match your criteria.",
  },
  "Touring, Filtering & Convergence": {
    title: "Finding Your Home",
    greeting: "The fun part begins - let's go see some homes! 🏠",
    description: "We'll tour properties together and narrow down to your favorites. Take notes and trust your instincts!",
    nextSteps: [
      "Review scheduled showings in the Properties tab",
      "Take photos and notes at each property",
      "Share your thoughts after each tour",
    ],
    whatsNext: "When you find 'the one', we'll move quickly to craft a winning offer strategy.",
  },
  "Offer Strategy & Submission": {
    title: "Making Your Move",
    greeting: "You found a home you love! Let's make it yours. 📝",
    description: "We're crafting a competitive offer strategy to give you the best chance of success.",
    nextSteps: [
      "Review the offer strategy we've prepared",
      "Understand the terms and contingencies",
      "Be ready to move fast if needed",
    ],
    whatsNext: "Once we submit your offer, we'll negotiate to get you the best possible deal.",
  },
  "Negotiation & Contract": {
    title: "Negotiating Your Deal",
    greeting: "Your offer is in - now we negotiate! 🤝",
    description: "We're working to get you the best possible terms. Stay patient and trust the process.",
    nextSteps: [
      "Review any counter-offers carefully",
      "Know your priorities and limits",
      "Stay responsive to move quickly",
    ],
    whatsNext: "Once we reach an agreement, we'll move into due diligence and inspections.",
  },
  "Due Diligence & Inspections": {
    title: "Verifying Everything",
    greeting: "Time to look under the hood! 🔧",
    description: "We're conducting thorough inspections to make sure the property meets your expectations.",
    nextSteps: [
      "Attend the home inspection if possible",
      "Review inspection reports carefully",
      "Discuss any concerns with your agent",
    ],
    whatsNext: "After inspections clear, we'll finalize your loan and prepare for closing.",
  },
  "Appraisal & Lending": {
    title: "Finalizing Your Loan",
    greeting: "Almost there - the numbers are coming together! 📊",
    description: "Your lender is finalizing your mortgage. Respond quickly to any requests to keep things moving.",
    nextSteps: [
      "Respond promptly to lender requests",
      "Avoid major purchases or credit changes",
      "Review your final loan terms",
    ],
    whatsNext: "Once your loan is approved, we'll do a final walkthrough and prepare for closing day!",
  },
  "Final Walkthrough & Preparation": {
    title: "The Home Stretch",
    greeting: "We're in the final stretch! 🎯",
    description: "We're doing final preparations and making sure everything is perfect for closing day.",
    nextSteps: [
      "Schedule your final walkthrough",
      "Prepare your closing funds",
      "Set up utilities and moving plans",
    ],
    whatsNext: "Next stop: closing day! You're about to become a homeowner.",
  },
  "Closing & Post-Close": {
    title: "Congratulations, Homeowner!",
    greeting: "You did it! 🎉🏠🔑",
    description: "Welcome to homeownership! Here's what to know as you settle into your new home.",
    nextSteps: [
      "Keep your closing documents safe",
      "Change your locks and update your address",
      "Enjoy your new home!",
    ],
    whatsNext: "You're all set! Your agent is always here if you need anything in the future.",
  },
};

// Helper to get stage number
function getStageNumber(stageName: string | null | undefined): number {
  const stageOrder = [
    "Readiness & Expectations",
    "Financing & Capability", 
    "Market Intelligence & Search Setup",
    "Touring, Filtering & Convergence",
    "Offer Strategy & Submission",
    "Negotiation & Contract",
    "Due Diligence & Inspections",
    "Appraisal & Lending",
    "Final Walkthrough & Preparation",
    "Closing & Post-Close",
  ];
  const index = stageOrder.indexOf(stageName || "");
  return index >= 0 ? index + 1 : 1;
}

// Shared artifact card - matches agent workspace styling
interface ArtifactSectionProps {
  artifact: {
    id: string;
    title: string;
    content: string;
    artifact_type: string;
    shared_at: string | null;
    created_at: string;
  };
  intro?: string;
}

function ArtifactSection({ artifact, intro }: ArtifactSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sharedDate = artifact.shared_at || artifact.created_at;
  
  // Check if content is long
  const isLongContent = artifact.content.length > 1200 || artifact.content.split('\n').length > 20;

  return (
    <div className="space-y-3">
      {/* Intro message - no box, just text */}
      {intro && (
        <div>
          <p className="text-foreground/70 leading-relaxed">{intro}</p>
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            Shared {format(new Date(sharedDate), "MMMM d, yyyy")}
          </p>
        </div>
      )}

      {/* Artifact content - light styling */}
      <div className="mt-4">
        {/* Header - minimal */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary/70" />
            <h3 className="font-medium text-foreground text-sm">{artifact.title}</h3>
          </div>
          {isLongContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  More
                </>
              )}
            </button>
          )}
        </div>

        {/* Content - subtle background */}
        <div 
          className={cn(
            "bg-muted/30 rounded-lg px-4 py-4",
            !isExpanded && isLongContent && "max-h-[280px] overflow-hidden relative"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground/80 prose-ul:my-2 prose-li:my-0.5 prose-li:text-foreground/80 prose-headings:my-2.5 prose-headings:font-medium prose-headings:text-foreground prose-h2:text-sm prose-h3:text-sm prose-strong:font-medium prose-strong:text-foreground">
            <ReactMarkdown>{artifact.content}</ReactMarkdown>
          </div>
          
          {/* Fade overlay when collapsed */}
          {!isExpanded && isLongContent && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted/30 to-transparent" />
          )}
        </div>

        {/* Show more button when collapsed */}
        {!isExpanded && isLongContent && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-primary hover:text-primary/80 transition-colors mt-2"
          >
            Show more →
          </button>
        )}
      </div>
    </div>
  );
}

// Next steps list - lighter styling
function NextStepsList({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2.5">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <span className="text-xs font-medium text-primary/70 mt-0.5 w-4">{idx + 1}.</span>
          <span className="text-foreground/70 text-sm leading-relaxed">{step}</span>
        </div>
      ))}
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
  const [showResponse, setShowResponse] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
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

  const stageGuidance = STAGE_GUIDANCE[buyer.current_stage || ""] || STAGE_GUIDANCE["Financing & Capability"];
  const firstName = buyer.name.split(" ")[0];

  // Scroll to bottom when response updates
  useEffect(() => {
    if (showResponse && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [currentResponse, showResponse]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    setInput("");
    setShowResponse(true);
    setCurrentResponse("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    await addMessage("user", trimmedInput);
    setIsStreaming(true);

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

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

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

  const handleBackToWorkspace = () => {
    setShowResponse(false);
    setCurrentResponse("");
  };

  if (isLoadingHistory || artifactsLoading) {
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
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
          
          {/* Stage Context - matches agent workspace exactly */}
          <p className="text-xs text-muted-foreground/50 mb-8">
            Stage {getStageNumber(buyer.current_stage)}: {buyer.current_stage || "Getting Started"}
          </p>

          {/* Response View - when user asks a question */}
          {showResponse ? (
            <div className="mb-16">
              {/* Back button */}
              <button
                onClick={handleBackToWorkspace}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                ← Back to workspace
              </button>

              {/* Response header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-violet-500 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">AgentGPT</span>
              </div>

              {/* Response content card - matches agent workspace */}
              <div className="bg-card border border-border/30 rounded-lg p-5 md:p-6">
                {isStreaming && !currentResponse ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2.5 prose-p:leading-relaxed prose-ul:my-2.5 prose-li:my-1">
                    <ReactMarkdown>{currentResponse || "..."}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Workspace View */
            <div className="space-y-10">
              
              {/* Section 1: Agent Guidance */}
              <section>
                <h2 className="text-xl md:text-2xl font-medium text-foreground mb-4">
                  {stageGuidance.title}
                </h2>

                {/* Greeting - no box, just text */}
                <div className="mb-6">
                  <p className="text-foreground mb-1.5">
                    Hi {firstName}! {stageGuidance.greeting}
                  </p>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    {stageGuidance.description}
                  </p>
                </div>

                {/* Subtle divider */}
                <div className="border-t border-border/20 pt-5">
                  <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide mb-3">Your Next Steps</h3>
                  <NextStepsList steps={stageGuidance.nextSteps} />
                </div>
              </section>

              {/* Section 2: Shared Documents from Agent */}
              {sharedArtifacts && sharedArtifacts.length > 0 && (
                <section className="border-t border-border/20 pt-8">
                  <h3 className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide mb-4">From Your Agent</h3>

                  <div className="space-y-8">
                    {sharedArtifacts.map((artifact, idx) => (
                      <ArtifactSection 
                        key={artifact.id}
                        artifact={artifact}
                        intro={idx === 0 ? `I've created this ${artifact.title.toLowerCase()} to help guide your home buying journey. Take a look and let me know if you have any questions!` : undefined}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Section 3: What's Next */}
              <section className="border-t border-border/20 pt-8">
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 text-primary/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">What's Next?</h3>
                    <p className="text-foreground/60 text-sm leading-relaxed">
                      {stageGuidance.whatsNext}
                    </p>
                  </div>
                </div>
              </section>

              {/* Empty state for no artifacts */}
              {(!sharedArtifacts || sharedArtifacts.length === 0) && (
                <section className="border-t border-border/20 pt-8">
                  <div className="text-center py-6">
                    <FileText className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/60">
                      Documents and guides from your agent will appear here
                    </p>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Input - matches agent workspace styling */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted/50 rounded-lg border border-border p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask AgentGPT anything about your home search..."
              className="flex-1 bg-transparent border-0 resize-none px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground min-h-[44px] max-h-[200px]"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-9 w-9 rounded-lg flex-shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            I can answer questions but can't take actions. Contact your agent for changes.
          </p>
        </div>
      </div>
    </div>
  );
}
