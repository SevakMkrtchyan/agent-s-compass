import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Bot, User, Sparkles, AlertCircle, Home, FileText, CheckSquare, LayoutGrid } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { StageProgress } from "@/components/stages/StageProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockBuyers, mockProperties, mockMessages, stageEducationalContent } from "@/data/mockData";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

export default function BuyerWorkspace() {
  const { buyerId } = useParams();
  const buyer = mockBuyers.find((b) => b.id === buyerId) || mockBuyers[0];
  
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stageContent = stageEducationalContent[buyer.currentStage as keyof typeof stageEducationalContent];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);
      setInput("");
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Thank you for your question! Based on your current stage in the home buying process, here's some educational information that may help...\n\nYour agent has prepared specific materials for you to review. Please check the approved content section for detailed guidance tailored to your situation.",
          timestamp: new Date(),
          isEducational: true,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500);
    }
  };

  const quickActions = [
    { icon: Home, label: "View Properties", prompt: "Show me the properties my agent has selected for me" },
    { icon: FileText, label: "Documents", prompt: "What documents do I need for this stage?" },
    { icon: CheckSquare, label: "My Tasks", prompt: "What tasks should I complete in this stage?" },
    { icon: LayoutGrid, label: "Stage Overview", prompt: "Give me an overview of what happens in this stage" },
  ];

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar userType="buyer" />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Compact Stage Progress */}
        <div className="px-4 py-3 border-b border-border">
          <StageProgress currentStage={buyer.currentStage} />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-premium mb-6">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                HomeGuide AI
              </h1>
              <p className="text-muted-foreground max-w-md mb-2">
                Your educational assistant for the home buying journey
              </p>
              <div className="flex items-center gap-2 text-sm text-accent mb-8">
                <Sparkles className="h-4 w-4" />
                <span>Stage {buyer.currentStage}: {stageContent.title}</span>
              </div>

              {/* Educational Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20 text-sm mb-8 max-w-lg text-left">
                <AlertCircle className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  AI responses are educational only and do not constitute advice. 
                  Consult your agent for personalized guidance.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                      <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Thread */}
          {messages.length > 0 && (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 animate-fade-in",
                    message.role === "user" && "justify-end"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-5 py-3 max-w-[80%]",
                      message.role === "assistant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.isEducational && message.role === "assistant" && (
                      <span className="text-xs opacity-70 mt-2 block">
                        Educational content only
                      </span>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 animate-fade-in">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground flex-shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-5 py-4">
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
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your home buying journey..."
                className="flex-1 h-12 text-base px-4"
                disabled={isLoading}
              />
              <Button type="submit" size="lg" className="h-12 px-6" disabled={!input.trim() || isLoading}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              HomeGuide AI provides educational information only. Always consult your agent for advice.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
