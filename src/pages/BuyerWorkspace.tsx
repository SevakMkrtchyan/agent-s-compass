import { useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutGrid, Layers, MessageCircle, FileText, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { StageProgress } from "@/components/stages/StageProgress";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockBuyers, mockProperties, mockMessages, stageEducationalContent } from "@/data/mockData";
import type { Message, Stage } from "@/types";
import { cn } from "@/lib/utils";

export default function BuyerWorkspace() {
  const { buyerId } = useParams();
  const buyer = mockBuyers.find((b) => b.id === buyerId) || mockBuyers[0];
  
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('grid');
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  const stageContent = stageEducationalContent[buyer.currentStage as keyof typeof stageEducationalContent];

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
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
  };

  const handleNextProperty = () => {
    setCurrentPropertyIndex((prev) => (prev + 1) % mockProperties.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="buyer" />

      <main className="container py-6">
        {/* Stage Progress */}
        <div className="mb-8">
          <StageProgress currentStage={buyer.currentStage} />
        </div>

        {/* Stage Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Stage {buyer.currentStage}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{stageContent.title}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {stageContent.title}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {stageContent.content}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {buyer.currentStage === 1 && (
              <>
                {/* View Mode Toggle */}
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg text-foreground">Properties for You</h2>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'swipe' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('swipe')}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Swipe
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                  </div>
                </div>

                {viewMode === 'swipe' ? (
                  <div className="flex justify-center">
                    <PropertyCard
                      property={mockProperties[currentPropertyIndex]}
                      variant="swipe"
                      onLike={handleNextProperty}
                      onPass={handleNextProperty}
                    />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {mockProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onViewDetails={() => {}}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {buyer.currentStage !== 1 && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stage Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{stageContent.content}</p>
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Key Tips:</h4>
                        <ul className="space-y-2">
                          {stageContent.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium flex-shrink-0">
                                {index + 1}
                              </span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No documents uploaded yet</p>
                        <p className="text-sm">Your agent will upload relevant documents here</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="checklist">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stageContent.tips.map((tip, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                          >
                            <input type="checkbox" className="h-4 w-4 rounded border-border" />
                            <span className="text-foreground">{tip}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* AI Chat Sidebar */}
          <div className={cn(
            "fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border z-50 transition-transform duration-300 lg:relative lg:inset-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:border-none",
            chatOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}>
            <div className="h-[calc(100vh-8rem)] lg:h-[600px]">
              <AIChatPanel
                stage={buyer.currentStage}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Mobile Chat Toggle */}
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-float lg:hidden z-40"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      </main>
    </div>
  );
}
