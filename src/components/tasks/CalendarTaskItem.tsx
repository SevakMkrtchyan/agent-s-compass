import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { useUpdateTask } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit, Trash2, Circle, Check, X } from "lucide-react";

interface CalendarTaskItemProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
}

export function CalendarTaskItem({ 
  task, 
  onClick, 
  onDelete,
  isDragging,
  onDragStart,
  onDragEnd,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
}: CalendarTaskItemProps) {
  const { toast } = useToast();
  const updateTask = useUpdateTask();
  const [isHovered, setIsHovered] = useState(false);
  
  // Inline edit state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<string>(task.priority);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: editTitle.trim(),
        priority: editPriority as "High" | "Medium" | "Low",
      });
      toast({ title: "Task updated" });
      onCancelEdit?.();
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(task.title);
    setEditPriority(task.priority);
    onCancelEdit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit(e as unknown as React.MouseEvent);
    } else if (e.key === "Escape") {
      handleCancelEdit(e as unknown as React.MouseEvent);
    }
  };

  // Inline edit mode
  if (isEditing) {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5 p-2 rounded text-xs bg-card border-l-2 border border-primary shadow-md",
          priorityBorderColor
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-xs"
          placeholder="Task title"
          autoFocus
        />
        <div className="flex items-center gap-1.5">
          <Select value={editPriority} onValueChange={setEditPriority}>
            <SelectTrigger className="h-6 text-[10px] flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6" 
            onClick={handleSaveEdit}
            disabled={isSaving}
          >
            <Check className="h-3.5 w-3.5 text-success" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6" 
            onClick={handleCancelEdit}
            disabled={isSaving}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    );
  }

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
        <ContextMenuItem onClick={() => onStartEdit?.()}>
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
