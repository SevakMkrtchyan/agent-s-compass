import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { PortalChat } from "@/components/portal/PortalChat";
import { PortalDashboard } from "@/components/portal/PortalDashboard";
import { PortalProperties } from "@/components/portal/PortalProperties";
import { PortalOffers } from "@/components/portal/PortalOffers";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { Loader2 } from "lucide-react";

export interface PortalBuyer {
  id: string;
  name: string;
  email: string | null;
  current_stage: string | null;
  budget_min: number | null;
  budget_max: number | null;
  pre_approval_status: string | null;
  pre_approval_amount: number | null;
  preferred_cities: string[] | null;
  property_types: string[] | null;
  min_beds: number | null;
  min_baths: number | null;
  must_haves: string | null;
  nice_to_haves: string | null;
  portal_token: string | null;
}

type PortalTab = "chat" | "dashboard" | "properties" | "offers" | "documents";

export default function BuyerPortal() {
  const { buyerId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [buyer, setBuyer] = useState<PortalBuyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTab>("chat");

  useEffect(() => {
    async function verifyAccess() {
      if (!buyerId || !token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("buyers")
          .select("id, name, email, current_stage, budget_min, budget_max, pre_approval_status, pre_approval_amount, preferred_cities, property_types, min_beds, min_baths, must_haves, nice_to_haves, portal_token")
          .eq("id", buyerId)
          .eq("portal_token", token)
          .single();

        if (error || !data) {
          console.error("Portal access denied:", error);
          setIsAuthenticated(false);
        } else {
          setBuyer(data as PortalBuyer);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Portal verification failed:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAccess();
  }, [buyerId, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !buyer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            This portal link is invalid or has expired. Please contact your real estate agent for a new access link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PortalLayout 
      buyer={buyer} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      renderChat={(onOpenMenu) => <PortalChat buyer={buyer} onOpenMenu={onOpenMenu} />}
    >
      {activeTab === "dashboard" && <PortalDashboard buyer={buyer} />}
      {activeTab === "properties" && <PortalProperties buyerId={buyer.id} />}
      {activeTab === "offers" && <PortalOffers buyerId={buyer.id} />}
      {activeTab === "documents" && <PortalDocuments buyerId={buyer.id} />}
    </PortalLayout>
  );
}
