import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  BookOpen,
  Lock,
  CheckCircle2,
  Clock,
  User,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Buyer } from "@/types";
import { stageEducationalContent } from "@/data/mockData";
import { 
  CONTENT_TYPE_CONFIG, 
  mockPendingApprovals,
  type AIContentItem 
} from "@/types/aiContent";
import { cn } from "@/lib/utils";

interface WorkspaceAIEducationProps {
  buyer: Buyer;
  isAgentView?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  contentType?: string;
  requiresApproval?: boolean;
  approved?: boolean;
}

export function WorkspaceAIEducation({ buyer, isAgentView = false }: WorkspaceAIEducationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stageContent = stageEducationalContent[buyer.currentStage as keyof typeof stageEducationalContent];
  const buyerApprovals = mockPendingApprovals.filter((a) => a.buyerId === buyer.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);
      setInput("");
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Great question! Here's some educational information about "${input.trim()}":\n\nThe home buying process involves many considerations at each stage. Based on your current position in Stage ${buyer.currentStage} (${stageContent.title}), here are some key points to understand:\n\n• Your agent is the best resource for personalized guidance\n• Market conditions can vary significantly by neighborhood\n• Always review documents carefully before signing\n\nWould you like to learn more about any specific aspect?`,
          timestamp: new Date(),
          contentType: "general-education",
          requiresApproval: false,
          approved: true,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500);
    }
  };

  const quickQuestions = [
    "What should I know about earnest money?",
    "How do home inspections work?",
    "What are common contingencies?",
    "How is closing day structured?",
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat" className="gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved Content
            {buyerApprovals.filter((a) => a.approvalStatus === "approved").length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {buyerApprovals.filter((a) => a.approvalStatus === "approved").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Education Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg gradient-premium flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  AI Education Assistant
                </CardTitle>
                <Badge variant="outline" className="gap-1 text-info border-info/20 bg-info/10">
                  <Sparkles className="h-3 w-3" />
                  Educational Mode
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="h-16 w-16 rounded-2xl gradient-premium flex items-center justify-center mb-6">
                    <Bot className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Ask Me Anything
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    I can help you understand the home buying process with educational information.
                  </p>

                  {/* Educational Disclaimer */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20 text-sm mb-6 max-w-lg text-left">
                    <AlertCircle className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Educational Only:</strong> AI responses are for learning purposes and do not constitute professional advice. Your agent reviews and approves any advice-sensitive content.
                    </p>
                  </div>

                  {/* Quick Questions */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {quickQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => setInput(question)}
                        className="p-3 rounded-lg border text-sm text-left hover:bg-secondary/50 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "justify-end"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-xl px-4 py-3 max-w-[80%]",
                          message.role === "assistant"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                            <span className="text-xs opacity-70">Educational content</span>
                            <div className="flex gap-1 ml-auto">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-accent-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-secondary rounded-xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>

            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about home buying..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <div className="space-y-4">
            {buyerApprovals.filter((a) => a.approvalStatus === "approved").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Approved Content Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Your agent will review and approve AI-generated content about pricing, comparables, and negotiation strategies.
                  </p>
                </CardContent>
              </Card>
            ) : (
              buyerApprovals
                .filter((a) => a.approvalStatus === "approved")
                .map((content) => {
                  const config = CONTENT_TYPE_CONFIG[content.type];
                  return (
                    <Card key={content.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{config.icon}</span>
                            <div>
                              <CardTitle className="text-base">{content.title}</CardTitle>
                              <p className="text-xs text-muted-foreground">{config.label}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Agent Approved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                          {content.content}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}

            {/* Pending content notice for buyer */}
            {buyerApprovals.filter((a) => a.approvalStatus === "pending").length > 0 && (
              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">
                        {buyerApprovals.filter((a) => a.approvalStatus === "pending").length} item(s) pending approval
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your agent is reviewing AI-generated content about pricing and market analysis. You'll be notified when it's ready.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="library">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(CONTENT_TYPE_CONFIG).map(([type, config]) => (
              <Card key={type} className="hover:shadow-elevated transition-all cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">{config.label}</h4>
                        {config.requiresApproval && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Agent Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
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
