import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ChevronRight, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { mockWorkspaces } from "@/data/workspaceData";
import { STAGES } from "@/types";

// Plain text suggestions - global actions
const globalSuggestions = [
  { 
    id: "1", 
    label: "Create a new buyer workspace", 
    action: "create-workspace",
    command: "Create a new buyer workspace and draft the initial buyer representation agreement (BR-11) for signature"
  },
  { 
    id: "2", 
    label: "Review pending approvals across all buyers", 
    action: "review-approvals",
    command: "Review all pending approvals and drafts across my buyer pipeline - prioritize by urgency"
  },
  { 
    id: "3", 
    label: "Generate weekly activity summary", 
    action: "weekly-summary",
    command: "Generate a comprehensive weekly activity summary for all active buyers including key milestones and next steps"
  },
  { 
    id: "4", 
    label: "View pipeline health metrics", 
    action: "pipeline-metrics",
    command: "Analyze my current pipeline health - stage distribution, average time per stage, and bottlenecks"
  },
];

export default function AgentGPT() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandInput, setCommandInput] = useState("");

  // Get buyers that need attention (sorted by urgency)
  const buyersNeedingAttention = mockWorkspaces
    .filter(ws => ws.openTasks > 0)
    .sort((a, b) => b.openTasks - a.openTasks)
    .slice(0, 5);

  // Get recent activity
  const recentBuyers = mockWorkspaces
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, 5);

  // Navigate to buyer workspace with command for Claude
  const openBuyerWorkspace = useCallback((workspaceId: string, command?: string) => {
    if (command) {
      navigate(`/workspace/${workspaceId}?command=${encodeURIComponent(command)}`);
    } else {
      navigate(`/workspace/${workspaceId}`);
    }
  }, [navigate]);

  // Handle global suggestion clicks - trigger Claude with specific command
  const handleSuggestionClick = useCallback((suggestion: typeof globalSuggestions[0]) => {
    const firstWorkspace = mockWorkspaces[0];
    if (!firstWorkspace) return;

    if (suggestion.action === "pipeline-metrics") {
      navigate("/analytics");
      return;
    }

    // All other suggestions open workspace with Claude command
    openBuyerWorkspace(firstWorkspace.id, suggestion.command);
  }, [navigate, openBuyerWorkspace]);

  // Handle needs attention item click - stage-aware command
  const handleNeedsAttentionClick = useCallback((workspace: typeof mockWorkspaces[0]) => {
    const stage = STAGES[workspace.currentStage];
    
    // Generate stage-aware command for Claude
    let command = "";
    switch (workspace.currentStage) {
      case 0:
        command = `Review ${workspace.buyerName}'s readiness status and draft the buyer representation agreement for signature`;
        break;
      case 1:
        command = `Generate property search criteria and create a first-time buyer guide for ${workspace.buyerName}`;
        break;
      case 2:
        command = `Prepare offer strategy analysis for ${workspace.buyerName} - include market comps and negotiation approach`;
        break;
      case 3:
        command = `Review contract milestones for ${workspace.buyerName} and schedule next inspection or appraisal`;
        break;
      case 4:
        command = `Create closing preparation checklist for ${workspace.buyerName} - final walkthrough, utilities, and docs`;
        break;
      case 5:
        command = `Generate post-close follow-up plan and referral request for ${workspace.buyerName}`;
        break;
      default:
        command = `Review open tasks and prioritize next actions for ${workspace.buyerName}`;
    }

    openBuyerWorkspace(workspace.id, command);
  }, [openBuyerWorkspace]);

  // Handle recent buyer click - immediate workspace with proactive suggestions
  const handleRecentBuyerClick = useCallback((workspace: typeof mockWorkspaces[0]) => {
    const stage = STAGES[workspace.currentStage];
    
    // Generate stage-appropriate proactive command
    let command = "";
    switch (workspace.currentStage) {
      case 0:
        command = `What are the next steps to complete ${workspace.buyerName}'s readiness stage? Check BR-11 and financing status`;
        break;
      case 1:
        command = `Suggest 3-4 proactive actions for ${workspace.buyerName} in the Home Search stage - property tours, market updates, or buyer education`;
        break;
      case 2:
        command = `What should I prioritize for ${workspace.buyerName}'s offer strategy? Include comp analysis and contingency recommendations`;
        break;
      case 3:
        command = `What inspections or milestones are pending for ${workspace.buyerName}? List critical dates and next actions`;
        break;
      case 4:
        command = `Create a closing countdown for ${workspace.buyerName} with remaining tasks and timeline`;
        break;
      case 5:
        command = `Draft a personalized post-close email for ${workspace.buyerName} with move-in tips and referral request`;
        break;
      default:
        command = `What should I focus on next for ${workspace.buyerName}?`;
    }

    openBuyerWorkspace(workspace.id, command);
  }, [openBuyerWorkspace]);

  // Handle new buyer creation
  const handleNewBuyer = useCallback(() => {
    const firstWorkspace = mockWorkspaces[0];
    if (firstWorkspace) {
      const command = "Create a new buyer profile with Stage 1 actions - include buyer consultation checklist, BR-11 agreement draft, and financing pre-approval requirements";
      openBuyerWorkspace(firstWorkspace.id, command);
    }
  }, [openBuyerWorkspace]);

  // Handle command input submit
  const handleSendCommand = useCallback(() => {
    if (!commandInput.trim()) return;
    
    const firstWorkspace = mockWorkspaces[0];
    if (firstWorkspace) {
      openBuyerWorkspace(firstWorkspace.id, commandInput.trim());
    }
    setCommandInput("");
  }, [commandInput, openBuyerWorkspace]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Sidebar collapsed={sidebarCollapsed} />

      <div
        className={cn(
          "transition-all duration-200 min-h-screen flex flex-col",
          sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
        )}
      >
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16 lg:py-20">
              
              {/* Welcome Header */}
              <div className="max-w-3xl mx-auto mb-12 md:mb-16 text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-3 tracking-tight">
                  What can I help you with?
                </h1>
                <p className="text-base md:text-lg text-muted-foreground/70">
                  Manage transactions, review approvals, and track your pipeline
                </p>
              </div>

              {/* Command Input */}
              <div className="max-w-2xl mx-auto mb-16 md:mb-20">
                <div className="relative">
                  <textarea
                    placeholder="Ask anything or describe what you need…"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="w-full min-h-[52px] text-base px-5 py-3.5 pr-14 bg-background border border-border/50 resize-none focus:outline-none focus:border-border transition-all"
                    style={{ borderRadius: '2px', lineHeight: '1.6' }}
                  />
                  <button
                    className="absolute right-3 bottom-3 text-muted-foreground/40 hover:text-foreground disabled:opacity-30 transition-colors"
                    disabled={!commandInput.trim()}
                    onClick={handleSendCommand}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Plain Text Suggestions */}
              <div className="max-w-2xl mx-auto mb-16 md:mb-20">
                <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>
                  Suggestions
                </p>
                <ul className="space-y-3">
                  {globalSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left text-base transition-colors hover:underline underline-offset-4"
                        style={{ color: '#374151' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
                      >
                        {suggestion.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <hr className="max-w-2xl mx-auto mb-12 md:mb-16" style={{ borderColor: '#e5e7eb' }} />

              {/* Needs Attention */}
              {buyersNeedingAttention.length > 0 && (
                <div className="max-w-2xl mx-auto mb-12 md:mb-16">
                  <p className="text-xs font-medium uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
                    Needs attention
                  </p>
                  <ul className="space-y-0">
                    {buyersNeedingAttention.map((ws) => (
                      <li key={ws.id}>
                        <button
                          onClick={() => handleNeedsAttentionClick(ws)}
                          className="w-full flex items-center justify-between py-4 text-left group transition-colors"
                          style={{ borderBottom: '1px solid #f3f4f6' }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-base font-medium" style={{ color: '#374151' }}>
                              {ws.buyerName}
                            </span>
                            <span className="text-sm" style={{ color: '#9ca3af' }}>
                              {ws.openTasks} open task{ws.openTasks !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-colors" style={{ color: '#d1d5db' }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Buyers */}
              <div className="max-w-2xl mx-auto mb-16">
                <p className="text-xs font-medium uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
                  Recent buyers
                </p>
                <ul className="space-y-0">
                  {recentBuyers.map((ws) => {
                    const stage = STAGES[ws.currentStage];
                    return (
                      <li key={ws.id}>
                        <button
                          onClick={() => handleRecentBuyerClick(ws)}
                          className="w-full flex items-center justify-between py-4 text-left group transition-colors"
                          style={{ borderBottom: '1px solid #f3f4f6' }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-base font-medium" style={{ color: '#374151' }}>
                              {ws.buyerName}
                            </span>
                            <span className="text-sm" style={{ color: '#9ca3af' }}>
                              {stage.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm" style={{ color: '#d1d5db' }}>
                              {formatLastActivity(ws.lastActivity)}
                            </span>
                            <ChevronRight className="h-4 w-4 transition-colors" style={{ color: '#d1d5db' }} />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* New Buyer Button - Subtle, at bottom */}
              <div className="max-w-2xl mx-auto text-center pt-8">
                <button
                  onClick={handleNewBuyer}
                  className="inline-flex items-center gap-2 text-sm transition-colors hover:underline underline-offset-4"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  <Plus className="h-4 w-4" />
                  New buyer
                </button>
              </div>

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
