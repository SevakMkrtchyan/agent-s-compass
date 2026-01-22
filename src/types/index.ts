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
    description: 'Set the foundation for your home buying journey',
    agentTasks: ['Create workspace', 'Select buyer type', 'Generate orientation'],
    buyerTasks: ['Read orientation', 'Confirm financing status'],
    icon: '🎯',
  },
  {
    stage: 1,
    title: 'Home Search',
    description: 'Discover properties and understand the market',
    agentTasks: ['Select properties', 'Generate presentations', 'Approve AI explanations'],
    buyerTasks: ['Review properties', 'Ask questions', 'Compare listings'],
    icon: '🏠',
  },
  {
    stage: 2,
    title: 'Offer Strategy',
    description: 'Prepare and explore offer scenarios',
    agentTasks: ['Prepare offer scenarios', 'Generate explanations', 'Approve content'],
    buyerTasks: ['Review scenarios', 'Explore hypotheticals'],
    icon: '📝',
  },
  {
    stage: 3,
    title: 'Under Contract',
    description: 'Navigate inspections and contingencies',
    agentTasks: ['Upload inspection reports', 'Generate summaries', 'Manage timelines'],
    buyerTasks: ['Review reports', 'Understand contingencies'],
    icon: '📋',
  },
  {
    stage: 4,
    title: 'Closing Preparation',
    description: 'Prepare for the final steps',
    agentTasks: ['Prepare closing checklist', 'Generate explanations', 'Finalize details'],
    buyerTasks: ['Review checklist', 'Understand closing costs'],
    icon: '✅',
  },
  {
    stage: 5,
    title: 'Closing & Post-Close',
    description: 'Complete the transaction and transition to ownership',
    agentTasks: ['Upload closing docs', 'Generate post-close guidance'],
    buyerTasks: ['Review documents', 'Understand ownership responsibilities'],
    icon: '🎉',
  },
];
