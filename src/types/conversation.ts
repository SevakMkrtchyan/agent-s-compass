import type { Stage } from "./index";

// ============================================
// CONVERSATION PRIMITIVES
// ============================================

export type MessageSender = "buyer" | "agent" | "system" | "ai";
export type ApprovalStatus = "pending" | "approved" | "rejected";

// Base message type
interface BaseConversationItem {
  id: string;
  timestamp: Date;
  stageId: Stage;
  isEdited?: boolean;
  editedAt?: Date;
  editedBy?: string;
}

// HumanMessage: Buyer or agent text messages
export interface HumanMessage extends BaseConversationItem {
  type: "human-message";
  sender: "buyer" | "agent";
  senderId: string;
  senderName: string;
  content: string;
  isImmutable: boolean; // Buyer messages are immutable
}

// AIExplanation: Educational responses only
export interface AIExplanation extends BaseConversationItem {
  type: "ai-explanation";
  content: string;
  context: string; // What triggered this explanation
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  isVisibleToBuyer: boolean;
}

// SystemEvent: Platform-generated, non-editable
export interface SystemEvent extends BaseConversationItem {
  type: "system-event";
  eventType: 
    | "stage-advanced" 
    | "offer-submitted" 
    | "offer-accepted"
    | "offer-rejected"
    | "document-uploaded" 
    | "property-added"
    | "task-completed"
    | "viewing-scheduled"
    | "contract-signed"
    | "closing-complete";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ComponentBlock: Inline, interactive components
export interface ComponentBlock extends BaseConversationItem {
  type: "component-block";
  blockType: 
    | "property-card" 
    | "comp-table" 
    | "offer-summary" 
    | "task-checklist"
    | "document-preview"
    | "viewing-schedule"
    | "cost-breakdown";
  title: string;
  data: Record<string, unknown>;
  isExpanded: boolean;
  linkedEntityId?: string; // ID of property, offer, etc.
}

// ApprovalAction: Agent approval of outbound AI content
export interface ApprovalAction extends BaseConversationItem {
  type: "approval-action";
  targetId: string; // ID of the content being approved
  targetType: "ai-explanation" | "ai-draft" | "document";
  status: ApprovalStatus;
  actionBy: string;
  actionByName: string;
  note?: string;
}

// Annotation: Agent or broker clarification linked to existing content
export interface Annotation extends BaseConversationItem {
  type: "annotation";
  linkedMessageId: string;
  authorId: string;
  authorName: string;
  authorRole: "agent" | "broker";
  content: string;
}

// Union type for all conversation items
export type ConversationItem = 
  | HumanMessage 
  | AIExplanation 
  | SystemEvent 
  | ComponentBlock 
  | ApprovalAction
  | Annotation;

// ============================================
// STAGE GROUP
// ============================================

export interface StageGroup {
  stageId: Stage;
  title: string;
  status: "locked" | "current" | "completed";
  items: ConversationItem[];
  isExpanded: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================
// WORKSPACE CONVERSATION STATE
// ============================================

export interface WorkspaceConversation {
  workspaceId: string;
  stages: StageGroup[];
  currentStageId: Stage;
}

// ============================================
// AI BEHAVIOR RULES
// ============================================

export interface AIConfig {
  autoAnswerBuyerQuestions: boolean;
  requireApprovalForAgentInitiated: boolean;
  allowedContentTypes: ("educational" | "summary" | "component")[];
  prohibitedTopics: ("legal-advice" | "pricing-advice" | "negotiation-strategy")[];
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  autoAnswerBuyerQuestions: true,
  requireApprovalForAgentInitiated: true,
  allowedContentTypes: ["educational", "summary", "component"],
  prohibitedTopics: ["legal-advice", "pricing-advice", "negotiation-strategy"],
};
