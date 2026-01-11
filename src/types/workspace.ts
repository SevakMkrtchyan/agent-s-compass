import type { Stage } from "./index";

export type UserRole = "agent" | "broker";

export type WorkspaceStatus = "active" | "under-contract" | "closed" | "archived";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  currentStage: Stage;
  status: WorkspaceStatus;
  assignedAgents: WorkspaceUser[];
  lastActivity: Date;
  createdAt: Date;
  isPinned?: boolean;
  openTasks: number;
  totalProperties: number;
  totalOffers: number;
  buyerType?: "first-time" | "move-up" | "investor" | "downsizing";
  marketContext?: string;
  financingConfirmed: boolean;
}

export interface WorkspaceMessage {
  id: string;
  workspaceId: string;
  senderId: string;
  senderName: string;
  senderRole: "agent" | "buyer" | "system";
  content: string;
  timestamp: Date;
  isAIGenerated: boolean;
  requiresApproval: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  messageType: "text" | "update" | "ai-draft" | "notification";
}

export const WORKSPACE_STATUS_CONFIG: Record<WorkspaceStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-success/10 text-success border-success/20" },
  "under-contract": { label: "Under Contract", color: "bg-info/10 text-info border-info/20" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border" },
  archived: { label: "Archived", color: "bg-secondary text-secondary-foreground border-border" },
};
