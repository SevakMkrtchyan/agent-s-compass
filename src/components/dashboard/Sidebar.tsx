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
}

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Buyers", url: "/buyers", icon: Users },
  { title: "Transactions", url: "/transactions", icon: FileText },
  { title: "Tasks & Files", url: "/tasks", icon: CheckSquare },
  { title: "AI Insights", url: "/insights", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-56"
      )}
    >
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
    </aside>
  );
}
