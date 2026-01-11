import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Sparkles, 
  Settings,
  Home,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { whiteLabelConfig } from "@/config/whiteLabel";

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Workspaces", url: "/workspace", icon: Briefcase },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "AI Insights", url: "/insights", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[hsl(210_11%_15%)] text-white flex flex-col transition-all duration-200 z-50 border-r border-white/10",
        collapsed ? "w-[58px]" : "w-[240px]"
      )}
    >
      {/* Logo / Brokerage Header */}
      <div className={cn(
        "flex items-center h-14 border-b border-white/10",
        collapsed ? "justify-center px-2" : "px-4 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-[hsl(153_52%_52%)] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-white">
            {whiteLabelConfig.brokerage.shortName}
          </span>
        </div>
        {!collapsed && (
          <span className="text-[15px] font-semibold text-white truncate">
            {whiteLabelConfig.brokerage.name}
          </span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/60">
            <Search className="h-4 w-4" />
            <span>Search</span>
            <span className="ml-auto text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">⌘K</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-white/15 text-white"
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - User/Help section */}
      <div className={cn(
        "border-t border-white/10 p-3",
        collapsed ? "flex justify-center" : ""
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-[hsl(271_49%_55%)] flex items-center justify-center">
            <span className="text-xs font-semibold text-white">JS</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-[hsl(271_49%_55%)] flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">JS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Smith</p>
              <p className="text-xs text-white/50 truncate">Agent</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}