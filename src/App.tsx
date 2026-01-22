import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AgentGPT from "./pages/AgentGPT";
import Workspace from "./pages/Workspace";
import GlobalTasks from "./pages/GlobalTasks";
import GlobalProperties from "./pages/GlobalProperties";
import GlobalOffers from "./pages/GlobalOffers";
import Analytics from "./pages/Analytics";
import AddBuyer from "./pages/AddBuyer";
import AddProperty from "./pages/AddProperty";
import WorkspaceList from "./pages/WorkspaceList";
import Buyers from "./pages/Buyers";
import NotFound from "./pages/NotFound";
import { StagesTest } from "./components/dev/StagesTest";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* AgentGPT is the default landing page */}
          <Route path="/" element={<Navigate to="/agentgpt" replace />} />
          <Route path="/agentgpt" element={<AgentGPT />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<Navigate to="/agentgpt" replace />} />
          <Route path="/workspace/:workspaceId" element={<Workspace />} />
          <Route path="/tasks" element={<GlobalTasks />} />
          <Route path="/properties" element={<GlobalProperties />} />
          <Route path="/offers" element={<GlobalOffers />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/add-buyer" element={<AddBuyer />} />
          <Route path="/add-property" element={<AddProperty />} />
          {/* Buyers page */}
          <Route path="/buyers" element={<Buyers />} />
          {/* Legacy buyer route */}
          <Route path="/buyer/:buyerId" element={<Navigate to="/agentgpt" replace />} />
          {/* Dev routes */}
          <Route path="/dev/stages-test" element={<StagesTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;