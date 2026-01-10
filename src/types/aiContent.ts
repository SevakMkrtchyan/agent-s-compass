export type AIContentType = 
  | 'general-education'
  | 'market-explanation'
  | 'pricing-analysis'
  | 'comp-analysis'
  | 'negotiation-strategy'
  | 'offer-scenario'
  | 'inspection-summary'
  | 'closing-explanation';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto-approved';

export interface AIContentItem {
  id: string;
  buyerId: string;
  type: AIContentType;
  title: string;
  content: string;
  stage: number;
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

// Content types that require agent approval before buyer sees them
export const SENSITIVE_CONTENT_TYPES: AIContentType[] = [
  'pricing-analysis',
  'comp-analysis',
  'negotiation-strategy',
  'offer-scenario',
];

export const CONTENT_TYPE_CONFIG: Record<AIContentType, {
  label: string;
  description: string;
  requiresApproval: boolean;
  icon: string;
}> = {
  'general-education': {
    label: 'General Education',
    description: 'General home buying information and process explanations',
    requiresApproval: false,
    icon: '📚',
  },
  'market-explanation': {
    label: 'Market Explanation',
    description: 'Overview of current market conditions',
    requiresApproval: false,
    icon: '📊',
  },
  'pricing-analysis': {
    label: 'Pricing Analysis',
    description: 'Detailed pricing recommendations and analysis',
    requiresApproval: true,
    icon: '💰',
  },
  'comp-analysis': {
    label: 'Comparable Analysis',
    description: 'Property comparisons and value assessments',
    requiresApproval: true,
    icon: '🏘️',
  },
  'negotiation-strategy': {
    label: 'Negotiation Strategy',
    description: 'Suggested negotiation approaches and tactics',
    requiresApproval: true,
    icon: '🤝',
  },
  'offer-scenario': {
    label: 'Offer Scenario',
    description: 'Hypothetical offer scenarios and outcomes',
    requiresApproval: true,
    icon: '📝',
  },
  'inspection-summary': {
    label: 'Inspection Summary',
    description: 'Summary of inspection findings',
    requiresApproval: false,
    icon: '🔍',
  },
  'closing-explanation': {
    label: 'Closing Explanation',
    description: 'Closing process and cost explanations',
    requiresApproval: false,
    icon: '✅',
  },
};

// Mock pending approvals for agent dashboard
export const mockPendingApprovals: AIContentItem[] = [
  {
    id: 'ai-1',
    buyerId: '1',
    type: 'comp-analysis',
    title: 'Comparable Properties for 123 Oak Street',
    content: 'Based on recent sales in the area, 123 Oak Street at $485,000 is priced competitively. Three comparable properties sold within the last 90 days:\n\n1. 145 Oak Street - $478,000 (1,820 sqft) - Sold 2 weeks ago\n2. 98 Maple Ave - $492,000 (1,900 sqft) - Sold 6 weeks ago\n3. 210 Cedar Lane - $469,000 (1,780 sqft) - Sold 8 weeks ago\n\nThe subject property offers strong value with updated finishes and a newer build year.',
    stage: 1,
    requiresApproval: true,
    approvalStatus: 'pending',
    createdAt: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'ai-2',
    buyerId: '5',
    type: 'offer-scenario',
    title: 'Offer Scenarios for 456 Maple Avenue',
    content: 'Three potential offer scenarios for consideration:\n\n**Conservative Offer ($600,000)**\n- 4% below asking, reasonable in current market\n- May need escalation clause\n\n**Competitive Offer ($620,000)**\n- Near asking price, stronger position\n- Include appraisal gap coverage\n\n**Aggressive Offer ($640,000)**\n- Above asking to stand out\n- Consider waiving some contingencies',
    stage: 2,
    requiresApproval: true,
    approvalStatus: 'pending',
    createdAt: new Date('2024-01-14T15:30:00'),
  },
  {
    id: 'ai-3',
    buyerId: '2',
    type: 'negotiation-strategy',
    title: 'Inspection Negotiation Strategy',
    content: 'Based on the inspection findings, here are recommended negotiation points:\n\n**High Priority (Safety/Major)**\n- HVAC system replacement: Request $8,000 credit\n- Roof repairs: Request seller repair before closing\n\n**Medium Priority**\n- Electrical panel update: Request $2,500 credit\n\n**Total Recommended Ask**: $10,500 credit or equivalent repairs',
    stage: 3,
    requiresApproval: true,
    approvalStatus: 'pending',
    createdAt: new Date('2024-01-14T09:15:00'),
  },
];
