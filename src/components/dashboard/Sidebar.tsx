import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  Sparkles, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Buyers", url: "/buyers", icon: Users },
  { title: "Transactions", url: "/transactions", icon: FileText },
  { title: "Tasks & Files", url: "/tasks", icon: CheckSquare },
  { title: "AI Insights", url: "/insights", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="font-display text-lg font-bold text-sidebar-primary">
            HomeGuide
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-primary"
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Agent Info */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sm font-bold text-sidebar-primary-foreground">JD</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Agent</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
