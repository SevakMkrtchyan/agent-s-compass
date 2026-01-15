import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Send, 
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { mockWorkspaces } from "@/data/workspaceData";
import { STAGES } from "@/types";

// Plain text suggestions - no icons, no blue, no cards
const quickSuggestions = [
  { id: "1", label: "Create a new buyer workspace", command: "Create a new buyer workspace" },
  { id: "2", label: "Review pending approvals across all buyers", command: "Show all pending approvals across buyers" },
  { id: "3", label: "Generate weekly activity summary", command: "Generate weekly activity summary" },
  { id: "4", label: "View pipeline health metrics", command: "Show pipeline health metrics" },
];

export default function AgentGPT() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandInput, setCommandInput] = useState("");

  // Get buyers that need attention
  const buyersNeedingAttention = mockWorkspaces
    .filter(ws => ws.openTasks > 0)
    .slice(0, 5);

  // Get recent activity
  const recentActivity = mockWorkspaces
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, 5);

  const handleSelectBuyer = useCallback((workspaceId: string) => {
    navigate(`/workspace/${workspaceId}`);
  }, [navigate]);

  const handleSuggestionClick = (command: string) => {
    setCommandInput(command);
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
      {/* Slim Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-200 min-h-screen flex flex-col",
          sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
        )}
      >
        {/* Minimal Top Bar - No Search */}
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Full-Width Content Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 md:py-16 lg:py-20">
              
              {/* Welcome Header - Centered, Large */}
              <div className="max-w-3xl mx-auto mb-12 md:mb-16 text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground mb-3 tracking-tight">
                  What can I help you with?
                </h1>
                <p className="text-base md:text-lg text-muted-foreground/70">
                  Manage transactions, review approvals, and track your pipeline
                </p>
              </div>

              {/* Command Input - Clean, Centered */}
              <div className="max-w-2xl mx-auto mb-16 md:mb-20">
                <div className="relative">
                  <textarea
                    placeholder="Ask anything or describe what you need…"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    rows={1}
                    className="w-full min-h-[52px] text-base px-5 py-3.5 pr-14 rounded-xl bg-background border border-border/50 resize-none focus:outline-none focus:ring-1 focus:ring-border transition-all"
                    style={{ lineHeight: '1.6' }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 bottom-2 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={!commandInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Plain Text Suggestions - No Cards, No Blue */}
              <div className="max-w-2xl mx-auto mb-16 md:mb-20">
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">
                  Suggestions
                </p>
                <ul className="space-y-2">
                  {quickSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <button
                        onClick={() => handleSuggestionClick(suggestion.command)}
                        className="text-left text-base text-foreground/80 hover:text-foreground hover:underline underline-offset-4 transition-colors"
                      >
                        {suggestion.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <hr className="max-w-2xl mx-auto border-border/30 mb-12 md:mb-16" />

              {/* Needs Attention - Plain Text List */}
              {buyersNeedingAttention.length > 0 && (
                <div className="max-w-2xl mx-auto mb-12 md:mb-16">
                  <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">
                    Needs attention
                  </p>
                  <ul className="space-y-1">
                    {buyersNeedingAttention.map((ws) => (
                      <li key={ws.id}>
                        <button
                          onClick={() => handleSelectBuyer(ws.id)}
                          className="w-full flex items-center justify-between py-3 text-left group hover:bg-muted/30 -mx-3 px-3 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base font-medium text-foreground">
                              {ws.buyerName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {ws.openTasks} open task{ws.openTasks !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Buyers - Plain Text List */}
              <div className="max-w-2xl mx-auto">
                <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4">
                  Recent buyers
                </p>
                <ul className="space-y-1">
                  {recentActivity.map((ws) => {
                    const stage = STAGES[ws.currentStage];
                    return (
                      <li key={ws.id}>
                        <button
                          onClick={() => handleSelectBuyer(ws.id)}
                          className="w-full flex items-center justify-between py-3 text-left group hover:bg-muted/30 -mx-3 px-3 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base font-medium text-foreground">
                              {ws.buyerName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {stage.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground/60">
                              {formatLastActivity(ws.lastActivity)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
