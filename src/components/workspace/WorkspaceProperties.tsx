import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Heart,
  ExternalLink,
  LayoutGrid,
  List,
  TrendingUp,
  Sparkles,
  BarChart3,
  Clock,
  DollarSign,
  Home,
  Loader2,
  X,
  Target,
  PieChart,
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  Archive,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  FileText,
  Share2,
  Info,
  Download,
} from "lucide-react";
import { mockProperties, mockBuyers } from "@/data/mockData";
import { Property } from "@/types";
import { cn } from "@/lib/utils";
import { usePropertyAnalysis } from "@/hooks/usePropertyAnalysis";

interface WorkspacePropertiesProps {
  buyerId: string;
  onAgentCommand?: (command: string) => void;
}

type StatusFilter = "all" | "active" | "viewed" | "scheduled" | "favorited" | "archived";
type SortOption = "recent" | "price-low" | "price-high" | "dom";
type SubTab = "properties" | "comparables" | "favorites";

// Extended property with buyer-specific data
interface BuyerProperty extends Property {
  viewed?: boolean;
  scheduled?: boolean;
  scheduledDate?: string;
  favorited?: boolean;
  archived?: boolean;
  agentNotes?: string;
  aiAnalysis?: string;
  aiAnalysisGeneratedAt?: string;
}

interface MarketSummary {
  avgPrice: number;
  avgPricePerSqft: number;
  avgDom: number;
  marketTemp: 'hot' | 'warm' | 'cool';
  totalComps: number;
  location: string;
  criteria: string;
}

interface PropertyAnalysis {
  propertyId: string;
  generatedAt: string;
  isGenerating: boolean;
  analysis: string | null;
}

export function WorkspaceProperties({ buyerId, onAgentCommand }: WorkspacePropertiesProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("properties");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [priceFilter, setPriceFilter] = useState<string>("any");
  const [bedsFilter, setBedsFilter] = useState<string>("any");
  
  // Get buyer info
  const buyer = mockBuyers.find(b => b.id === buyerId) || mockBuyers[0];
  
  // Property analysis hook
  const { generateAnalysis, isAnalyzing, analysis: streamedAnalysis } = usePropertyAnalysis();
  
  // Mock buyer properties with extended data
  const [properties, setProperties] = useState<BuyerProperty[]>(
    mockProperties.map((p, i) => ({
      ...p,
      viewed: i < 2,
      scheduled: i === 1,
      scheduledDate: i === 1 ? "2024-01-20T14:00:00" : undefined,
      favorited: i === 0 || i === 2,
      archived: false,
      agentNotes: i === 0 ? "Great backyard for their kids. Close to schools they wanted. Might need to act fast given low DOM." : "",
      aiAnalysis: undefined,
      aiAnalysisGeneratedAt: undefined,
    }))
  );
  
  const [selectedProperty, setSelectedProperty] = useState<BuyerProperty | null>(null);
  const [isGeneratingComps, setIsGeneratingComps] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Comparables tab state
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [propertyAnalyses, setPropertyAnalyses] = useState<Record<string, PropertyAnalysis>>({});
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(null);
  const [isLoadingMarketSummary, setIsLoadingMarketSummary] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const toggleFavorite = (propertyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProperties(prev => prev.map(p => 
      p.id === propertyId ? { ...p, favorited: !p.favorited } : p
    ));
  };

  const toggleViewed = (propertyId: string) => {
    setProperties(prev => prev.map(p => 
      p.id === propertyId ? { ...p, viewed: !p.viewed } : p
    ));
  };

  const archiveProperty = (propertyId: string) => {
    setProperties(prev => prev.map(p => 
      p.id === propertyId ? { ...p, archived: true } : p
    ));
  };

  const removeProperty = (propertyId: string) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    setSelectedProperty(null);
  };

  const handleAddProperty = () => {
    navigate(`/add-property?buyerId=${buyerId}`);
  };

  const handleScheduleShowing = (propertyId: string) => {
    setProperties(prev => prev.map(p => 
      p.id === propertyId 
        ? { ...p, scheduled: true, scheduledDate: new Date().toISOString() } 
        : p
    ));
  };

  const saveNotes = () => {
    if (selectedProperty) {
      setProperties(prev => prev.map(p => 
        p.id === selectedProperty.id ? { ...p, agentNotes: tempNotes } : p
      ));
      setSelectedProperty(prev => prev ? { ...prev, agentNotes: tempNotes } : null);
    }
    setEditingNotes(false);
  };

  // Generate market summary for comparables tab
  const generateMarketSummary = useCallback(async () => {
    setIsLoadingMarketSummary(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nonArchivedProperties = properties.filter(p => !p.archived);
    const avgPrice = nonArchivedProperties.reduce((sum, p) => sum + p.price, 0) / nonArchivedProperties.length;
    const avgPricePerSqft = nonArchivedProperties.reduce((sum, p) => sum + p.pricePerSqft, 0) / nonArchivedProperties.length;
    const avgDom = nonArchivedProperties.reduce((sum, p) => sum + p.daysOnMarket, 0) / nonArchivedProperties.length;
    
    const buyerBudget = 500000; // Default budget
    setMarketSummary({
      avgPrice: Math.round(avgPrice),
      avgPricePerSqft: Math.round(avgPricePerSqft),
      avgDom: Math.round(avgDom),
      marketTemp: avgDom < 14 ? 'hot' : avgDom < 30 ? 'warm' : 'cool',
      totalComps: 47,
      location: 'Austin, TX',
      criteria: `3bd, ${formatPrice(buyerBudget * 0.9)}-${formatPrice(buyerBudget * 1.1)}`,
    });
    setIsLoadingMarketSummary(false);
  }, [properties]);

  // Generate AI analysis for a specific property
  const handleGeneratePropertyAnalysis = useCallback(async (property: BuyerProperty) => {
    setPropertyAnalyses(prev => ({
      ...prev,
      [property.id]: {
        propertyId: property.id,
        generatedAt: new Date().toISOString(),
        isGenerating: true,
        analysis: null,
      }
    }));

    const buyerProfile = {
      id: buyer.id,
      name: buyer.name,
      type: (buyer.buyerType || 'first-time') as 'first-time' | 'move-up' | 'investor' | 'downsizing',
      budget: 500000,
      preApproval: 475000,
      mustHaves: ['Move-in ready', 'Good schools'],
      niceToHaves: ['Updated kitchen', 'Fenced yard'],
      preferredCities: ['Austin'],
      agentNotes: property.agentNotes,
    };

    const mlsProperty = {
      id: property.id,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      yearBuilt: property.yearBuilt,
      pricePerSqft: property.pricePerSqft,
      daysOnMarket: property.daysOnMarket,
      propertyType: 'Single Family',
      status: property.status as 'active' | 'pending' | 'sold' | 'withdrawn',
      description: property.description,
      features: property.features,
      photos: property.images,
    };

    // Mock comparables
    const comparables = properties
      .filter(p => p.id !== property.id && !p.archived)
      .slice(0, 4)
      .map(p => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        sqft: p.sqft,
        pricePerSqft: p.pricePerSqft,
        daysOnMarket: p.daysOnMarket,
        status: p.status as 'active' | 'pending' | 'sold' | 'withdrawn',
        photos: p.images,
      }));

    let fullAnalysis = "";
    
    try {
      const result = await generateAnalysis(
        mlsProperty,
        buyerProfile,
        comparables,
        (chunk) => {
          fullAnalysis += chunk;
          setPropertyAnalyses(prev => ({
            ...prev,
            [property.id]: {
              ...prev[property.id],
              analysis: fullAnalysis,
            }
          }));
        }
      );

      setPropertyAnalyses(prev => ({
        ...prev,
        [property.id]: {
          propertyId: property.id,
          generatedAt: new Date().toISOString(),
          isGenerating: false,
          analysis: result || fullAnalysis,
        }
      }));

      // Also update the property's aiAnalysis
      setProperties(prev => prev.map(p => 
        p.id === property.id 
          ? { ...p, aiAnalysis: result || fullAnalysis, aiAnalysisGeneratedAt: new Date().toISOString() } 
          : p
      ));
    } catch (error) {
      setPropertyAnalyses(prev => ({
        ...prev,
        [property.id]: {
          ...prev[property.id],
          isGenerating: false,
          analysis: "Failed to generate analysis. Please try again.",
        }
      }));
    }
  }, [buyer, properties, generateAnalysis]);

  // Load market summary when comparables tab is active
  useEffect(() => {
    if (activeSubTab === "comparables" && !marketSummary && !isLoadingMarketSummary) {
      generateMarketSummary();
    }
  }, [activeSubTab, marketSummary, isLoadingMarketSummary, generateMarketSummary]);

  // Apply filters
  const filteredProperties = properties.filter(p => {
    if (p.archived && statusFilter !== "archived") return false;
    if (statusFilter === "viewed" && !p.viewed) return false;
    if (statusFilter === "scheduled" && !p.scheduled) return false;
    if (statusFilter === "favorited" && !p.favorited) return false;
    if (statusFilter === "archived" && !p.archived) return false;
    if (statusFilter === "active" && p.status !== "active") return false;
    return true;
  });

  // Apply sort
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortOption) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "dom": return a.daysOnMarket - b.daysOnMarket;
      default: return 0;
    }
  });

  const favoriteCount = properties.filter(p => p.favorited && !p.archived).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setPriceFilter("any");
    setBedsFilter("any");
  };

  const getStatusBadges = (property: BuyerProperty) => {
    const badges: { label: string; className: string; icon?: React.ReactNode }[] = [];
    
    if (property.status === "active") {
      badges.push({ label: "Active", className: "bg-emerald-500/90 text-white border-0" });
    } else if (property.status === "pending") {
      badges.push({ label: "Pending", className: "bg-amber-500/90 text-white border-0" });
    }
    
    if (property.scheduled) {
      badges.push({ label: "Scheduled", className: "bg-violet-500/90 text-white border-0", icon: <Clock className="h-3 w-3" /> });
    }
    
    if (property.favorited) {
      badges.push({ label: "Favorited", className: "bg-amber-400/90 text-white border-0", icon: <Star className="h-3 w-3" /> });
    }
    
    if (property.archived) {
      badges.push({ label: "Archived", className: "bg-muted text-muted-foreground" });
    }
    
    return badges;
  };

  const PropertyCard = ({ property }: { property: BuyerProperty }) => {
    const badges = getStatusBadges(property);
    
    return (
      <div 
        className="bg-card border border-border overflow-hidden hover:border-foreground/20 transition-all cursor-pointer group"
        onClick={() => setSelectedProperty(property)}
      >
        <div className="relative aspect-video">
          <img
            src={property.images[0]}
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {badges.slice(0, 2).map((badge, i) => (
              <Badge key={i} className={cn("capitalize text-xs font-normal gap-1", badge.className)}>
                {badge.icon}
                {badge.label}
              </Badge>
            ))}
          </div>
          <button
            className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
            onClick={(e) => toggleFavorite(property.id, e)}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                property.favorited
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              )}
            />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-foreground">{formatPrice(property.price)}</h3>
            <span className="text-xs text-muted-foreground">
              ${property.pricePerSqft}/sqft
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3 w-3" />
            {property.address}, {property.city}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              {property.sqft.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {property.daysOnMarket}d
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProperty(property);
              }}
            >
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="px-2" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toggleViewed(property.id)}>
                  {property.viewed ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {property.viewed ? "Mark as unviewed" : "Mark as viewed"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleScheduleShowing(property.id)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule showing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFavorite(property.id)}>
                  <Heart className="h-4 w-4 mr-2" />
                  {property.favorited ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {property.zillowUrl && (
                  <DropdownMenuItem onClick={() => window.open(property.zillowUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Zillow
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => archiveProperty(property.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive property
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => removeProperty(property.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  const PropertyListRow = ({ property }: { property: BuyerProperty }) => {
    const badges = getStatusBadges(property);
    
    return (
      <div 
        className="flex items-center gap-4 p-4 bg-card border border-border hover:border-foreground/20 transition-all cursor-pointer"
        onClick={() => setSelectedProperty(property)}
      >
        <img
          src={property.images[0]}
          alt={property.address}
          className="w-20 h-14 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{property.address}</span>
            <span className="text-sm text-muted-foreground">{property.city}, {property.state} {property.zipCode}</span>
          </div>
          <div className="flex items-center gap-2">
            {badges.slice(0, 2).map((badge, i) => (
              <Badge key={i} className={cn("capitalize text-xs font-normal gap-1", badge.className)}>
                {badge.label}
              </Badge>
            ))}
            {property.favorited && (
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatPrice(property.price)}</p>
        </div>
        <div className="w-16 text-center text-sm text-muted-foreground">
          {property.bedrooms} bd
        </div>
        <div className="w-16 text-center text-sm text-muted-foreground">
          {property.bathrooms} ba
        </div>
        <div className="w-20 text-center text-sm text-muted-foreground">
          {property.sqft.toLocaleString()}
        </div>
        <div className="w-20 text-center text-sm text-muted-foreground">
          ${property.pricePerSqft}
        </div>
        <div className="w-16 text-center text-sm text-muted-foreground">
          {property.daysOnMarket}d
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedProperty(property); }}>
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="px-2" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleViewed(property.id)}>
                {property.viewed ? "Mark as unviewed" : "Mark as viewed"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleScheduleShowing(property.id)}>
                Schedule showing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFavorite(property.id)}>
                {property.favorited ? "Remove from favorites" : "Add to favorites"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => archiveProperty(property.id)}>
                Archive property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // AI Analysis Renderer
  const AIAnalysisContent = ({ analysis, generatedAt }: { analysis: string; generatedAt?: string }) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Generated {generatedAt ? new Date(generatedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }) : 'just now'} • Customized for {buyer.name}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {analysis.split('\n').map((line, i) => {
            // Handle headers
            if (line.startsWith('## ')) {
              return <h3 key={i} className="text-base font-semibold mt-6 mb-3 text-foreground">{line.slice(3)}</h3>;
            }
            if (line.startsWith('### ')) {
              return <h4 key={i} className="text-sm font-medium mt-4 mb-2 text-foreground">{line.slice(4)}</h4>;
            }
            // Handle bullet points
            if (line.startsWith('- ') || line.startsWith('• ')) {
              const content = line.slice(2);
              const isPositive = content.startsWith('✅') || content.includes('Strength');
              const isWarning = content.startsWith('⚠️') || content.includes('Consider');
              return (
                <div key={i} className={cn(
                  "flex items-start gap-2 py-1",
                  isPositive && "text-emerald-600 dark:text-emerald-400",
                  isWarning && "text-amber-600 dark:text-amber-400"
                )}>
                  <span className="mt-1">•</span>
                  <span>{content}</span>
                </div>
              );
            }
            // Handle numbered lists
            if (/^\d+\.\s/.test(line)) {
              return <div key={i} className="py-1 pl-4 text-muted-foreground">{line}</div>;
            }
            // Handle bold text
            if (line.includes('**')) {
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <p key={i} className="py-1 text-muted-foreground">
                  {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part)}
                </p>
              );
            }
            // Regular paragraphs
            if (line.trim()) {
              return <p key={i} className="py-1 text-muted-foreground">{line}</p>;
            }
            return <div key={i} className="h-2" />;
          })}
        </div>
      </div>
    );
  };

  // Comparable Properties Table
  const ComparablePropertiesTable = ({ selectedProperty, comparables }: { selectedProperty: BuyerProperty; comparables: BuyerProperty[] }) => {
    const allProps = [selectedProperty, ...comparables];
    
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Address</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Beds</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Baths</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sqft</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">$/Sqft</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {allProps.map((prop, i) => {
              const isSelected = prop.id === selectedProperty.id;
              return (
                <tr key={prop.id} className={cn(
                  "border-b border-border last:border-0",
                  isSelected && "bg-primary/5 font-medium"
                )}>
                  <td className="py-3 px-4">
                    <span className={cn(isSelected && "font-semibold")}>{prop.address}</span>
                    {isSelected && <Badge className="ml-2 text-xs" variant="secondary">Selected</Badge>}
                  </td>
                  <td className={cn("text-right py-3 px-4", isSelected && "font-semibold")}>
                    {formatPrice(prop.price)}
                  </td>
                  <td className="text-center py-3 px-4">{prop.bedrooms}</td>
                  <td className="text-center py-3 px-4">{prop.bathrooms}</td>
                  <td className="text-right py-3 px-4">{prop.sqft.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">${prop.pricePerSqft}</td>
                  <td className="text-center py-3 px-4">
                    <Badge variant="outline" className={cn(
                      "capitalize text-xs",
                      prop.status === "active" && "bg-emerald-500/10 text-emerald-600 border-emerald-200",
                      prop.status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-200",
                      prop.status === "sold" && "bg-muted text-muted-foreground"
                    )}>
                      {isSelected ? "Active" : prop.status || "Sold"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const PropertyDetailModal = () => {
    if (!selectedProperty) return null;

    const badges = getStatusBadges(selectedProperty);
    const images = selectedProperty.images || [];
    const propertyAnalysis = propertyAnalyses[selectedProperty.id];

    return (
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button 
              onClick={() => setSelectedProperty(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Properties
            </button>
            <button
              onClick={() => setSelectedProperty(null)}
              className="p-2 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ScrollArea className="max-h-[calc(90vh-4rem)]">
            <div className="p-6 space-y-6">
              {/* Property Title */}
              <div>
                <h2 className="text-2xl font-semibold">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}</h2>
                <p className="text-3xl font-bold mt-2">{formatPrice(selectedProperty.price)}</p>
              </div>

              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={images[currentImageIndex] || images[0]}
                    alt={selectedProperty.address}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          "w-16 h-12 rounded overflow-hidden flex-shrink-0 border-2 transition-colors",
                          currentImageIndex === i ? "border-primary" : "border-transparent"
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Overview */}
              <div>
                <h3 className="font-medium mb-4">Property Overview</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Bed className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{selectedProperty.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Beds</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Bath className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{selectedProperty.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Baths</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Square className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{selectedProperty.sqft.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sq Ft</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Home className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{selectedProperty.yearBuilt}</p>
                    <p className="text-xs text-muted-foreground">Built</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">${selectedProperty.pricePerSqft}</p>
                    <p className="text-xs text-muted-foreground">$/sqft</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="font-medium">{selectedProperty.daysOnMarket}</p>
                    <p className="text-xs text-muted-foreground">Days</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProperty.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedProperty.description}</p>
                </div>
              )}

              {/* Features */}
              {selectedProperty.features && selectedProperty.features.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Property Features</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedProperty.features.map((feature, i) => (
                      <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border" />

              {/* Buyer Status & Actions */}
              <div>
                <h3 className="font-medium mb-4">Buyer Status & Actions</h3>
                <p className="text-sm text-muted-foreground mb-3">For: {buyer.name}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    {selectedProperty.viewed ? (
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" /> Viewed by buyer
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> Not viewed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProperty.scheduled ? (
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="h-3 w-3" /> Showing scheduled
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleScheduleShowing(selectedProperty.id)}>
                        <Calendar className="h-3 w-3 mr-1" /> Schedule
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant={selectedProperty.favorited ? "secondary" : "outline"}
                      onClick={() => toggleFavorite(selectedProperty.id)}
                    >
                      <Heart className={cn("h-3 w-3 mr-1", selectedProperty.favorited && "fill-red-500 text-red-500")} />
                      {selectedProperty.favorited ? "Favorited" : "Favorite"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Agent Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Agent Notes <span className="text-muted-foreground font-normal text-sm">(Private)</span></h3>
                  {!editingNotes && (
                    <Button size="sm" variant="ghost" onClick={() => { setTempNotes(selectedProperty.agentNotes || ""); setEditingNotes(true); }}>
                      Edit Notes
                    </Button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Add private notes about this property..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveNotes}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground min-h-[60px]">
                    {selectedProperty.agentNotes || "No notes added yet."}
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* AI Market Analysis */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">AI Market Analysis</h3>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleGeneratePropertyAnalysis(selectedProperty)}
                    disabled={propertyAnalysis?.isGenerating}
                  >
                    {propertyAnalysis?.isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        {propertyAnalysis?.analysis || selectedProperty.aiAnalysis ? 'Regenerate' : 'Generate'} Analysis
                      </>
                    )}
                  </Button>
                </div>
                
                {(propertyAnalysis?.analysis || selectedProperty.aiAnalysis) ? (
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <AIAnalysisContent 
                      analysis={propertyAnalysis?.analysis || selectedProperty.aiAnalysis || ""} 
                      generatedAt={propertyAnalysis?.generatedAt || selectedProperty.aiAnalysisGeneratedAt}
                    />
                    
                    {/* Disclaimer */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <p>
                          This analysis is AI-generated for informational purposes only. Agent should verify all data and use professional judgment. Not a substitute for CMA, appraisal, or inspection.
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-3 w-3" />
                        Export as PDF
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="h-3 w-3" />
                        Publish to Buyer Portal
                      </Button>
                    </div>
                  </div>
                ) : propertyAnalysis?.isGenerating ? (
                  <div className="p-8 border border-border rounded-lg bg-muted/30 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-sm text-muted-foreground">Generating comprehensive analysis...</p>
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-border rounded-lg bg-muted/30 text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">No analysis generated yet</p>
                    <Button 
                      size="sm" 
                      onClick={() => handleGeneratePropertyAnalysis(selectedProperty)}
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Generate AI Analysis
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 p-4 border-t border-border">
            {selectedProperty.zillowUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(selectedProperty.zillowUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Zillow
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleScheduleShowing(selectedProperty.id)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Showing
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => archiveProperty(selectedProperty.id)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button variant="destructive" size="sm" onClick={() => removeProperty(selectedProperty.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Comparables Tab Content
  const ComparablesTabContent = () => {
    const nonArchivedProperties = properties.filter(p => !p.archived);
    
    return (
      <div className="space-y-6">
        {/* Market Summary Header */}
        <div className="p-6 border border-border rounded-lg bg-muted/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-foreground">Market Analysis for {buyer.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Budget: {formatPrice(450000)}-{formatPrice(500000)} • 
                Looking for: Move-in ready, good schools
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateMarketSummary}
              disabled={isLoadingMarketSummary}
            >
              {isLoadingMarketSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          {marketSummary ? (
            <>
              <h4 className="text-sm font-medium mb-3">Market Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">Average Price</span>
                  </div>
                  <p className="font-semibold">{formatPrice(marketSummary.avgPrice)}</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Square className="h-4 w-4" />
                    <span className="text-xs">Average $/sqft</span>
                  </div>
                  <p className="font-semibold">${marketSummary.avgPricePerSqft}</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Average DOM</span>
                  </div>
                  <p className="font-semibold">{marketSummary.avgDom} days</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-xs">Market Temperature</span>
                  </div>
                  <p className="font-semibold flex items-center gap-1">
                    {marketSummary.marketTemp === 'hot' && <span className="text-orange-500">🔥 Hot</span>}
                    {marketSummary.marketTemp === 'warm' && <span className="text-amber-500">🌡️ Warm</span>}
                    {marketSummary.marketTemp === 'cool' && <span className="text-blue-500">❄️ Cool</span>}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({marketSummary.marketTemp === 'hot' ? 'High competition' : marketSummary.marketTemp === 'warm' ? 'Moderate' : 'Buyer\'s market'})
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Based on {marketSummary.totalComps} similar properties in {marketSummary.location} ({marketSummary.criteria})
              </p>
            </>
          ) : isLoadingMarketSummary ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
        </div>

        {/* Property-Specific Comparables */}
        <div>
          <h4 className="font-medium mb-4">Property-Specific Comparables</h4>
          
          {nonArchivedProperties.length > 0 ? (
            <div className="space-y-3">
              {nonArchivedProperties.map((property) => {
                const propertyAnalysis = propertyAnalyses[property.id];
                const isExpanded = expandedProperty === property.id;
                const comparables = nonArchivedProperties.filter(p => p.id !== property.id).slice(0, 4);
                
                return (
                  <Collapsible 
                    key={property.id} 
                    open={isExpanded}
                    onOpenChange={() => setExpandedProperty(isExpanded ? null : property.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <img 
                            src={property.images[0]} 
                            alt={property.address}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div className="text-left">
                            <p className="font-medium">{property.address}</p>
                            <p className="text-sm text-muted-foreground">{formatPrice(property.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {property.aiAnalysis || propertyAnalysis?.analysis ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Analysis Ready
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No Analysis
                            </Badge>
                          )}
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-2 p-6 bg-muted/30 border border-border rounded-lg space-y-6">
                        {/* Comparable Properties Table */}
                        <div>
                          <h5 className="text-sm font-medium mb-3">Comparable Properties</h5>
                          <ComparablePropertiesTable 
                            selectedProperty={property} 
                            comparables={comparables} 
                          />
                        </div>
                        
                        {/* AI Analysis Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              AI-Generated Comparative Analysis
                            </h5>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGeneratePropertyAnalysis(property);
                              }}
                              disabled={propertyAnalysis?.isGenerating}
                            >
                              {propertyAnalysis?.isGenerating ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-2" />
                                  {propertyAnalysis?.analysis || property.aiAnalysis ? 'Regenerate' : 'Generate'}
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {(propertyAnalysis?.analysis || property.aiAnalysis) ? (
                            <div className="p-4 bg-background border border-border rounded-lg">
                              <AIAnalysisContent 
                                analysis={propertyAnalysis?.analysis || property.aiAnalysis || ""} 
                                generatedAt={propertyAnalysis?.generatedAt || property.aiAnalysisGeneratedAt}
                              />
                              
                              {/* Disclaimer */}
                              <div className="mt-6 pt-4 border-t border-border">
                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <p>
                                    This analysis is AI-generated for informational purposes only. Agent should verify all data and use professional judgment.
                                  </p>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedProperty(property)}
                                >
                                  View Full Analysis
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Download className="h-3 w-3" />
                                  Export as PDF
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Share2 className="h-3 w-3" />
                                  Publish to Buyer Portal
                                </Button>
                              </div>
                            </div>
                          ) : propertyAnalysis?.isGenerating ? (
                            <div className="p-8 bg-background border border-border rounded-lg text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                              <p className="text-sm text-muted-foreground">Generating comprehensive analysis...</p>
                            </div>
                          ) : (
                            <div className="p-8 bg-background border border-dashed border-border rounded-lg text-center">
                              <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-3">Click "Generate" to create AI comparative analysis</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">No properties to compare</p>
              <p className="text-xs mt-1">Add properties to the workspace to generate comparables</p>
              <Button size="sm" className="mt-4" onClick={handleAddProperty}>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col -mx-6 -mt-6">
      {/* Header with Sub-tabs */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button 
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              activeSubTab === "properties" 
                ? "font-medium text-foreground border-b-2 border-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSubTab("properties")}
          >
            Properties
          </button>
          <button 
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              activeSubTab === "comparables" 
                ? "font-medium text-foreground border-b-2 border-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSubTab("comparables")}
          >
            Comparables
          </button>
          <button 
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              activeSubTab === "favorites" 
                ? "font-medium text-foreground border-b-2 border-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveSubTab("favorites")}
          >
            Favorites ({favoriteCount})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "p-2 transition-colors",
              viewMode === "grid" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className={cn(
              "p-2 transition-colors",
              viewMode === "list" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </button>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="dom">Days on Market</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            className="gap-2 ml-2"
            onClick={handleAddProperty}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {activeSubTab === "properties" && (
        <div className="px-6 py-3 border-b border-border flex items-center gap-3 bg-muted/30">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="favorited">Favorited</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Price</SelectItem>
              <SelectItem value="0-300k">Under $300K</SelectItem>
              <SelectItem value="300k-500k">$300K - $500K</SelectItem>
              <SelectItem value="500k-750k">$500K - $750K</SelectItem>
              <SelectItem value="750k+">$750K+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={bedsFilter} onValueChange={setBedsFilter}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Beds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Beds</SelectItem>
              <SelectItem value="1+">1+</SelectItem>
              <SelectItem value="2+">2+</SelectItem>
              <SelectItem value="3+">3+</SelectItem>
              <SelectItem value="4+">4+</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== "all" || priceFilter !== "any" || bedsFilter !== "any") && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeSubTab === "properties" && (
            <>
              {sortedProperties.length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedProperties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* List Header */}
                    <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                      <div className="w-20">Photo</div>
                      <div className="flex-1">Address</div>
                      <div className="w-24 text-right">Price</div>
                      <div className="w-16 text-center">Beds</div>
                      <div className="w-16 text-center">Baths</div>
                      <div className="w-20 text-center">Sqft</div>
                      <div className="w-20 text-center">$/sqft</div>
                      <div className="w-16 text-center">DOM</div>
                      <div className="w-24"></div>
                    </div>
                    {sortedProperties.map((property) => (
                      <PropertyListRow key={property.id} property={property} />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {statusFilter !== "all" ? (
                    <>
                      <p className="text-sm font-medium">No properties match your filters</p>
                      <p className="text-xs mt-1">Try adjusting your selection or</p>
                      <Button variant="link" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">No properties added yet</p>
                      <p className="text-xs mt-1 mb-3">Click "+ Add Property" to search listings or paste a link to get started with AI-powered property analysis.</p>
                      <Button size="sm" onClick={handleAddProperty}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {activeSubTab === "comparables" && <ComparablesTabContent />}

          {activeSubTab === "favorites" && (
            <>
              {/* Favorites Header */}
              <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  Favorited Properties ({favoriteCount})
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Properties marked as favorites by you or {buyer.name}
                </p>
              </div>

              {favoriteCount > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {properties
                      .filter((p) => p.favorited && !p.archived)
                      .map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* List Header */}
                    <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
                      <div className="w-20">Photo</div>
                      <div className="flex-1">Address</div>
                      <div className="w-24 text-right">Price</div>
                      <div className="w-16 text-center">Beds</div>
                      <div className="w-16 text-center">Baths</div>
                      <div className="w-20 text-center">Sqft</div>
                      <div className="w-20 text-center">$/sqft</div>
                      <div className="w-16 text-center">DOM</div>
                      <div className="w-24"></div>
                    </div>
                    {properties
                      .filter((p) => p.favorited && !p.archived)
                      .map((property) => (
                        <PropertyListRow key={property.id} property={property} />
                      ))}
                  </div>
                )
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">No favorite properties yet</p>
                  <p className="text-xs mt-1 mb-1">Click the ♡ icon on any property to add it to favorites.</p>
                  <p className="text-xs">Favorited properties are highlighted for this buyer.</p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Property Detail Modal */}
      <PropertyDetailModal />
    </div>
  );
}
