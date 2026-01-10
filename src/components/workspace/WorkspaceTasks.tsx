import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Upload,
  Download,
  Eye,
  Calendar,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Buyer, STAGES } from "@/types";

interface WorkspaceTasksProps {
  buyer: Buyer;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
  assignedTo: "agent" | "buyer";
  stage: number;
  priority: "low" | "medium" | "high";
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

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Confirm pre-approval letter",
    description: "Upload or confirm your mortgage pre-approval documentation",
    dueDate: new Date("2024-01-20"),
    completed: true,
    assignedTo: "buyer",
    stage: 0,
    priority: "high",
  },
  {
    id: "2",
    title: "Review orientation materials",
    description: "Read through the home buying orientation guide",
    completed: true,
    assignedTo: "buyer",
    stage: 0,
    priority: "medium",
  },
  {
    id: "3",
    title: "Review selected properties",
    description: "Review the properties your agent has selected for you",
    dueDate: new Date("2024-01-22"),
    completed: false,
    assignedTo: "buyer",
    stage: 1,
    priority: "high",
  },
  {
    id: "4",
    title: "Schedule property tours",
    description: "Coordinate with agent to schedule in-person property viewings",
    completed: false,
    assignedTo: "buyer",
    stage: 1,
    priority: "medium",
  },
  {
    id: "5",
    title: "Provide feedback on properties",
    description: "Share your thoughts on each property after viewing",
    completed: false,
    assignedTo: "buyer",
    stage: 1,
    priority: "low",
  },
];

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

export function WorkspaceTasks({ buyer }: WorkspaceTasksProps) {
  const [tasks, setTasks] = useState(mockTasks);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const buyerTasks = tasks.filter((t) => t.assignedTo === "buyer");
  const completedTasks = buyerTasks.filter((t) => t.completed);
  const pendingTasks = buyerTasks.filter((t) => !t.completed);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingTasks.length}
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
            {/* Progress Overview */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Progress</p>
                    <p className="text-2xl font-bold">
                      {completedTasks.length} / {buyerTasks.length}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {Math.round((completedTasks.length / buyerTasks.length) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Pending Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-foreground">{task.title}</h4>
                            {getPriorityBadge(task.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {task.description}
                          </p>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Due {formatDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                        <span className="text-muted-foreground line-through">
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                        <h4 className="font-medium text-foreground text-sm">{doc.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {doc.category} • Uploaded {formatDate(doc.uploadedAt)} by {doc.uploadedBy}
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
    </div>
  );
}
