import { Search, HelpCircle, ChevronDown, PanelLeft, User, LogOut, Settings, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { whiteLabelConfig } from "@/config/whiteLabel";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ 
  searchQuery, 
  onSearchChange, 
  onToggleSidebar,
  sidebarCollapsed 
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-card border-b border-border flex items-center px-4 gap-4">
      {/* Left - Toggle + Page Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <PanelLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buyers, transactions, or properties..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Middle-Right - Support / Help */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
            <HelpCircle className="h-5 w-5" />
            {/* Optional notification badge */}
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-accent rounded-full" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <span>📚</span>
            <span className="ml-2">User Guide</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <span>❓</span>
            <span className="ml-2">FAQ</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <span>💬</span>
            <span className="ml-2">Contact Support</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <span>📖</span>
            <span className="ml-2">What's New</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications (optional) */}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
          3
        </span>
      </Button>

      {/* Right - Agent Account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 gap-2 px-2 hover:bg-secondary">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">JD</span>
            </div>
            <span className="text-sm font-medium hidden sm:block">John Doe</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>John Doe</span>
              <span className="text-xs font-normal text-muted-foreground">john@brokerage.com</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
