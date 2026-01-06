import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Users, Sparkles, Home, CheckCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STAGES } from "@/types";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Agent-Controlled",
      description: "Agents maintain full control over all AI content and buyer communications.",
    },
    {
      icon: Bot,
      title: "AI-Augmented",
      description: "Educational AI explanations help buyers understand complex real estate concepts.",
    },
    {
      icon: Users,
      title: "End-to-End Guidance",
      description: "Guide buyers through all 6 stages from readiness to closing and beyond.",
    },
    {
      icon: Sparkles,
      title: "Transparent Process",
      description: "Full transparency at every step with clear explanations and checklists.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-premium">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              HomeGuide
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/workspace/1")}>
              Buyer Demo
            </Button>
            <Button onClick={() => navigate("/dashboard")}>
              Agent Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden gradient-hero py-20 lg:py-32">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Augmented Real Estate Platform</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Guide Your Buyers with{" "}
                <span className="text-accent">Confidence</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                The AI-augmented platform that gives agents control while providing buyers 
                with transparent, educational guidance through every stage of their home buying journey.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" className="gap-2" onClick={() => navigate("/dashboard")}>
                  Enter Agent Portal
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="xl" variant="outline" onClick={() => navigate("/workspace/1")}>
                  See Buyer Experience
                </Button>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Built for Modern Real Estate
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A platform designed with agents as primary users and buyers as the beneficiaries 
                of AI-powered educational content.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="hover:shadow-elevated transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 mb-4">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stages Overview */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                6-Stage Buyer Journey
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A structured workflow that guides buyers from initial readiness through 
                closing and post-close ownership responsibilities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STAGES.map((stage) => (
                <Card key={stage.stage} className="group hover:shadow-elevated transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl">
                        {stage.icon}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Stage {stage.stage}</span>
                        <h3 className="font-semibold text-foreground">{stage.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{stage.description}</p>
                    <ul className="space-y-2">
                      {stage.buyerTasks.slice(0, 2).map((task, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-success" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 gradient-premium">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Client Experience?
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join agents who are already using AI-augmented guidance to provide 
              unprecedented transparency in the home buying process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="accent" onClick={() => navigate("/dashboard")}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-premium">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              HomeGuide
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 HomeGuide. AI-Augmented Real Estate Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
