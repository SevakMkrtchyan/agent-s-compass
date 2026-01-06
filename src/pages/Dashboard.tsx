import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, TrendingUp, Clock, CheckCircle, Search, Filter } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BuyerCard } from "@/components/buyer/BuyerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockBuyers } from "@/data/mockData";
import { STAGES } from "@/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredBuyers = mockBuyers.filter(
    (buyer) =>
      buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    {
      title: "Active Buyers",
      value: mockBuyers.length,
      icon: Users,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "In Home Search",
      value: mockBuyers.filter((b) => b.currentStage === 1).length,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Under Contract",
      value: mockBuyers.filter((b) => b.currentStage >= 3 && b.currentStage < 5).length,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Closed This Month",
      value: mockBuyers.filter((b) => b.currentStage === 5).length,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="agent" />
      
      <main className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome back, Agent
            </h1>
            <p className="text-muted-foreground">
              Manage your buyers and guide them through their journey
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add New Buyer
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stage Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {STAGES.map((stage) => {
                const count = mockBuyers.filter((b) => b.currentStage === stage.stage).length;
                return (
                  <div
                    key={stage.stage}
                    className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <span className="text-2xl mb-2 block">{stage.icon}</span>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{stage.title}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Buyers List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBuyers.map((buyer) => (
              <BuyerCard
                key={buyer.id}
                buyer={buyer}
                onSelect={() => navigate(`/buyer/${buyer.id}`)}
              />
            ))}
          </div>

          {filteredBuyers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No buyers found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
