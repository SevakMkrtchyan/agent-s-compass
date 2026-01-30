import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface PortalOffersProps {
  buyerId: string;
}

interface OfferWithProperty {
  id: string;
  offer_amount: number;
  status: string;
  created_at: string;
  submitted_at: string | null;
  property: {
    address: string;
    city: string;
    state: string;
    price: number;
  } | null;
}

export function PortalOffers({ buyerId }: PortalOffersProps) {
  const { data: offers, isLoading } = useQuery({
    queryKey: ["portal-offers", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          id,
          offer_amount,
          status,
          created_at,
          submitted_at,
          property:properties(address, city, state, price)
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as OfferWithProperty[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
      case "withdrawn":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "submitted":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "default";
      case "rejected":
      case "withdrawn":
        return "destructive";
      case "submitted":
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Your Offers</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Your Offers</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No offers yet</p>
            <p className="text-muted-foreground text-sm">
              When you're ready to make an offer, your agent will help you submit it
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Offers</h1>
        <Badge variant="secondary">{offers.length} offers</Badge>
      </div>

      <div className="space-y-4">
        {offers.map((offer) => (
          <Card key={offer.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(offer.status)}
                    <Badge variant={getStatusVariant(offer.status)}>
                      {offer.status}
                    </Badge>
                  </div>
                  <p className="font-medium">
                    {offer.property?.address || "Property Address"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {offer.property?.city}, {offer.property?.state}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(offer.offer_amount)}
                  </p>
                  {offer.property && (
                    <p className="text-sm text-muted-foreground">
                      List: {formatPrice(offer.property.price)} (
                      {Math.round((offer.offer_amount / offer.property.price) * 100)}%)
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {offer.submitted_at
                      ? `Submitted ${format(new Date(offer.submitted_at), "MMM d, yyyy")}`
                      : `Created ${format(new Date(offer.created_at), "MMM d, yyyy")}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
