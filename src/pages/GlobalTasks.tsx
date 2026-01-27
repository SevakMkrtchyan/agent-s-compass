import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ListTodo, 
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Loader2,
  List,
  CalendarDays,
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { TaskPriorityGroup } from "@/components/tasks/TaskPriorityGroup";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import { Task } from "@/types/task";
import { format } from "date-fns";

type ViewMode = "list" | "calendar";

export default function GlobalTasks() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { data: tasks, isLoading } = useTasks();

  // Filter tasks
  const filteredTasks = (tasks || []).filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && task.status !== "Complete") || 
      (filterStatus === "completed" && task.status === "Complete");

    return matchesSearch && matchesStatus;
  });

  // Group tasks by priority
  const highPriorityTasks = filteredTasks.filter(t => t.priority === "High" && t.status !== "Complete");
  const mediumPriorityTasks = filteredTasks.filter(t => t.priority === "Medium" && t.status !== "Complete");
  const lowPriorityTasks = filteredTasks.filter(t => t.priority === "Low" && t.status !== "Complete");
  const completedTasks = filteredTasks.filter(t => t.status === "Complete");

  const activeTasks = filteredTasks.filter(t => t.status !== "Complete");

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleCalendarTaskClick = (task: Task) => {
    // Calendar view has its own side panel, but we can still use this for list view
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
              <p className="text-muted-foreground mt-1">
                Manage all tasks across your buyers
              </p>
            </div>
            <Button onClick={() => { setSelectedDate(undefined); setCreateDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ListTodo className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasks?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Clock className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{highPriorityTasks.length}</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedTasks.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & View Toggle */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks or buyers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    className="gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Calendar
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

              <TabsContent value="priority">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Try adjusting your search" : "Create your first task to get started"}
                      </p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
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
                    
                    {filterStatus !== "active" && completedTasks.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            Completed ({completedTasks.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {completedTasks.map((task) => (
                              <div key={task.id} className="opacity-60">
                                <TaskPriorityGroup 
                                  priority={task.priority} 
                                  tasks={[task]} 
                                  onEditTask={handleEditTask}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        All Tasks ({filteredTasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {filteredTasks.map((task) => (
                          <div key={task.id}>
                            <TaskPriorityGroup 
                              priority={task.priority} 
                              tasks={[task]} 
                              onEditTask={handleEditTask}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      <CreateTaskDialog 
        open={createDialogOpen} 
        onOpenChange={handleCreateDialogClose}
        defaultDueDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
      />

      <EditTaskDialog
        task={selectedTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
