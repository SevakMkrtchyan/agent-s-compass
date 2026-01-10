import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Clock, Home, FileText, GraduationCap, DollarSign, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { mockBuyers } from "@/data/mockData";
import { STAGES } from "@/types";
import { WorkspaceOverview } from "@/components/workspace/WorkspaceOverview";
import { WorkspaceTimeline } from "@/components/workspace/WorkspaceTimeline";
import { WorkspaceProperties } from "@/components/workspace/WorkspaceProperties";
import { WorkspaceOffers } from "@/components/workspace/WorkspaceOffers";
import { WorkspaceTasks } from "@/components/workspace/WorkspaceTasks";
import { WorkspaceAIEducation } from "@/components/workspace/WorkspaceAIEducation";
import { AIApprovalQueue } from "@/components/workspace/AIApprovalQueue";

export default function BuyerWorkspace() {
  const { buyerId } = useParams();
  const navigate = useNavigate();
  const buyer = mockBuyers.find((b) => b.id === buyerId) || mockBuyers[0];
  const stage = STAGES[buyer.currentStage];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/buyers")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">
                    {buyer.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-foreground">{buyer.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">
                      {stage.icon} Stage {buyer.currentStage}: {stage.title}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <Button>Advance Stage</Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Home className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <FileText className="h-4 w-4" />
              Tasks & Docs
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              AI Education
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-[1fr_350px] gap-6">
              <WorkspaceOverview buyer={buyer} />
              <AIApprovalQueue buyerId={buyer.id} />
            </div>
          </TabsContent>
          <TabsContent value="timeline"><WorkspaceTimeline buyer={buyer} /></TabsContent>
          <TabsContent value="properties"><WorkspaceProperties buyerId={buyer.id} /></TabsContent>
          <TabsContent value="offers"><WorkspaceOffers buyerId={buyer.id} /></TabsContent>
          <TabsContent value="tasks"><WorkspaceTasks buyer={buyer} /></TabsContent>
          <TabsContent value="education"><WorkspaceAIEducation buyer={buyer} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
