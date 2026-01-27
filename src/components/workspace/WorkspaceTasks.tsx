import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Download,
  Eye,
  FolderOpen,
  ListTodo,
  Search,
  Plus,
  List,
  CalendarDays,
  Loader2,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Buyer } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/types/task";
import { TaskPriorityGroup } from "@/components/tasks/TaskPriorityGroup";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import { format } from "date-fns";

interface WorkspaceTasksProps {
  buyer: Buyer;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  uploadedBy: "agent" | "buyer";
  stage: number;
  category: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Pre-Approval Letter.pdf",
    type: "pdf",
    uploadedAt: new Date("2024-01-10"),
    uploadedBy: "buyer",
    stage: 0,
    category: "Financing",
  },
  {
    id: "2",
    name: "Home Buying Orientation.pdf",
    type: "pdf",
    uploadedAt: new Date("2024-01-10"),
    uploadedBy: "agent",
    stage: 0,
    category: "Education",
  },
  {
    id: "3",
    name: "Market Analysis Report.pdf",
    type: "pdf",
    uploadedAt: new Date("2024-01-12"),
    uploadedBy: "agent",
    stage: 1,
    category: "Market Data",
  },
  {
    id: "4",
    name: "Property Comparison Sheet.xlsx",
    type: "xlsx",
    uploadedAt: new Date("2024-01-14"),
    uploadedBy: "agent",
    stage: 1,
    category: "Properties",
  },
];

type ViewMode = "list" | "calendar";
type TaskScope = "buyer" | "all";

export function WorkspaceTasks({ buyer }: WorkspaceTasksProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [taskScope, setTaskScope] = useState<TaskScope>("buyer");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { data: tasks, isLoading } = useTasks();

  // Filter tasks based on scope and filters
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      // Scope filter: buyer's tasks or all
      const matchesScope = taskScope === "all" || task.buyer_id === buyer.id;

      // Search filter
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && task.status !== "Complete") ||
        (filterStatus === "completed" && task.status === "Complete");

      return matchesScope && matchesSearch && matchesStatus;
    });
  }, [tasks, taskScope, buyer.id, searchQuery, filterStatus]);

  // Group tasks by priority
  const highPriorityTasks = filteredTasks.filter(
    (t) => t.priority === "High" && t.status !== "Complete"
  );
  const mediumPriorityTasks = filteredTasks.filter(
    (t) => t.priority === "Medium" && t.status !== "Complete"
  );
  const lowPriorityTasks = filteredTasks.filter(
    (t) => t.priority === "Low" && t.status !== "Complete"
  );
  const completedTasks = filteredTasks.filter((t) => t.status === "Complete");
  const activeTasks = filteredTasks.filter((t) => t.status !== "Complete");

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleCalendarTaskClick = (task: Task) => {
    console.log("Task clicked in calendar:", task.title);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setSelectedDate(undefined);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Buyer's first name for display
  const buyerFirstName = buyer.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
            {activeTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ListTodo className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{filteredTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Clock className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{highPriorityTasks.length}</p>
                      <p className="text-xs text-muted-foreground">High Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{activeTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{completedTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & View Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  {/* Scope Toggle */}
                  <div className="flex items-center gap-2">
                    <Tabs
                      value={taskScope}
                      onValueChange={(v) => setTaskScope(v as TaskScope)}
                    >
                      <TabsList className="h-9">
                        <TabsTrigger value="buyer" className="gap-1.5 text-xs px-3">
                          <User className="h-3.5 w-3.5" />
                          {buyerFirstName}'s Tasks
                        </TabsTrigger>
                        <TabsTrigger value="all" className="gap-1.5 text-xs px-3">
                          <Users className="h-3.5 w-3.5" />
                          All Tasks
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center flex-1 justify-end">
                    <div className="relative min-w-[180px] max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* View Toggle */}
                    <Tabs
                      value={viewMode}
                      onValueChange={(v) => setViewMode(v as ViewMode)}
                    >
                      <TabsList className="h-9">
                        <TabsTrigger value="list" className="px-3">
                          <List className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="px-3">
                          <CalendarDays className="h-4 w-4" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <Button
                      onClick={() => {
                        setSelectedDate(undefined);
                        setCreateDialogOpen(true);
                      }}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Task
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content based on view mode */}
            {viewMode === "calendar" ? (
              isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TaskCalendarView
                  tasks={filteredTasks}
                  onTaskClick={handleCalendarTaskClick}
                  onTaskEdit={handleEditTask}
                  onDateClick={handleDateClick}
                />
              )
            ) : (
              /* List View */
              <Tabs defaultValue="priority" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="priority">By Priority</TabsTrigger>
                  <TabsTrigger value="all">All Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="priority" className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <TaskPriorityGroup
                        priority="High"
                        tasks={highPriorityTasks}
                        onEditTask={handleEditTask}
                      />
                      <TaskPriorityGroup
                        priority="Medium"
                        tasks={mediumPriorityTasks}
                        onEditTask={handleEditTask}
                      />
                      <TaskPriorityGroup
                        priority="Low"
                        tasks={lowPriorityTasks}
                        onEditTask={handleEditTask}
                      />
                      {completedTasks.length > 0 && (
                        <TaskPriorityGroup
                          priority="Low"
                          tasks={completedTasks}
                          onEditTask={handleEditTask}
                        />
                      )}
                      {filteredTasks.length === 0 && (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No tasks found</p>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => setCreateDialogOpen(true)}
                            >
                              Create First Task
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-4">
                        {filteredTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No tasks found</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => handleEditTask(task)}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                  "hover:bg-secondary/50",
                                  task.status === "Complete" && "opacity-60"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      task.priority === "High" && "bg-destructive",
                                      task.priority === "Medium" && "bg-warning",
                                      task.priority === "Low" && "bg-success"
                                    )}
                                  />
                                  <div>
                                    <p
                                      className={cn(
                                        "font-medium",
                                        task.status === "Complete" &&
                                          "line-through text-muted-foreground"
                                      )}
                                    >
                                      {task.title}
                                    </p>
                                    {task.buyer && taskScope === "all" && (
                                      <p className="text-xs text-muted-foreground">
                                        {task.buyer.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {task.due_date && (
                                    <Badge variant="outline" className="text-xs">
                                      {format(new Date(task.due_date + "T00:00:00"), "MMM d")}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={
                                      task.status === "Complete"
                                        ? "secondary"
                                        : task.status === "In Progress"
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {task.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Documents</CardTitle>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {doc.category} • Uploaded {formatDate(doc.uploadedAt)} by{" "}
                          {doc.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog - pre-fill buyer when in buyer scope */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogClose}
        defaultDueDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
        defaultBuyerId={taskScope === "buyer" ? buyer.id : undefined}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={selectedTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
