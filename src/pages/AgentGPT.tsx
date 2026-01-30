import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { cn } from "@/lib/utils";
import { useBuyers } from "@/hooks/useBuyers";
import { useDynamicSuggestions, type ActionItem } from "@/hooks/useDashboardData";

export default function AgentGPT() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agentExpanded, setAgentExpanded] = useState(false);
  const [commandInput, setCommandInput] = useState("");

  // Get real buyers from database
  const { buyers } = useBuyers();
  
  // Get dynamic suggestions based on real data
  const { data: suggestions = [] } = useDynamicSuggestions();

  // Get agent's name (placeholder for now)
  const agentFirstName = "Agent";

  // Check if any urgent items exist
  const hasUrgentItems = buyers.length > 0;

  // Navigate to buyer workspace with command for Claude
  const openBuyerWorkspace = useCallback((workspaceId: string, command?: string) => {
    if (command) {
      navigate(`/workspace/${workspaceId}?command=${encodeURIComponent(command)}`);
    } else {
      navigate(`/workspace/${workspaceId}`);
    }
  }, [navigate]);

  // Handle global suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: { action: string; command: string }) => {
    if (suggestion.action === "pipeline-metrics") {
      navigate("/analytics");
      return;
    }

    // Open first buyer workspace with the command
    const firstBuyer = buyers[0];
    if (firstBuyer) {
      openBuyerWorkspace(firstBuyer.id, suggestion.command);
    }
  }, [navigate, openBuyerWorkspace, buyers]);

  // Handle action queue item click
  const handleActionClick = useCallback((action: ActionItem) => {
    if (action.buyerId) {
      openBuyerWorkspace(action.buyerId);
    }
  }, [openBuyerWorkspace]);

  // Handle command input submit
  const handleSendCommand = useCallback(() => {
    if (!commandInput.trim()) return;
    
    const firstBuyer = buyers[0];
    if (firstBuyer) {
      openBuyerWorkspace(firstBuyer.id, commandInput.trim());
    }
    setCommandInput("");
  }, [commandInput, openBuyerWorkspace, buyers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  // Default suggestions if dynamic ones are loading
  const displaySuggestions = suggestions.length > 0 ? suggestions : [
    { id: "1", label: "Create a new buyer workspace", action: "create-workspace", command: "Create a new buyer workspace" },
    { id: "2", label: "Review pending approvals across all buyers", action: "review-approvals", command: "Review all pending approvals" },
    { id: "3", label: "Generate weekly activity summary", action: "weekly-summary", command: "Generate weekly summary" },
    { id: "4", label: "View pipeline health metrics", action: "pipeline-metrics", command: "" },
  ];

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
              <div className="w-full px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 md:py-16 lg:py-20">
                
                {/* Welcome Header - Personalized */}
                <div className="max-w-4xl mx-auto mb-12 md:mb-16 text-center">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-3 tracking-tight">
                    What can I help you with, {agentFirstName}?
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground/70">
                    Manage transactions, review approvals, and track your pipeline
                  </p>
                  {buyers.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {buyers.length} active buyer{buyers.length !== 1 ? 's' : ''} in your pipeline
                    </p>
                  )}
                </div>

                {/* Command Input - Wider */}
                <div className="max-w-4xl mx-auto mb-16 md:mb-20">
                  <div className="relative">
                    <textarea
                      placeholder="Tell AgentGPT what to do..."
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="w-full min-h-[56px] text-base px-5 py-4 pr-14 bg-background border border-border/50 resize-none focus:outline-none focus:border-border transition-all rounded-lg"
                    />
                    <button
                      className="absolute right-4 bottom-4 text-muted-foreground/40 hover:text-foreground disabled:opacity-30 transition-colors"
                      disabled={!commandInput.trim()}
                      onClick={handleSendCommand}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Two Column Layout for Suggestions and Action Queue */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                  
                  {/* Left Column - Suggestions */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-4 text-muted-foreground">
                      Suggestions
                    </p>
                    <ul className="space-y-3">
                      {displaySuggestions.map((suggestion) => (
                        <li key={suggestion.id}>
                          <button
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-left text-base text-foreground/70 transition-colors hover:text-foreground hover:underline underline-offset-4"
                          >
                            {suggestion.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right Column - Action Queue */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-4 text-muted-foreground">
                      Action Queue
                    </p>
                    <ActionQueue onActionClick={handleActionClick} />
                  </div>
                </div>

                {/* New Buyer Button - Subtle, at bottom */}
                <div className="max-w-5xl mx-auto text-center pt-12 mt-8 border-t border-border/30">
                  <button
                    onClick={() => navigate("/add-buyer")}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4 mt-8"
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
