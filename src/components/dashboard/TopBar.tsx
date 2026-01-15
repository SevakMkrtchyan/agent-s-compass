import { PanelLeft, User, LogOut, Settings, ChevronDown } from "lucide-react";
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

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ 
  onToggleSidebar,
  sidebarCollapsed 
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[#f9fafb] border-b border-border/30 flex items-center justify-between px-4">
      {/* Left - Toggle Only */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <PanelLeft className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Right - Minimal User Account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 gap-2 px-2 hover:bg-muted/50">
            <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground/70">JD</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
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
