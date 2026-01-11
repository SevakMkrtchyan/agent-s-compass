import type { StageGroup, ConversationItem } from "@/types/conversation";
import type { Stage } from "@/types";
import { STAGES } from "@/types";

// Generate mock conversation data for a workspace
export function generateMockConversation(workspaceId: string, currentStage: Stage): StageGroup[] {
  const stages: StageGroup[] = STAGES.map((stageInfo) => ({
    stageId: stageInfo.stage,
    title: stageInfo.title,
    status: stageInfo.stage < currentStage 
      ? "completed" 
      : stageInfo.stage === currentStage 
        ? "current" 
        : "locked",
    items: [],
    isExpanded: stageInfo.stage === currentStage,
    startedAt: stageInfo.stage <= currentStage ? new Date(Date.now() - (currentStage - stageInfo.stage) * 7 * 24 * 60 * 60 * 1000) : undefined,
    completedAt: stageInfo.stage < currentStage ? new Date(Date.now() - (currentStage - stageInfo.stage - 1) * 7 * 24 * 60 * 60 * 1000) : undefined,
  }));

  // Add mock conversation items for completed and current stages
  stages.forEach((stage) => {
    if (stage.status === "locked") return;

    const baseTime = stage.startedAt || new Date();
    
    // Stage 0: Readiness & Expectations
    if (stage.stageId === 0) {
      stage.items = [
        {
          id: `${workspaceId}-s0-1`,
          type: "system-event",
          timestamp: new Date(baseTime.getTime()),
          stageId: 0,
          eventType: "stage-advanced",
          title: "Workspace Created",
          description: "New buyer workspace initialized",
        },
        {
          id: `${workspaceId}-s0-2`,
          type: "human-message",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 5),
          stageId: 0,
          sender: "agent",
          senderId: "agent-1",
          senderName: "John Smith",
          content: "Welcome! I've set up your buyer workspace. Let's start by confirming your financing status and discussing your home buying goals.",
          isImmutable: false,
        },
        {
          id: `${workspaceId}-s0-3`,
          type: "human-message",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 30),
          stageId: 0,
          sender: "buyer",
          senderId: "buyer-1",
          senderName: "Sarah Johnson",
          content: "Thank you! I'm pre-approved for $450,000 and looking for a 3-bedroom home in a good school district.",
          isImmutable: true,
        },
        {
          id: `${workspaceId}-s0-4`,
          type: "ai-explanation",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 35),
          stageId: 0,
          content: "Pre-approval is an excellent first step. This means a lender has reviewed your financial information and determined you're likely to be approved for a mortgage up to $450,000. This gives sellers confidence that you're a serious buyer who can secure financing.",
          context: "Buyer mentioned pre-approval status",
          requiresApproval: false,
          approvalStatus: "approved",
          isVisibleToBuyer: true,
        },
      ];
    }

    // Stage 1: Home Search
    if (stage.stageId === 1) {
      stage.items = [
        {
          id: `${workspaceId}-s1-1`,
          type: "system-event",
          timestamp: new Date(baseTime.getTime()),
          stageId: 1,
          eventType: "stage-advanced",
          title: "Stage Advanced to Home Search",
          description: "Financing confirmed, beginning property search",
        },
        {
          id: `${workspaceId}-s1-2`,
          type: "component-block",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 60),
          stageId: 1,
          blockType: "property-card",
          title: "123 Oak Street",
          data: {
            address: "123 Oak Street",
            price: 425000,
            bedrooms: 3,
            bathrooms: 2,
            sqft: 1850,
            daysOnMarket: 12,
          },
          isExpanded: false,
          linkedEntityId: "prop-1",
        },
        {
          id: `${workspaceId}-s1-3`,
          type: "human-message",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 65),
          stageId: 1,
          sender: "agent",
          senderId: "agent-1",
          senderName: "John Smith",
          content: "I've added a property that matches your criteria. It's been on market for 12 days which might give us some negotiating room.",
          isImmutable: false,
        },
        {
          id: `${workspaceId}-s1-4`,
          type: "human-message",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 120),
          stageId: 1,
          sender: "buyer",
          senderId: "buyer-1",
          senderName: "Sarah Johnson",
          content: "This looks great! What does 'days on market' mean and should I be concerned?",
          isImmutable: true,
        },
        {
          id: `${workspaceId}-s1-5`,
          type: "ai-explanation",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 121),
          stageId: 1,
          content: "Days on Market (DOM) indicates how long a property has been listed for sale. A higher DOM can sometimes signal an opportunity—sellers may be more motivated to negotiate. However, it's important to understand why a property hasn't sold: it could be pricing, condition, or simply market timing. I'll help you evaluate this property's specific situation.",
          context: "Buyer asked about days on market",
          requiresApproval: false,
          approvalStatus: "approved",
          isVisibleToBuyer: true,
        },
        {
          id: `${workspaceId}-s1-6`,
          type: "system-event",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 180),
          stageId: 1,
          eventType: "viewing-scheduled",
          title: "Viewing Scheduled",
          description: "123 Oak Street - Saturday at 2:00 PM",
        },
        {
          id: `${workspaceId}-s1-7`,
          type: "component-block",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 240),
          stageId: 1,
          blockType: "comp-table",
          title: "Comparable Sales Analysis",
          data: {
            subject: "123 Oak Street",
            comps: [
              { address: "456 Maple Ave", soldPrice: 418000, sqft: 1780, pricePerSqft: 235 },
              { address: "789 Elm Rd", soldPrice: 435000, sqft: 1920, pricePerSqft: 227 },
              { address: "321 Pine St", soldPrice: 422000, sqft: 1830, pricePerSqft: 231 },
            ],
          },
          isExpanded: false,
        },
      ];
    }

    // Stage 2: Offer Strategy (if applicable)
    if (stage.stageId === 2 && currentStage >= 2) {
      stage.items = [
        {
          id: `${workspaceId}-s2-1`,
          type: "system-event",
          timestamp: new Date(baseTime.getTime()),
          stageId: 2,
          eventType: "stage-advanced",
          title: "Stage Advanced to Offer Strategy",
          description: "Property selected, preparing offer scenarios",
        },
        {
          id: `${workspaceId}-s2-2`,
          type: "component-block",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 30),
          stageId: 2,
          blockType: "offer-summary",
          title: "Offer Scenario: 123 Oak Street",
          data: {
            scenarios: [
              { name: "Conservative", price: 410000, note: "Below asking, room for negotiation" },
              { name: "Competitive", price: 420000, note: "Near market value" },
              { name: "Aggressive", price: 430000, note: "Above asking for competitive edge" },
            ],
          },
          isExpanded: true,
          linkedEntityId: "offer-1",
        },
        {
          id: `${workspaceId}-s2-3`,
          type: "ai-explanation",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 35),
          stageId: 2,
          content: "Based on comparable sales data, the asking price of $425,000 aligns with market values. Given the 12 days on market, there may be flexibility. Each scenario above represents a different strategy: conservative offers leave room for back-and-forth negotiation, while aggressive offers signal strong intent to close quickly.",
          context: "Offer scenarios generated",
          requiresApproval: true,
          approvalStatus: "pending",
          isVisibleToBuyer: false,
        },
      ];
    }

    // Stage 3: Under Contract
    if (stage.stageId === 3 && currentStage >= 3) {
      stage.items = [
        {
          id: `${workspaceId}-s3-1`,
          type: "system-event",
          timestamp: new Date(baseTime.getTime()),
          stageId: 3,
          eventType: "offer-accepted",
          title: "Offer Accepted!",
          description: "Your offer of $420,000 has been accepted by the seller",
        },
        {
          id: `${workspaceId}-s3-2`,
          type: "component-block",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 60),
          stageId: 3,
          blockType: "task-checklist",
          title: "Under Contract Checklist",
          data: {
            tasks: [
              { name: "Order home inspection", completed: true },
              { name: "Review inspection report", completed: false },
              { name: "Finalize mortgage application", completed: false },
              { name: "Order appraisal", completed: false },
            ],
          },
          isExpanded: true,
        },
        {
          id: `${workspaceId}-s3-3`,
          type: "system-event",
          timestamp: new Date(baseTime.getTime() + 1000 * 60 * 120),
          stageId: 3,
          eventType: "document-uploaded",
          title: "Document Uploaded",
          description: "Home Inspection Report - 123 Oak Street",
        },
      ];
    }
  });

  return stages;
}

// Get pending approvals from conversation
export function getPendingApprovals(stages: StageGroup[]): ConversationItem[] {
  return stages.flatMap(stage => 
    stage.items.filter(item => 
      item.type === "ai-explanation" && 
      (item as any).approvalStatus === "pending"
    )
  );
}
