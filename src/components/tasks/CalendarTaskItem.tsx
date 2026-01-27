import { useMemo, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateTask } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CheckCircle2, Edit, Trash2, Circle } from "lucide-react";

interface CalendarTaskItemProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
}

export function CalendarTaskItem({ 
  task, 
  onClick, 
  onDelete,
  isDragging,
  onDragStart,
  onDragEnd
}: CalendarTaskItemProps) {
  const { toast } = useToast();
  const updateTask = useUpdateTask();
  const [isHovered, setIsHovered] = useState(false);

  const priorityBorderColor = useMemo(() => {
    switch (task.priority) {
      case "High": return "border-l-destructive";
      case "Medium": return "border-l-warning";
      case "Low": return "border-l-success";
      default: return "border-l-muted";
    }
  }, [task.priority]);

  const buyerInitials = useMemo(() => {
    if (!task.buyer?.name) return null;
    return task.buyer.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [task.buyer?.name]);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: task.status === "Complete" ? "To Do" : "Complete",
        completed_at: task.status === "Complete" ? null : new Date().toISOString(),
      });
      toast({
        title: task.status === "Complete" ? "Task reopened" : "Task completed",
      });
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    }
  };

  const handleMarkComplete = async () => {
    if (task.status === "Complete") return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: "Complete",
        completed_at: new Date().toISOString(),
      });
      toast({ title: "Task completed" });
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    }
  };

  const handleMarkIncomplete = async () => {
    if (task.status !== "Complete") return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: "To Do",
        completed_at: null,
      });
      toast({ title: "Task reopened" });
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable
          onDragStart={(e) => onDragStart(e, task)}
          onDragEnd={onDragEnd}
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "group flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-all",
            "bg-card border-l-2 border border-border shadow-sm",
            "hover:shadow-md hover:border-primary/30",
            priorityBorderColor,
            task.status === "Complete" && "opacity-50",
            isDragging && "opacity-50 ring-2 ring-primary shadow-lg"
          )}
        >
          {/* Checkbox on hover */}
          <div 
            className={cn(
              "flex-shrink-0 transition-opacity",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={handleToggleComplete}
          >
            {task.status === "Complete" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
            )}
          </div>

          {/* Task content */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span 
              className={cn(
                "truncate font-medium",
                task.status === "Complete" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </span>
          </div>

          {/* Buyer initials */}
          {buyerInitials && (
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center">
              {buyerInitials}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onClick}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Task
        </ContextMenuItem>
        <ContextMenuSeparator />
        {task.status !== "Complete" ? (
          <ContextMenuItem onClick={handleMarkComplete}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Complete
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={handleMarkIncomplete}>
            <Circle className="h-4 w-4 mr-2" />
            Mark Incomplete
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
