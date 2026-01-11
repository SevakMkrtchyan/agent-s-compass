import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Mail,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Buyer } from "@/types";
import { cn } from "@/lib/utils";

interface WorkspaceAIEducationProps {
  buyer: Buyer;
  isAgentView?: boolean;
}

interface Message {
  id: string;
  type: "incoming" | "outgoing" | "ai-draft";
  content: string;
  timestamp: Date;
  status?: "sent" | "delivered" | "read" | "pending-approval";
  sender: string;
}

interface AIDraft {
  id: string;
  type: "email" | "sms" | "update";
  subject?: string;
  content: string;
  context: string;
  createdAt: Date;
  status: "pending" | "approved" | "rejected" | "edited";
}

export function WorkspaceAIEducation({ buyer }: WorkspaceAIEducationProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", type: "incoming", content: "Hi! I was wondering about the property on Oak Street. Is it still available?", timestamp: new Date(Date.now() - 3600000), sender: buyer.name, status: "read" },
    { id: "2", type: "outgoing", content: "Yes, 123 Oak Street is still available! I'd love to schedule a showing for you. What times work best this week?", timestamp: new Date(Date.now() - 3000000), sender: "You", status: "delivered" },
    { id: "3", type: "incoming", content: "Saturday afternoon would be great if possible.", timestamp: new Date(Date.now() - 1800000), sender: buyer.name, status: "read" },
  ]);

  const [aiDrafts, setAIDrafts] = useState<AIDraft[]>([
    { 
      id: "d1", 
      type: "email", 
      subject: "New Listings Matching Your Criteria",
      content: `Hi ${buyer.name},\n\nI found 3 new properties that match your search criteria. I've added them to your workspace for review.\n\nHighlights:\n• 789 Pine Road - $425,000 - 4 bed, 2.5 bath\n• 321 Cedar Lane - $398,000 - 3 bed, 2 bath\n• 567 Birch Ave - $445,000 - 4 bed, 3 bath\n\nWould you like to schedule viewings for any of these properties?\n\nBest regards`,
      context: "New properties added to workspace matching buyer criteria",
      createdAt: new Date(Date.now() - 1200000),
      status: "pending"
    },
    {
      id: "d2",
      type: "update",
      content: `Price reduction alert: The property at 456 Maple Avenue has been reduced by $15,000. This is now within your stated budget range. Would you like to reconsider this property?`,
      context: "Property price change detected",
      createdAt: new Date(Date.now() - 600000),
      status: "pending"
    }
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [aiPrompt, setAIPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message: Message = {
      id: Date.now().toString(),
      type: "outgoing",
      content: newMessage,
      timestamp: new Date(),
      sender: "You",
      status: "sent"
    };
    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleApproveDraft = (draftId: string) => {
    setAIDrafts(drafts => 
      drafts.map(d => d.id === draftId ? { ...d, status: "approved" as const } : d)
    );
  };

  const handleRejectDraft = (draftId: string) => {
    setAIDrafts(drafts => 
      drafts.map(d => d.id === draftId ? { ...d, status: "rejected" as const } : d)
    );
  };

  const handleGenerateAIDraft = () => {
    if (!aiPrompt.trim()) return;
    const newDraft: AIDraft = {
      id: Date.now().toString(),
      type: "email",
      subject: "Generated Draft",
      content: `Based on your request: "${aiPrompt}"\n\n[AI-generated content would appear here based on context and buyer data]`,
      context: aiPrompt,
      createdAt: new Date(),
      status: "pending"
    };
    setAIDrafts([newDraft, ...aiDrafts]);
    setAIPrompt("");
  };

  const pendingDrafts = aiDrafts.filter(d => d.status === "pending");
  const processedDrafts = aiDrafts.filter(d => d.status !== "pending");

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      {/* Messages Panel */}
      <Card className="flex flex-col h-[700px]">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages with {buyer.name}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {messages.filter(m => m.type === "incoming" && m.status !== "read").length} unread
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={cn(
                    "flex",
                    message.type === "outgoing" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.type === "outgoing" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <p className="text-sm">{message.content}</p>
                    <div className={cn(
                      "flex items-center gap-2 mt-1 text-xs",
                      message.type === "outgoing" ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.type === "outgoing" && message.status && (
                        <span className="capitalize">{message.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Drafts Panel */}
      <div className="space-y-6">
        {/* Generate AI Draft */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Generate AI Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="Describe what you want to communicate... e.g., 'Follow up about weekend showing'"
              className="min-h-[80px] text-sm"
            />
            <Button onClick={handleGenerateAIDraft} className="w-full gap-2" disabled={!aiPrompt.trim()}>
              <Sparkles className="h-4 w-4" />
              Generate Draft
            </Button>
          </CardContent>
        </Card>

        {/* Pending AI Drafts */}
        {pendingDrafts.length > 0 && (
          <Card className="border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Pending Approval
                <Badge variant="secondary" className="ml-auto">{pendingDrafts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingDrafts.map((draft) => (
                <div key={draft.id} className="p-3 rounded-lg border bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{draft.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatTime(draft.createdAt)}</span>
                  </div>
                  {draft.subject && (
                    <p className="text-sm font-medium mb-1">{draft.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                    {draft.content}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleApproveDraft(draft.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approve & Send
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleRejectDraft(draft.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Drafts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
              <Mail className="h-4 w-4" />
              Draft showing confirmation
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
              <FileText className="h-4 w-4" />
              Draft offer summary
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
              <RefreshCw className="h-4 w-4" />
              Draft status update
            </Button>
          </CardContent>
        </Card>

        {/* Recent Drafts */}
        {processedDrafts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Drafts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {processedDrafts.slice(0, 3).map((draft) => (
                <div key={draft.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={draft.status === "approved" ? "default" : "secondary"} 
                      className="text-[10px]"
                    >
                      {draft.status}
                    </Badge>
                    <span className="text-xs truncate max-w-[180px]">
                      {draft.subject || draft.content.slice(0, 30)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(draft.createdAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
