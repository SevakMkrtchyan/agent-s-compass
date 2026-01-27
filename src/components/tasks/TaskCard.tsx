import { useState } from "react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  Zap, 
  MoreVertical,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toast } = useToast();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: task.status === "Complete" ? "To Do" : "Complete",
      });
      toast({
        title: task.status === "Complete" ? "Task reopened" : "Task completed",
        description: task.title,
      });
    } catch (error) {
      toast({
        title: "Error updating task",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast({
        title: "Task deleted",
        description: task.title,
      });
    } catch (error) {
      toast({
        title: "Error deleting task",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "Medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "Low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "Complete";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border bg-card transition-all hover:shadow-sm",
        task.status === "Complete" && "opacity-60 bg-muted/30"
      )}
    >
      <Checkbox
        checked={task.status === "Complete"}
        onCheckedChange={handleToggleComplete}
        disabled={isUpdating}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-medium text-foreground",
                task.status === "Complete" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </span>
            <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
            {task.source_action_id && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                Auto
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
          {task.buyer && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.buyer.name}
            </span>
          )}
          {task.due_date && (
            <span className={cn(
              "flex items-center gap-1",
              isOverdue && "text-destructive font-medium"
            )}>
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), "MMM d, yyyy")}
              {isOverdue && " (Overdue)"}
            </span>
          )}
          {task.assigned_to !== "Agent" && (
            <Badge variant="outline" className="text-xs">
              {task.assigned_to}
              {task.assigned_to_name && `: ${task.assigned_to_name}`}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
