import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks, isBefore, parseISO } from "date-fns";

// Map stage name to stage number (0-9)
const stageNameToNumber: Record<string, number> = {
  "Readiness & Expectations": 0,
  "Financing & Capability": 1,
  "Market Intelligence & Search Setup": 2,
  "Touring, Filtering & Convergence": 3,
  "Offer Strategy & Submission": 4,
  "Negotiation & Contract": 5,
  "Due Diligence & Inspections": 6,
  "Appraisal & Lending": 7,
  "Final Walkthrough & Preparation": 8,
  "Closing & Post-Close": 9,
  // Legacy fallbacks
  "Home Search": 1,
  "Offer Strategy": 4,
  "Post-Close": 9,
};

export interface ActionItem {
  id: string;
  type: "urgent" | "pending" | "completed";
  title: string;
  description: string;
  buyerId?: string;
  buyerName?: string;
}

export interface DashboardStats {
  totalBuyers: number;
  activeOffers: number;
  closedDeals: number;
  avgDaysToClose: number;
  totalVolume: number;
  taskCompletionRate: number;
}

export interface StageDistribution {
  stageNumber: number;
  stageName: string;
  count: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  offers: number;
  closed: number;
  properties: number;
}

export interface WeeklyTaskData {
  week: string;
  completed: number;
  pending: number;
}

const STAGE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(280, 87%, 50%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

// Fetch urgent action items from database
export function useActionQueue() {
  return useQuery({
    queryKey: ["action-queue"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const actions: ActionItem[] = [];

      // 1. Get overdue tasks (status = "To Do" AND due_date < today)
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("id, title, description, buyer_id, due_date")
        .eq("status", "To Do")
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5);

      // Get buyer names for overdue tasks
      if (overdueTasks && overdueTasks.length > 0) {
        const buyerIds = [...new Set(overdueTasks.map(t => t.buyer_id).filter(Boolean))];
        const { data: buyers } = await supabase
          .from("buyers")
          .select("id, name")
          .in("id", buyerIds);
        
        const buyerMap = new Map(buyers?.map(b => [b.id, b.name]) || []);
        
        for (const task of overdueTasks) {
          actions.push({
            id: `task-${task.id}`,
            type: "urgent",
            title: "Overdue Task",
            description: task.title,
            buyerId: task.buyer_id || undefined,
            buyerName: task.buyer_id ? buyerMap.get(task.buyer_id) : undefined,
          });
        }
      }

      // 2. Get pending offers (status = "Submitted" - waiting for response)
      const { data: pendingOffers } = await supabase
        .from("offers")
        .select(`
          id, 
          status, 
          offer_amount,
          buyer_id,
          property_id
        `)
        .in("status", ["Submitted", "Countered"])
        .order("updated_at", { ascending: false })
        .limit(5);

      if (pendingOffers && pendingOffers.length > 0) {
        const buyerIds = [...new Set(pendingOffers.map(o => o.buyer_id))];
        const propertyIds = [...new Set(pendingOffers.map(o => o.property_id).filter(Boolean))] as string[];
        
        const [{ data: buyers }, { data: properties }] = await Promise.all([
          supabase.from("buyers").select("id, name").in("id", buyerIds),
          propertyIds.length > 0 
            ? supabase.from("properties").select("id, address").in("id", propertyIds)
            : { data: [] as { id: string; address: string }[] }
        ]);
        
        const buyerMap = new Map<string, string>(buyers?.map(b => [b.id, b.name]) || []);
        const propertyMap = new Map<string, string>(properties?.map(p => [p.id, p.address]) || []);
        
        for (const offer of pendingOffers) {
          actions.push({
            id: `offer-${offer.id}`,
            type: offer.status === "Countered" ? "urgent" : "pending",
            title: offer.status === "Countered" ? "Counter Offer Received" : "Offer Pending Response",
            description: propertyMap.get(offer.property_id!) || `$${offer.offer_amount.toLocaleString()} offer`,
            buyerId: offer.buyer_id,
            buyerName: buyerMap.get(offer.buyer_id),
          });
        }
      }

      // 3. Get tasks due soon (within 3 days)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
      
      const { data: upcomingTasks } = await supabase
        .from("tasks")
        .select("id, title, description, buyer_id, due_date")
        .eq("status", "To Do")
        .gte("due_date", today)
        .lte("due_date", threeDaysStr)
        .order("due_date", { ascending: true })
        .limit(5);

      if (upcomingTasks && upcomingTasks.length > 0) {
        const buyerIds = [...new Set(upcomingTasks.map(t => t.buyer_id).filter(Boolean))];
        const { data: buyers } = await supabase
          .from("buyers")
          .select("id, name")
          .in("id", buyerIds);
        
        const buyerMap = new Map(buyers?.map(b => [b.id, b.name]) || []);
        
        for (const task of upcomingTasks) {
          actions.push({
            id: `upcoming-${task.id}`,
            type: "pending",
            title: "Task Due Soon",
            description: task.title,
            buyerId: task.buyer_id || undefined,
            buyerName: task.buyer_id ? buyerMap.get(task.buyer_id) : undefined,
          });
        }
      }

      // 4. Get recently completed tasks (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: completedTasks } = await supabase
        .from("tasks")
        .select("id, title, description, buyer_id, completed_at")
        .eq("status", "Complete")
        .gte("completed_at", yesterday.toISOString())
        .order("completed_at", { ascending: false })
        .limit(3);

      if (completedTasks && completedTasks.length > 0) {
        const buyerIds = [...new Set(completedTasks.map(t => t.buyer_id).filter(Boolean))];
        const { data: buyers } = await supabase
          .from("buyers")
          .select("id, name")
          .in("id", buyerIds);
        
        const buyerMap = new Map(buyers?.map(b => [b.id, b.name]) || []);
        
        for (const task of completedTasks) {
          actions.push({
            id: `completed-${task.id}`,
            type: "completed",
            title: "Task Completed",
            description: task.title,
            buyerId: task.buyer_id || undefined,
            buyerName: task.buyer_id ? buyerMap.get(task.buyer_id) : undefined,
          });
        }
      }

      // Sort: urgent first, then pending, then completed
      const typeOrder = { urgent: 0, pending: 1, completed: 2 };
      return actions.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
    },
    staleTime: 30000, // 30 seconds
  });
}

// Fetch dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all data in parallel
      const [
        { count: totalBuyers },
        { data: activeOffers },
        { data: closedBuyers },
        { data: acceptedOffers },
        { data: allTasks },
        { data: completedTasks },
      ] = await Promise.all([
        // Total buyers
        supabase.from("buyers").select("*", { count: "exact", head: true }),
        // Active offers
        supabase.from("offers")
          .select("id")
          .in("status", ["Draft", "Submitted", "Countered"]),
        // Closed deals (buyers at stage 9)
        supabase.from("buyers")
          .select("id, created_at, updated_at")
          .eq("current_stage", "Closing & Post-Close"),
        // Accepted offers for volume calculation
        supabase.from("offers")
          .select("offer_amount")
          .eq("status", "Accepted"),
        // All tasks for completion rate
        supabase.from("tasks").select("id"),
        // Completed tasks
        supabase.from("tasks").select("id").eq("status", "Complete"),
      ]);

      // Calculate avg days to close (simplified - uses created_at to updated_at for closed buyers)
      let avgDaysToClose = 0;
      if (closedBuyers && closedBuyers.length > 0) {
        const totalDays = closedBuyers.reduce((sum, buyer) => {
          const created = new Date(buyer.created_at);
          const updated = new Date(buyer.updated_at);
          return sum + Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDaysToClose = Math.round(totalDays / closedBuyers.length);
      }

      // Calculate total volume from accepted offers
      const totalVolume = acceptedOffers?.reduce((sum, o) => sum + Number(o.offer_amount), 0) || 0;

      // Calculate task completion rate
      const totalTaskCount = allTasks?.length || 0;
      const completedTaskCount = completedTasks?.length || 0;
      const taskCompletionRate = totalTaskCount > 0 
        ? Math.round((completedTaskCount / totalTaskCount) * 100) 
        : 0;

      return {
        totalBuyers: totalBuyers || 0,
        activeOffers: activeOffers?.length || 0,
        closedDeals: closedBuyers?.length || 0,
        avgDaysToClose,
        totalVolume,
        taskCompletionRate,
      };
    },
    staleTime: 60000, // 1 minute
  });
}

// Fetch buyers grouped by stage
export function useBuyersByStage() {
  return useQuery({
    queryKey: ["buyers-by-stage"],
    queryFn: async (): Promise<StageDistribution[]> => {
      const { data: buyers } = await supabase
        .from("buyers")
        .select("current_stage");

      if (!buyers) return [];

      // Count buyers per stage
      const stageCounts = new Map<number, number>();
      for (const buyer of buyers) {
        const stageNum = stageNameToNumber[buyer.current_stage || ""] ?? 1;
        stageCounts.set(stageNum, (stageCounts.get(stageNum) || 0) + 1);
      }

      // Build distribution array for all 10 stages
      const stageNames = [
        "Readiness",
        "Financing",
        "Market Intel",
        "Touring",
        "Offer Strategy",
        "Negotiation",
        "Due Diligence",
        "Appraisal",
        "Final Prep",
        "Closing",
      ];

      return stageNames.map((name, idx) => ({
        stageNumber: idx,
        stageName: name,
        count: stageCounts.get(idx) || 0,
        color: STAGE_COLORS[idx],
      }));
    },
    staleTime: 60000,
  });
}

// Fetch monthly chart data
export function useMonthlyChartData(monthsBack: number = 6) {
  return useQuery({
    queryKey: ["monthly-chart-data", monthsBack],
    queryFn: async (): Promise<MonthlyData[]> => {
      const result: MonthlyData[] = [];
      const now = new Date();

      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, "MMM");

        // Count offers created in this month
        const { count: offersCount } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        // Count closed deals (offers with status "Accepted") in this month
        const { count: closedCount } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("status", "Accepted")
          .gte("updated_at", monthStart.toISOString())
          .lte("updated_at", monthEnd.toISOString());

        // Count properties added in this month
        const { count: propertiesCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        result.push({
          month: monthLabel,
          offers: offersCount || 0,
          closed: closedCount || 0,
          properties: propertiesCount || 0,
        });
      }

      return result;
    },
    staleTime: 300000, // 5 minutes
  });
}

// Fetch weekly task completion data
export function useWeeklyTaskData(weeksBack: number = 4) {
  return useQuery({
    queryKey: ["weekly-task-data", weeksBack],
    queryFn: async (): Promise<WeeklyTaskData[]> => {
      const result: WeeklyTaskData[] = [];
      const now = new Date();

      for (let i = weeksBack - 1; i >= 0; i--) {
        const weekDate = subWeeks(now, i);
        const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
        const weekLabel = `W${weeksBack - i}`;

        // Count completed tasks in this week
        const { count: completedCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("status", "Complete")
          .gte("completed_at", weekStart.toISOString())
          .lte("completed_at", weekEnd.toISOString());

        // Count pending tasks created in this week that are still pending
        const { count: pendingCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .neq("status", "Complete")
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString());

        result.push({
          week: weekLabel,
          completed: completedCount || 0,
          pending: pendingCount || 0,
        });
      }

      return result;
    },
    staleTime: 300000,
  });
}

// Dynamic suggestions based on real data
export function useDynamicSuggestions() {
  return useQuery({
    queryKey: ["dynamic-suggestions"],
    queryFn: async () => {
      const suggestions: Array<{ id: string; label: string; action: string; command: string }> = [];
      
      // Check for pending artifacts needing approval
      const { count: pendingArtifacts } = await supabase
        .from("artifacts")
        .select("*", { count: "exact", head: true })
        .eq("visibility", "internal");

      if (pendingArtifacts && pendingArtifacts > 0) {
        suggestions.push({
          id: "pending-approvals",
          label: `Review ${pendingArtifacts} pending approval${pendingArtifacts > 1 ? 's' : ''}`,
          action: "review-approvals",
          command: "Review all pending approvals and drafts across my buyer pipeline - prioritize by urgency",
        });
      }

      // Check for properties with showings but no offers
      const { data: buyersWithProperties } = await supabase
        .from("buyer_properties")
        .select("buyer_id, property_id")
        .eq("viewed", true)
        .limit(10);

      if (buyersWithProperties && buyersWithProperties.length > 0) {
        const buyerIds = [...new Set(buyersWithProperties.map(bp => bp.buyer_id))];
        
        // Check which of these buyers have no offers
        const { data: buyersWithOffers } = await supabase
          .from("offers")
          .select("buyer_id")
          .in("buyer_id", buyerIds);
        
        const buyersWithOffersSet = new Set(buyersWithOffers?.map(o => o.buyer_id) || []);
        const buyersNeedingFollowUp = buyerIds.filter(id => !buyersWithOffersSet.has(id));
        
        if (buyersNeedingFollowUp.length > 0) {
          suggestions.push({
            id: "follow-up-properties",
            label: `Follow up on ${buyersNeedingFollowUp.length} buyer${buyersNeedingFollowUp.length > 1 ? 's' : ''} who viewed properties`,
            action: "follow-up",
            command: "Identify buyers who have toured properties but haven't made offers yet - suggest next steps",
          });
        }
      }

      // Check for buyers with properties but no showings scheduled
      const { data: propertiesNoShowing } = await supabase
        .from("buyer_properties")
        .select("buyer_id")
        .is("scheduled_showing_datetime", null)
        .eq("viewed", false)
        .limit(10);

      if (propertiesNoShowing && propertiesNoShowing.length > 0) {
        suggestions.push({
          id: "schedule-showings",
          label: "Schedule showings for saved properties",
          action: "schedule-showings",
          command: "Help me schedule showings for buyers who have saved properties but haven't toured them yet",
        });
      }

      // Always include these standard suggestions
      suggestions.push({
        id: "weekly-summary",
        label: "Generate weekly activity summary",
        action: "weekly-summary",
        command: "Generate a comprehensive weekly activity summary for all active buyers including key milestones and next steps",
      });

      suggestions.push({
        id: "pipeline-metrics",
        label: "View pipeline health metrics",
        action: "pipeline-metrics",
        command: "Analyze my current pipeline health - stage distribution, average time per stage, and bottlenecks",
      });

      return suggestions.slice(0, 4); // Return max 4 suggestions
    },
    staleTime: 60000,
  });
}
