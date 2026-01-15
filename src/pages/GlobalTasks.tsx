import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search,
  Filter,
  Upload,
  ExternalLink
} from "lucide-react";
import { mockWorkspaces } from "@/data/workspaceData";
import { STAGES } from "@/types";

// Mock tasks data
const mockTasks = [
  { id: "t1", title: "Review pre-approval letter", workspaceId: "ws-1", buyerName: "Sarah Chen", stage: 0, priority: "high", dueDate: "2024-01-15", completed: false, type: "task" },
  { id: "t2", title: "Schedule property showing", workspaceId: "ws-2", buyerName: "Marcus Johnson", stage: 1, priority: "medium", dueDate: "2024-01-16", completed: false, type: "task" },
  { id: "t3", title: "Submit offer documents", workspaceId: "ws-1", buyerName: "Sarah Chen", stage: 2, priority: "high", dueDate: "2024-01-14", completed: true, type: "task" },
  { id: "t4", title: "Upload inspection report", workspaceId: "ws-3", buyerName: "Emily Rodriguez", stage: 3, priority: "medium", dueDate: "2024-01-18", completed: false, type: "document" },
  { id: "t5", title: "Review closing documents", workspaceId: "ws-2", buyerName: "Marcus Johnson", stage: 4, priority: "low", dueDate: "2024-01-20", completed: false, type: "document" },
];

export default function GlobalTasks() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesType = filterType === "all" || task.type === filterType;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "completed" && task.completed) || 
      (filterStatus === "pending" && !task.completed);
    return matchesSearch && matchesPriority && matchesType && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive bg-destructive/10";
      case "medium": return "text-warning bg-warning/10";
      case "low": return "text-muted-foreground bg-muted";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className={cn(
        "transition-all duration-200 min-h-screen",
        sidebarCollapsed ? "ml-[58px]" : "ml-[240px]"
      )}>
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Tasks & Documents</h1>
            <p className="text-muted-foreground mt-1">Manage all tasks and documents across workspaces</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks or buyers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Tasks ({filteredTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50",
                      task.completed && "opacity-60"
                    )}
                  >
                    <Checkbox checked={task.completed} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium", task.completed && "line-through")}>
                          {task.title}
                        </span>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.type === "document" ? <Upload className="h-3 w-3 mr-1" /> : null}
                          {task.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{task.buyerName}</span>
                        <span>•</span>
                        <span>{STAGES[task.stage]?.icon} {STAGES[task.stage]?.title}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/workspace/${task.workspaceId}`)}
                      className="gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
