import { useState, useRef } from "react";
import { Loader2, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { PortalBuyer } from "@/pages/BuyerPortal";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { PortalContextBar } from "./PortalContextBar";
import { PortalSection, SectionContent, SectionMarkdown } from "./PortalSection";
import { PortalActionButton, PortalAcknowledge } from "./PortalActionButton";

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

// Artifact display component
interface ArtifactDisplayProps {
  artifact: {
    id: string;
    title: string;
    content: string;
    artifact_type: string;
    shared_at: string | null;
    created_at: string;
  };
}

function ArtifactDisplay({ artifact }: ArtifactDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isLongContent = artifact.content.length > 1500 || artifact.content.split('\n').length > 25;

  return (
    <div className="space-y-3">
      {/* Artifact header */}
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary/60" />
        <span className="text-sm font-medium text-foreground">{artifact.title}</span>
      </div>

      {/* Artifact content */}
      <div 
        className={cn(
          "bg-muted/20 rounded-lg px-4 py-4 relative",
          !isExpanded && isLongContent && "max-h-[300px] overflow-hidden"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground/80 prose-ul:my-2 prose-li:my-0.5 prose-li:text-foreground/80 prose-headings:my-2.5 prose-headings:font-medium prose-headings:text-foreground prose-h2:text-sm prose-h3:text-sm prose-strong:font-medium prose-strong:text-foreground">
          <ReactMarkdown>{artifact.content}</ReactMarkdown>
        </div>
        
        {/* Fade overlay when collapsed */}
        {!isExpanded && isLongContent && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted/20 to-transparent" />
        )}
      </div>

      {/* Expand/collapse for long content */}
      {isLongContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {isExpanded ? "Show less ↑" : "Show more →"}
        </button>
      )}
    </div>
  );
}

export function PortalWorkspace({ buyer }: PortalWorkspaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [acknowledgedSteps, setAcknowledgedSteps] = useState<Set<number>>(new Set());

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

  const handleAcknowledgeStep = (stepIndex: number) => {
    setAcknowledgedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  };

  if (artifactsLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-background">
        <PortalContextBar buyer={buyer} />
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Top Context Bar */}
      <PortalContextBar buyer={buyer} />

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-12">
          
          {/* Section 1: Welcome & Current Stage */}
          <PortalSection title={stageGuidance.title} status="current">
            <SectionContent>
              <p className="text-foreground leading-relaxed">
                Hi {firstName}! {stageGuidance.greeting}
              </p>
              <p className="text-foreground/70 leading-relaxed">
                {stageGuidance.description}
              </p>
            </SectionContent>
          </PortalSection>

          {/* Section 2: Your Next Steps */}
          <PortalSection title="Your Next Steps" status="current">
            <SectionContent>
              <div className="space-y-3">
                {stageGuidance.nextSteps.map((step, idx) => (
                  <PortalAcknowledge
                    key={idx}
                    label={step}
                    checked={acknowledgedSteps.has(idx)}
                    onChange={() => handleAcknowledgeStep(idx)}
                  />
                ))}
              </div>
              
              {acknowledgedSteps.size === stageGuidance.nextSteps.length && (
                <div className="pt-4">
                  <PortalActionButton
                    label="I've reviewed all steps"
                    variant="primary"
                    onClick={() => console.log("Steps acknowledged")}
                  />
                </div>
              )}
            </SectionContent>
          </PortalSection>

          {/* Section 3: Shared Documents */}
          {sharedArtifacts && sharedArtifacts.length > 0 && (
            <PortalSection title="From Your Agent" status="current">
              <SectionContent>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  I've prepared some materials to help guide you through this stage.
                </p>
                
                <div className="space-y-6">
                  {sharedArtifacts.map((artifact) => (
                    <ArtifactDisplay key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              </SectionContent>
            </PortalSection>
          )}

          {/* Section 4: What's Next */}
          <PortalSection title="What's Coming Up" status="upcoming">
            <SectionContent>
              <div className="flex items-start gap-3">
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <p className="text-foreground/60 leading-relaxed">
                  {stageGuidance.whatsNext}
                </p>
              </div>
            </SectionContent>
          </PortalSection>

          {/* Empty state for no artifacts */}
          {(!sharedArtifacts || sharedArtifacts.length === 0) && (
            <PortalSection title="Documents" status="upcoming">
              <SectionContent>
                <div className="text-center py-4">
                  <FileText className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/60">
                    Documents and guides from your agent will appear here
                  </p>
                </div>
              </SectionContent>
            </PortalSection>
          )}

        </div>
      </div>
    </div>
  );
}
