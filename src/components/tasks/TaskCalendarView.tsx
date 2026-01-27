import { useState, useMemo } from "react";
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
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";

interface TaskCalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateClick: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendarView({ tasks, onTaskClick, onDateClick }: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

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

  // Tasks without due dates
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.due_date);
  }, [tasks]);

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive text-destructive-foreground";
      case "Medium":
        return "bg-warning text-warning-foreground";
      case "Low":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityDotColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive";
      case "Medium":
        return "bg-warning";
      case "Low":
        return "bg-success";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {WEEKDAYS.map(day => (
              <div 
                key={day} 
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const displayTasks = dayTasks.slice(0, 3);
              const remainingCount = dayTasks.length - 3;

              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[100px] bg-background p-1 cursor-pointer hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "bg-muted/30"
                  )}
                  onClick={() => onDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground",
                        !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {dayTasks.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {displayTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={cn(
                          "w-full text-left text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1",
                          task.status === "Complete" && "opacity-50 line-through",
                          "hover:ring-1 hover:ring-ring transition-all"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", getPriorityDotColor(task.priority))} />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                    {remainingCount > 0 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{remainingCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
            <span className="text-muted-foreground">Priority:</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>Low</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unscheduled Tasks */}
      {unscheduledTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Unscheduled Tasks ({unscheduledTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {unscheduledTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors",
                    task.status === "Complete" && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", getPriorityDotColor(task.priority))} />
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "font-medium truncate",
                        task.status === "Complete" && "line-through"
                      )}>
                        {task.title}
                      </p>
                      {task.buyer?.name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {task.buyer.name}
                        </p>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn("mt-1 text-xs", getPriorityColor(task.priority))}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
