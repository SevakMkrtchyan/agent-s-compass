import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Bot,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  MessageSquare,
  FileText,
  ExternalLink,
  Copy,
  Check,
  X,
  Wand2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockWorkspaceMessages, currentUser } from "@/data/workspaceData";
import type { WorkspaceMessage, UserRole } from "@/types/workspace";

interface WorkspaceMessagesProps {
  workspaceId: string;
  userRole: UserRole;
}

export function WorkspaceMessages({ workspaceId, userRole }: WorkspaceMessagesProps) {
  const [messages, setMessages] = useState<WorkspaceMessage[]>(
    mockWorkspaceMessages.filter((m) => m.workspaceId === workspaceId)
  );
  const [newMessage, setNewMessage] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [showAIDraft, setShowAIDraft] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBroker = userRole === "broker";
  const pendingApprovals = messages.filter(
    (m) => m.isAIGenerated && m.approvalStatus === "pending"
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || isBroker) return;

    const message: WorkspaceMessage = {
      id: `msg-${Date.now()}`,
      workspaceId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: "agent",
      content: newMessage.trim(),
      timestamp: new Date(),
      isAIGenerated: false,
      requiresApproval: false,
      approvalStatus: "approved",
      messageType: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleGenerateAIDraft = () => {
    if (isBroker) return;
    setIsGeneratingDraft(true);

    setTimeout(() => {
      setAiDraft(
        "Based on the buyer's recent activity and current stage, I suggest:\n\n\"I noticed you've been reviewing the properties I shared. The home on Oak Street seems to align well with your criteria. Would you like to schedule a showing this weekend? I'm available Saturday afternoon or Sunday morning.\""
      );
      setShowAIDraft(true);
      setIsGeneratingDraft(false);
    }, 1500);
  };

  const handleApproveAIDraft = () => {
    setNewMessage(aiDraft);
    setShowAIDraft(false);
    setAiDraft("");
  };

  const handleApproveMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, approvalStatus: "approved", approvedBy: currentUser.id, approvedAt: new Date() }
          : m
      )
    );
  };

  const handleRejectMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, approvalStatus: "rejected" } : m
      )
    );
  };

  const MessageBubble = ({ message }: { message: WorkspaceMessage }) => {
    const isAgent = message.senderRole === "agent";
    const isAI = message.senderRole === "system";
    const isPending = message.approvalStatus === "pending";

    return (
      <div
        className={cn(
          "flex gap-3",
          isAgent && "justify-end"
        )}
      >
        {!isAgent && (
          <div
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isAI ? "bg-info/10" : "bg-accent"
            )}
          >
            {isAI ? (
              <Bot className="h-4 w-4 text-info" />
            ) : (
              <User className="h-4 w-4 text-accent-foreground" />
            )}
          </div>
        )}

        <div className={cn("max-w-[75%]", isPending && "opacity-75")}>
          {/* Sender Info */}
          <div className={cn("flex items-center gap-2 mb-1", isAgent && "justify-end")}>
            <span className="text-xs font-medium text-muted-foreground">
              {message.senderName}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {formatTimestamp(message.timestamp)}
            </span>
            {isAI && isPending && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-warning/10 text-warning border-warning/20">
                <Clock className="h-2.5 w-2.5" />
                Pending Approval
              </Badge>
            )}
          </div>

          {/* Message Content */}
          <div
            className={cn(
              "rounded-xl px-4 py-3",
              isAgent
                ? "bg-primary text-primary-foreground"
                : isAI
                ? "bg-info/10 border border-info/20"
                : "bg-secondary"
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {/* AI Draft Actions */}
            {isAI && isPending && !isBroker && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 bg-success/10 text-success border-success/20 hover:bg-success/20"
                  onClick={() => handleApproveMessage(message.id)}
                >
                  <Check className="h-3 w-3" />
                  Approve & Send
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleRejectMessage(message.id)}
                >
                  <X className="h-3 w-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 ml-auto"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
            )}
          </div>
        </div>

        {isAgent && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="ai-guidance" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Guidance
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quick-links" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Quick Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message Feed
                </CardTitle>
                {isBroker && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Read-Only
                  </Badge>
                )}
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* AI Draft Preview */}
            {showAIDraft && !isBroker && (
              <div className="mx-4 mb-3 p-4 rounded-xl bg-info/10 border border-info/20">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">AI-Generated Draft</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setShowAIDraft(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                      {aiDraft}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleApproveAIDraft} className="gap-1">
                        <Check className="h-3 w-3" />
                        Use This Draft
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAIDraft(false)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Input */}
            {!isBroker && (
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={handleGenerateAIDraft}
                    disabled={isGeneratingDraft}
                  >
                    {isGeneratingDraft ? (
                      <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to send to buyer..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <Wand2 className="h-3 w-3 inline mr-1" />
                  Click the wand to generate an AI draft. AI drafts require your approval before sending.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="ai-guidance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Guidance & Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.map((msg) => (
                    <div key={msg.id} className="p-4 rounded-xl border bg-warning/5 border-warning/20">
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Pending Approval</span>
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                              AI-Generated
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                            {msg.content}
                          </p>
                          {!isBroker && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gap-1 bg-success hover:bg-success/90"
                                onClick={() => handleApproveMessage(msg.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => handleRejectMessage(msg.id)}
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No pending AI-generated content requires approval.
                  </p>
                </div>
              )}

              {/* Educational Note */}
              <div className="mt-6 p-4 rounded-xl bg-info/10 border border-info/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">About AI Guidance</p>
                    <p className="text-sm text-muted-foreground">
                      AI can help draft messages and provide educational content. All outbound AI-generated messages 
                      require agent approval before being sent to buyers. This ensures compliance and maintains 
                      the personal touch in client communications.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick-links">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Timeline", description: "View journey progress and milestones", icon: "📅", tab: "timeline" },
              { title: "Properties & Comps", description: "Review properties and market comparisons", icon: "🏠", tab: "properties" },
              { title: "Offers", description: "Manage offer scenarios and active offers", icon: "💰", tab: "offers" },
              { title: "Tasks & Documents", description: "Track tasks and access documents", icon: "📋", tab: "tasks" },
            ].map((link) => (
              <Card key={link.tab} className="hover:shadow-elevated transition-all cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{link.icon}</span>
                    <div>
                      <h4 className="font-medium text-foreground">{link.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{link.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
