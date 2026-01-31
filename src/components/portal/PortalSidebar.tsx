import { Home, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { whiteLabelConfig } from "@/config/whiteLabel";
import { Separator } from "@/components/ui/separator";

interface PortalSidebarProps {
  collapsed: boolean;
  buyerName: string;
}

export function PortalSidebar({ collapsed, buyerName }: PortalSidebarProps) {
  // Get buyer initials
  const buyerInitials = buyerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#f9fafb] text-foreground flex flex-col transition-all duration-200 z-50 border-r border-border/30",
        collapsed ? "w-[58px]" : "w-[240px]"
      )}
    >
      {/* Logo Header - matches agent sidebar exactly */}
      <div className={cn(
        "flex items-center h-14 border-b border-border/30",
        collapsed ? "justify-center px-2" : "px-4 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-foreground/70">
            {whiteLabelConfig.brokerage.shortName}
          </span>
        </div>
        {!collapsed && (
          <span className="text-sm font-medium text-foreground truncate">
            {whiteLabelConfig.brokerage.name}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="px-3 py-3">
        <Separator className="bg-border/50" />
      </div>

      {/* Navigation - Single workspace item */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {/* Current Workspace - Active */}
          <li>
            <div
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                "bg-muted/50 text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Workspace</span>}
            </div>
          </li>
        </ul>

        {/* Recent section label - matches agent sidebar */}
        {!collapsed && (
          <div className="px-2 mt-4">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Your Journey
            </div>
            
            {/* Current buyer card - matches agent workspace item style */}
            <div className="mt-1">
              <div
                className={cn(
                  "w-full text-left p-2.5 rounded-lg transition-all",
                  "bg-muted/70 text-foreground"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium bg-foreground/10 text-foreground">
                    {buyerInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{buyerName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">✓</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">
                        Home Buyer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Footer - Buyer profile section (matches agent footer) */}
      <div className={cn(
        "border-t border-border/30 p-3",
        collapsed ? "flex justify-center" : ""
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground/70">{buyerInitials}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-foreground/70">{buyerInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{buyerName}</p>
              <p className="text-xs text-muted-foreground truncate">Home Buyer</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
