import { ReactNode, useState } from "react";
import { 
  MessageCircle, 
  LayoutDashboard, 
  Home, 
  FileText, 
  FolderOpen,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PortalBuyer } from "@/pages/BuyerPortal";

type PortalTab = "chat" | "dashboard" | "properties" | "offers" | "documents";

interface PortalLayoutProps {
  buyer: PortalBuyer;
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  children?: ReactNode;
  renderChat?: (onOpenMenu: () => void) => ReactNode;
}

const navItems: { id: PortalTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Home },
  { id: "offers", label: "Offers", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
];

export function PortalLayout({ buyer, activeTab, onTabChange, children, renderChat }: PortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isChat = activeTab === "chat";

  const handleTabChange = (tab: PortalTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <span className="font-semibold text-lg">Menu</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mb-4 pb-4 border-b lg:border-b-0 lg:pb-0 lg:mb-0">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {buyer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">{buyer.name}</p>
            <p className="text-xs text-muted-foreground">Home Buyer</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={cn(
              "justify-start gap-3 h-11 w-full",
              activeTab === item.id && "bg-secondary"
            )}
            onClick={() => handleTabChange(item.id)}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );

  // Full-screen layout for chat
  if (isChat && renderChat) {
    return (
      <div className="h-screen bg-background flex flex-col">
        {/* Mobile menu sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>

        {/* Render chat with menu opener */}
        <div className="flex-1 flex flex-col min-h-0">
          {renderChat(() => setMobileMenuOpen(true))}
        </div>
      </div>
    );
  }

  // Standard layout with sidebar for other tabs
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Home className="h-5 w-5" />
            </Button>
            <SheetContent side="left" className="w-72 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Home Buyer Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium text-sm">{buyer.name}</p>
            <p className="text-xs text-muted-foreground">Buying with Your Agent</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {buyer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r bg-card flex-col">
          <NavContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
