import { Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalSidebarProps {
  collapsed: boolean;
  buyerName: string;
}

export function PortalSidebar({ collapsed, buyerName }: PortalSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r flex flex-col transition-all duration-200",
        collapsed ? "w-[58px]" : "w-[240px]"
      )}
    >
      {/* Logo Section */}
      <div className="h-14 flex items-center gap-3 px-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground">Home Buyer Portal</span>
        )}
      </div>

      {/* Buyer Profile Section */}
      <div className={cn(
        "px-3 py-4 border-b",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {buyerName.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{buyerName}</p>
              <p className="text-xs text-muted-foreground">Home Buyer</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation placeholder - keeping it minimal for buyers */}
      <div className="flex-1 px-3 py-4">
        {!collapsed && (
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Your Journey
          </div>
        )}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 text-foreground",
          collapsed && "justify-center px-2"
        )}>
          <Home className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Workspace</span>}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Powered by AgentGPT
          </p>
        </div>
      )}
    </aside>
  );
}
