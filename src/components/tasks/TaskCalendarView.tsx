import { useState, useMemo, useCallback } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  getWeek,
  startOfDay,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarTaskItem } from "./CalendarTaskItem";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateClick: (date: Date) => void;
}

type CalendarViewMode = "month" | "week" | "day";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendarView({ tasks, onTaskClick, onDateClick }: TaskCalendarViewProps) {
  const { toast } = useToast();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Get calendar days based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      return [startOfDay(currentDate)];
    }
  }, [currentDate, viewMode]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = format(new Date(task.due_date), "yyyy-MM-dd");
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Set of dates that have tasks
  const taskDates = useMemo(() => {
    return new Set(tasks.filter(t => t.due_date).map(t => format(new Date(t.due_date!), "yyyy-MM-dd")));
  }, [tasks]);

  // Unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.due_date);
  }, [tasks]);

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === "month") setCurrentDate(prev => subMonths(prev, 1));
    else if (viewMode === "week") setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => addDays(prev, -1));
  };

  const goToNext = () => {
    if (viewMode === "month") setCurrentDate(prev => addMonths(prev, 1));
    else if (viewMode === "week") setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addDays(prev, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDropTargetDate(null);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetDate(dateKey);
  };

  const handleDragLeave = () => {
    setDropTargetDate(null);
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedTask) return;

    const newDueDate = format(date, "yyyy-MM-dd");
    
    try {
      await updateTask.mutateAsync({
        id: draggedTask.id,
        due_date: newDueDate,
      });
      toast({ title: "Task rescheduled", description: `Moved to ${format(date, "MMM d, yyyy")}` });
    } catch (error) {
      toast({ title: "Error rescheduling task", variant: "destructive" });
    }

    setDraggedTask(null);
    setDropTargetDate(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailPanelOpen(true);
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast({ title: "Task deleted" });
    } catch (error) {
      toast({ title: "Error deleting task", variant: "destructive" });
    }
  };

  const getHeaderTitle = () => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  return (
    <div className="flex gap-6">
      {/* Left sidebar with mini calendar */}
      <div className="hidden lg:block w-[200px] flex-shrink-0 space-y-4">
        <MiniCalendar
          selectedDate={currentDate}
          onDateSelect={setCurrentDate}
          currentMonth={currentDate}
          onMonthChange={setCurrentDate}
          taskDates={taskDates}
        />
        
        {/* Legend */}
        <div className="p-3 bg-card rounded-lg border space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded border-l-2 border-destructive bg-card" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded border-l-2 border-warning bg-card" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded border-l-2 border-success bg-card" />
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main calendar */}
      <div className="flex-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {getHeaderTitle()}
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as CalendarViewMode)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="month" className="text-xs px-3 h-6">Month</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs px-3 h-6">Week</TabsTrigger>
                    <TabsTrigger value="day" className="text-xs px-3 h-6">Day</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="h-4 w-px bg-border" />

                <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
                  Today
                </Button>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Weekday headers */}
            {viewMode !== "day" && (
              <div className={cn(
                "grid gap-px bg-border border-t",
                viewMode === "month" ? "grid-cols-[40px_repeat(7,1fr)]" : "grid-cols-[40px_repeat(7,1fr)]"
              )}>
                <div className="bg-muted/50 p-2 text-xs font-medium text-muted-foreground text-center">
                  Wk
                </div>
                {WEEKDAYS.map((day, i) => (
                  <div 
                    key={day} 
                    className={cn(
                      "bg-muted/50 p-2 text-xs font-medium text-center",
                      (i === 0 || i === 6) && "text-muted-foreground"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Calendar grid */}
            <div className={cn(
              "grid gap-px bg-border",
              viewMode === "day" ? "grid-cols-1" : "grid-cols-[40px_repeat(7,1fr)]"
            )}>
              {viewMode !== "day" && calendarDays.map((day, index) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isDropTarget = dropTargetDate === dateKey;
                const showWeekNumber = dayOfWeek === 0;
                const weekNumber = getWeek(day);

                // Determine how many tasks to show
                const maxVisible = viewMode === "month" ? 3 : 6;
                const displayTasks = dayTasks.slice(0, maxVisible);
                const remainingCount = dayTasks.length - maxVisible;

                return (
                  <>
                    {/* Week number column */}
                    {showWeekNumber && (
                      <div 
                        key={`week-${weekNumber}`}
                        className="bg-muted/30 p-1 text-xs text-muted-foreground flex items-start justify-center pt-2"
                      >
                        {weekNumber}
                      </div>
                    )}
                    
                    {/* Day cell */}
                    <div
                      key={index}
                      className={cn(
                        "bg-background p-1.5 transition-colors",
                        viewMode === "month" ? "min-h-[100px]" : "min-h-[140px]",
                        !isCurrentMonth && "bg-muted/20",
                        isWeekend && isCurrentMonth && "bg-muted/10",
                        isDropTarget && "ring-2 ring-primary ring-inset bg-primary/5"
                      )}
                      onDragOver={(e) => handleDragOver(e, dateKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      {/* Date header */}
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => onDateClick(day)}
                          className={cn(
                            "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full transition-colors",
                            isToday && "bg-primary text-primary-foreground",
                            !isToday && !isCurrentMonth && "text-muted-foreground/50",
                            !isToday && isCurrentMonth && "hover:bg-accent"
                          )}
                        >
                          {format(day, "d")}
                        </button>
                        {dayTasks.length >= 4 && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            {dayTasks.length}
                          </Badge>
                        )}
                      </div>

                      {/* Tasks */}
                      <div className="space-y-1">
                        {displayTasks.map(task => (
                          <CalendarTaskItem
                            key={task.id}
                            task={task}
                            onClick={() => handleTaskClick(task)}
                            onDelete={() => handleDeleteTask(task)}
                            isDragging={draggedTask?.id === task.id}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}
                        {remainingCount > 0 && (
                          <button 
                            onClick={() => onDateClick(day)}
                            className="text-[10px] text-muted-foreground hover:text-foreground pl-2"
                          >
                            +{remainingCount} more
                          </button>
                        )}
                      </div>

                      {/* Add task button on hover */}
                      {dayTasks.length === 0 && isCurrentMonth && (
                        <button
                          onClick={() => onDateClick(day)}
                          className="w-full py-2 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                );
              })}

              {/* Day view */}
              {viewMode === "day" && (
                <div className="bg-background p-4 min-h-[400px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-3xl font-bold h-12 w-12 flex items-center justify-center rounded-full",
                        isSameDay(currentDate, new Date()) && "bg-primary text-primary-foreground"
                      )}>
                        {format(currentDate, "d")}
                      </span>
                      <div>
                        <p className="text-sm text-muted-foreground">{format(currentDate, "EEEE")}</p>
                        <p className="font-medium">{format(currentDate, "MMMM yyyy")}</p>
                      </div>
                    </div>
                    <Button onClick={() => onDateClick(currentDate)} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(tasksByDate.get(format(currentDate, "yyyy-MM-dd")) || []).map(task => (
                      <CalendarTaskItem
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onDelete={() => handleDeleteTask(task)}
                        isDragging={draggedTask?.id === task.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    {!(tasksByDate.get(format(currentDate, "yyyy-MM-dd")) || []).length && (
                      <p className="text-center text-muted-foreground py-8">
                        No tasks scheduled for this day
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Unscheduled Tasks */}
        {unscheduledTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Unscheduled ({unscheduledTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {unscheduledTasks.map(task => (
                  <CalendarTaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                    onDelete={() => handleDeleteTask(task)}
                    isDragging={draggedTask?.id === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task detail panel */}
      <TaskDetailPanel
        task={selectedTask}
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
      />

      {/* Overlay when panel is open */}
      {detailPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setDetailPanelOpen(false)}
        />
      )}
    </div>
  );
}
