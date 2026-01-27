import { Task } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Minus } from "lucide-react";

interface TaskPriorityGroupProps {
  priority: "High" | "Medium" | "Low";
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

export function TaskPriorityGroup({ priority, tasks, onEditTask }: TaskPriorityGroupProps) {
  if (tasks.length === 0) return null;

  const getPriorityConfig = () => {
    switch (priority) {
      case "High":
        return {
          icon: AlertCircle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
        };
      case "Medium":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/20",
        };
      case "Low":
        return {
          icon: Minus,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
        };
    }
  };

  const config = getPriorityConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <h3 className="font-medium text-foreground">{priority} Priority</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </div>
    </div>
  );
}
