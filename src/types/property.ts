export interface MLSProperty {
  id: string;
  mlsId?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  pricePerSqft?: number;
  daysOnMarket?: number;
  propertyType?: string;
  status: 'active' | 'pending' | 'sold' | 'withdrawn';
  description?: string;
  features?: string[];
  photos: string[];
  listingUrl?: string;
  mlsNumber?: string;
  listingAgent?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  lotSize?: string;
  rawData?: any;
}

export interface BuyerProperty {
  id: string;
  buyerId: string;
  propertyId: string;
  property?: MLSProperty;
  viewed: boolean;
  scheduledShowingDatetime?: string;
  favorited: boolean;
  archived: boolean;
  agentNotes?: string;
  aiAnalysis?: string;
  aiAnalysisGeneratedAt?: string;
  assignedAt: string;
}

export interface PropertySearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  propertyType?: string[];
  status?: string;
}

export interface BuyerProfile {
  id: string;
  name: string;
  type: 'first-time' | 'move-up' | 'investor' | 'downsizing';
  budget?: number;
  preApproval?: number;
  mustHaves?: string[];
  niceToHaves?: string[];
  preferredCities?: string[];
  agentNotes?: string;
}
