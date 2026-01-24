export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Buyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currentStage: Stage;
  createdAt: Date;
  lastActivity: Date;
  financingConfirmed: boolean;
  buyerType?: 'first-time' | 'move-up' | 'investor' | 'downsizing';
  marketContext?: string;
  // Extended profile fields for AgentGPT context
  pre_approval_status?: string | null;
  pre_approval_amount?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_cities?: string[] | null;
  property_types?: string[] | null;
  min_beds?: number | null;
  min_baths?: number | null;
  must_haves?: string | null;
  nice_to_haves?: string | null;
  agent_notes?: string | null;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  images: string[];
  description: string;
  features: string[];
  status: 'active' | 'pending' | 'sold';
  daysOnMarket: number;
  pricePerSqft: number;
  zillowUrl?: string;
}

export interface AIContent {
  id: string;
  type: 'explanation' | 'summary' | 'comparison' | 'hypothetical';
  content: string;
  stage: Stage;
  approved: boolean;
  createdAt: Date;
  approvedAt?: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEducational?: boolean;
}

export interface StageInfo {
  stage: Stage;
  title: string;
  description: string;
  agentTasks: string[];
  buyerTasks: string[];
  icon: string;
}

export const STAGES: StageInfo[] = [
  {
    stage: 0,
    title: 'Readiness & Expectations',
    description: 'Establish authority and trust through a structured consultation',
    agentTasks: ['Schedule consultation', 'Create buyer strategy brief'],
    buyerTasks: ['Complete consultation', 'Acknowledge expectations'],
    icon: '🎯',
  },
  {
    stage: 1,
    title: 'Financing & Capability',
    description: 'Confirm buying power and make buyer credible in market',
    agentTasks: ['Initiate pre-approval', 'Define budget bands'],
    buyerTasks: ['Submit pre-approval docs', 'Confirm budget'],
    icon: '💰',
  },
  {
    stage: 2,
    title: 'Market Intelligence & Search Setup',
    description: 'Educate buyer quickly, build a smart pipeline',
    agentTasks: ['Generate neighborhood brief', 'Set up search strategy'],
    buyerTasks: ['Review market intelligence', 'Confirm touring cadence'],
    icon: '🏘️',
  },
  {
    stage: 3,
    title: 'Touring, Filtering & Convergence',
    description: 'Maximize in-person evaluations and build shortlist',
    agentTasks: ['Schedule showings', 'Update property rankings'],
    buyerTasks: ['Tour properties', 'Provide feedback'],
    icon: '🏠',
  },
  {
    stage: 4,
    title: 'Offer Strategy & Submission',
    description: 'Craft competitive offers with strategic terms',
    agentTasks: ['Analyze comps', 'Draft offer strategy'],
    buyerTasks: ['Review offer terms', 'Approve submission'],
    icon: '📋',
  },
  {
    stage: 5,
    title: 'Negotiation & Contract',
    description: 'Navigate counter-offers and secure favorable terms',
    agentTasks: ['Analyze counter-offers', 'Prepare negotiation strategy'],
    buyerTasks: ['Review contract terms', 'Sign agreement'],
    icon: '🤝',
  },
  {
    stage: 6,
    title: 'Due Diligence & Inspections',
    description: 'Coordinate inspections and review disclosures',
    agentTasks: ['Schedule inspections', 'Draft repair requests'],
    buyerTasks: ['Review inspection reports', 'Approve repair negotiations'],
    icon: '🔍',
  },
  {
    stage: 7,
    title: 'Appraisal & Lending',
    description: 'Ensure property appraises at value and finalize loan',
    agentTasks: ['Prepare appraisal brief', 'Track loan conditions'],
    buyerTasks: ['Submit loan documents', 'Review appraisal results'],
    icon: '🏦',
  },
  {
    stage: 8,
    title: 'Final Walkthrough & Preparation',
    description: 'Verify property condition and prepare for closing',
    agentTasks: ['Schedule walkthrough', 'Create utility transfer checklist'],
    buyerTasks: ['Complete walkthrough', 'Arrange utilities'],
    icon: '👁️',
  },
  {
    stage: 9,
    title: 'Closing & Post-Close',
    description: 'Complete transaction and transition to ownership',
    agentTasks: ['Review closing docs', 'Generate post-close guidance'],
    buyerTasks: ['Sign documents', 'Receive keys'],
    icon: '🎉',
  },
];
