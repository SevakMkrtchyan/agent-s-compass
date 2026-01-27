import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, X, Trash2, User, Clock, Flag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useBuyers } from "@/hooks/useBuyers";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/types/task";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailPanel({ task, open, onClose }: TaskDetailPanelProps) {
  const { toast } = useToast();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { buyers } = useBuyers();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = useState<"To Do" | "In Progress" | "Complete">("To Do");
  const [assignedTo, setAssignedTo] = useState<"Agent" | "Buyer" | "Third Party">("Agent");
  const [assignedToName, setAssignedToName] = useState("");
  const [buyerId, setBuyerId] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date ? new Date(task.due_date + "T00:00:00") : undefined);
      setPriority(task.priority);
      setStatus(task.status);
      setAssignedTo(task.assigned_to);
      setAssignedToName(task.assigned_to_name || "");
      setBuyerId(task.buyer_id || "");
      setHasChanges(false);
    }
  }, [task, open]);

  const handleSave = async () => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        priority,
        status,
        assigned_to: assignedTo,
        assigned_to_name: assignedToName.trim() || null,
        completed_at: status === "Complete" && task.status !== "Complete" 
          ? new Date().toISOString() 
          : status !== "Complete" 
            ? null 
            : task.completed_at,
      });

      toast({ title: "Task updated" });
      setHasChanges(false);
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    const newStatus = status === "Complete" ? "To Do" : "Complete";
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleDelete = async () => {
    if (!task) return;
    
    try {
      await deleteTask.mutateAsync(task.id);
      toast({ title: "Task deleted" });
      onClose();
    } catch (error) {
      toast({ title: "Error deleting task", variant: "destructive" });
    }
  };

  const markChanged = () => setHasChanges(true);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "High": return "text-destructive border-destructive";
      case "Medium": return "text-warning border-warning";
      case "Low": return "text-success border-success";
      default: return "text-muted-foreground";
    }
  };

  if (!task) return null;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-[400px] bg-background border-l shadow-xl z-50 transition-transform duration-300 ease-out flex flex-col",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={status === "Complete"}
            onCheckedChange={handleToggleComplete}
            className="h-5 w-5"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {status === "Complete" ? "Completed" : "Mark complete"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <div>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markChanged(); }}
            className={cn(
              "text-lg font-semibold border-0 px-0 focus-visible:ring-0 h-auto py-1",
              status === "Complete" && "line-through text-muted-foreground"
            )}
            placeholder="Task title..."
          />
        </div>

        {/* Quick info badges */}
        <div className="flex flex-wrap gap-2">
          {task.buyer?.name && (
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              {task.buyer.name}
            </Badge>
          )}
          {task.source_action_id && (
            <Badge variant="outline" className="text-xs">
              Auto-generated
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); markChanged(); }}
            placeholder="Add description..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Due Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                {dueDate ? format(dueDate, "EEEE, MMMM d, yyyy") : "No due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(d) => { setDueDate(d); markChanged(); }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Priority
          </Label>
          <Select value={priority} onValueChange={(v) => { setPriority(v as typeof priority); markChanged(); }}>
            <SelectTrigger className={cn(getPriorityColor(priority))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">🔴 High</SelectItem>
              <SelectItem value="Medium">🟡 Medium</SelectItem>
              <SelectItem value="Low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Status
          </Label>
          <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); markChanged(); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assigned To */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <User className="h-3 w-3" />
            Assigned To
          </Label>
          <Select value={assignedTo} onValueChange={(v) => { setAssignedTo(v as typeof assignedTo); markChanged(); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Agent">Agent</SelectItem>
              <SelectItem value="Buyer">Buyer</SelectItem>
              <SelectItem value="Third Party">Third Party</SelectItem>
            </SelectContent>
          </Select>
          {assignedTo === "Third Party" && (
            <Input
              value={assignedToName}
              onChange={(e) => { setAssignedToName(e.target.value); markChanged(); }}
              placeholder="Enter name..."
              className="mt-2"
            />
          )}
        </div>

        {/* Linked Buyer */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Linked Buyer</Label>
          <Select value={buyerId || "none"} onValueChange={(v) => { setBuyerId(v === "none" ? "" : v); markChanged(); }}>
            <SelectTrigger>
              <SelectValue placeholder="No buyer linked" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No buyer</SelectItem>
              {buyers?.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id}>
                  {buyer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div className="p-4 border-t bg-muted/30 flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            if (task) {
              setTitle(task.title);
              setDescription(task.description || "");
              setDueDate(task.due_date ? new Date(task.due_date + "T00:00:00") : undefined);
              setPriority(task.priority);
              setStatus(task.status);
              setAssignedTo(task.assigned_to);
              setAssignedToName(task.assigned_to_name || "");
              setBuyerId(task.buyer_id || "");
              setHasChanges(false);
            }
          }}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={updateTask.isPending}>
            {updateTask.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
