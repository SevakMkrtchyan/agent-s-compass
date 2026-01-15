import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ChevronRight, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { cn } from "@/lib/utils";
import { mockWorkspaces, currentUser } from "@/data/workspaceData";
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
  const [agentExpanded, setAgentExpanded] = useState(false);
  const [commandInput, setCommandInput] = useState("");

  // Get agent's first name
  const agentFirstName = currentUser.name.split(" ")[0];

  // Get buyers that need attention (sorted by urgency)
  const buyersNeedingAttention = mockWorkspaces
    .filter(ws => ws.openTasks > 0)
    .sort((a, b) => b.openTasks - a.openTasks)
    .slice(0, 5);

  // Check if any urgent items exist
  const hasUrgentItems = buyersNeedingAttention.length > 0;

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

  // Handle action queue item click
  const handleActionClick = useCallback((action: any) => {
    if (action.buyerId) {
      const workspace = mockWorkspaces.find(ws => ws.buyerId === action.buyerId || ws.id === action.buyerId);
      if (workspace) {
        openBuyerWorkspace(workspace.id);
      }
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

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        agentExpanded={agentExpanded}
        onAgentExpandedChange={setAgentExpanded}
      />

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

        <div className="flex-1 flex">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16 lg:py-20">
                
                {/* Welcome Header - Personalized */}
                <div className="max-w-3xl mx-auto mb-12 md:mb-16 text-center">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-3 tracking-tight">
                    What can I help you with, {agentFirstName}?
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground/70">
                    Manage transactions, review approvals, and track your pipeline
                  </p>
                </div>

                {/* Command Input */}
                <div className="max-w-2xl mx-auto mb-16 md:mb-20">
                  <div className="relative">
                    <textarea
                      placeholder="Tell AgentGPT what to do..."
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

                {/* Action Queue Section */}
                <div className="max-w-2xl mx-auto mb-16">
                  <p className="text-xs font-medium uppercase tracking-wider mb-6" style={{ color: '#9ca3af' }}>
                    Action Queue
                  </p>
                  
                  {hasUrgentItems ? (
                    <ActionQueue onActionClick={handleActionClick} />
                  ) : (
                    <div className="bg-card rounded-xl border p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 mb-4">
                        <span className="text-2xl">✓</span>
                      </div>
                      <p className="text-foreground font-medium mb-1">All caught up!</p>
                      <p className="text-muted-foreground text-sm">No urgent items across your pipeline.</p>
                    </div>
                  )}
                </div>

                {/* New Buyer Button - Subtle, at bottom */}
                <div className="max-w-2xl mx-auto text-center pt-8">
                  <button
                    onClick={() => navigate("/add-buyer")}
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
    </div>
  );
}