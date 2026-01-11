import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Send, 
  Shield, 
  ChevronDown,
  User,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STAGES } from "@/types";
import { WORKSPACE_STATUS_CONFIG, type Workspace, type UserRole } from "@/types/workspace";

interface WorkspaceHeaderProps {
  workspace: Workspace;
  userRole: UserRole;
}

export function WorkspaceHeader({ workspace, userRole }: WorkspaceHeaderProps) {
  const navigate = useNavigate();
  const stage = STAGES[workspace.currentStage];
  const statusConfig = WORKSPACE_STATUS_CONFIG[workspace.status];
  const isBroker = userRole === "broker";

  return (
    <header className="sticky top-14 z-30 bg-card border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Buyer Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">
                {workspace.buyerName.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>

            {/* Buyer Details */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-display font-bold text-foreground">
                  {workspace.buyerName}
                </h1>
                <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                {isBroker && (
                  <Badge variant="outline" className="text-xs gap-1 bg-muted">
                    <Eye className="h-3 w-3" />
                    Read-Only
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {stage.icon} Stage {workspace.currentStage}: {stage.title}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {workspace.assignedAgents.map((a) => a.name).join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-3">
            {!isBroker && (
              <>
                <Button variant="outline" size="sm" className="gap-2">
                  <Send className="h-4 w-4" />
                  Send Update
                </Button>

                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Request Approval
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Advance Stage
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {STAGES.map((s) => (
                      <DropdownMenuItem
                        key={s.stage}
                        disabled={s.stage <= workspace.currentStage}
                        className="gap-2"
                      >
                        <span>{s.icon}</span>
                        <span>Stage {s.stage}: {s.title}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive gap-2">
                      Archive Workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {isBroker && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{workspace.totalProperties}</span>
                  <span>Properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{workspace.totalOffers}</span>
                  <span>Offers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{workspace.openTasks}</span>
                  <span>Open Tasks</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
