import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Trash2,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Offer } from "@/hooks/useOffers";
import { format } from "date-fns";

interface OfferDetailModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (offerId: string, status: Offer["status"]) => Promise<boolean>;
  onDelete: (offerId: string) => Promise<boolean>;
  onAgentCommand?: (command: string) => void;
}

export function OfferDetailModal({
  offer,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
  onAgentCommand,
}: OfferDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!offer) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  const getStatusColor = (status: Offer["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-muted text-muted-foreground";
      case "Submitted":
        return "bg-primary/10 text-primary";
      case "Countered":
        return "bg-warning/10 text-warning";
      case "Accepted":
        return "bg-success/10 text-success";
      case "Rejected":
      case "Withdrawn":
        return "bg-destructive/10 text-destructive";
    }
  };

  const getStatusIcon = (status: Offer["status"]) => {
    switch (status) {
      case "Draft":
        return <FileText className="h-4 w-4" />;
      case "Submitted":
        return <Clock className="h-4 w-4" />;
      case "Countered":
        return <AlertCircle className="h-4 w-4" />;
      case "Accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "Rejected":
      case "Withdrawn":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (newStatus: Offer["status"]) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(offer.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const success = await onDelete(offer.id);
    if (success) onClose();
  };

  const contingencyLabels: Record<string, string> = {
    financing: "Financing",
    inspection: "Inspection",
    appraisal: "Appraisal",
    "sale-of-home": "Sale of Home",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Offer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property Info */}
          {offer.property && (
            <div className="p-4 border border-border bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{offer.property.address}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {offer.property.city}, {offer.property.state} {offer.property.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {offer.property.bedrooms} bed, {offer.property.bathrooms} bath, {offer.property.sqft.toLocaleString()} sqft
                  </p>
                  <p className="text-sm font-medium mt-1">
                    List Price: {formatPrice(offer.property.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Offer Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-border">
              <p className="text-sm text-muted-foreground">Offer Amount</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(offer.offerAmount)}</p>
              {offer.property && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(() => {
                    const diff = offer.offerAmount - offer.property.price;
                    const percent = ((diff / offer.property.price) * 100).toFixed(1);
                    return diff >= 0
                      ? `+${percent}% above list`
                      : `${percent}% below list`;
                  })()}
                </p>
              )}
            </div>

            <div className="p-4 border border-border">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={cn("mt-1 border-0 flex items-center gap-1 w-fit", getStatusColor(offer.status))}
              >
                {getStatusIcon(offer.status)}
                {offer.status}
              </Badge>
            </div>

            <div className="p-4 border border-border">
              <p className="text-sm text-muted-foreground">Earnest Money</p>
              <p className="font-medium text-foreground">
                {formatPrice(offer.fieldValues.earnestMoney || 0)}
              </p>
              {offer.offerAmount && (
                <p className="text-xs text-muted-foreground">
                  {(((offer.fieldValues.earnestMoney || 0) / offer.offerAmount) * 100).toFixed(1)}% of offer
                </p>
              )}
            </div>

            <div className="p-4 border border-border">
              <p className="text-sm text-muted-foreground">Closing Cost Credit</p>
              <p className="font-medium text-foreground">
                {formatPrice(offer.fieldValues.closingCostCredit || 0)}
              </p>
            </div>
          </div>

          {/* Closing Date */}
          {offer.fieldValues.closingDate && (
            <div className="p-4 border border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Proposed Closing Date</p>
              </div>
              <p className="font-medium text-foreground mt-1">
                {format(new Date(offer.fieldValues.closingDate), "MMMM d, yyyy")}
              </p>
            </div>
          )}

          {/* Contingencies */}
          <div className="p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">Contingencies</p>
            <div className="flex flex-wrap gap-2">
              {(offer.fieldValues.contingencies || []).length > 0 ? (
                offer.fieldValues.contingencies!.map((c) => (
                  <Badge key={c} variant="secondary" className="bg-muted text-muted-foreground border-0">
                    {contingencyLabels[c] || c}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No contingencies (clean offer)</span>
              )}
            </div>
          </div>

          {/* Notes */}
          {offer.fieldValues.notes && (
            <div className="p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-foreground">{offer.fieldValues.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="p-4 border border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground mb-3">Activity Timeline</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Created: {format(new Date(offer.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
              {offer.submittedAt && (
                <div className="flex items-center gap-2 text-primary">
                  <Send className="h-4 w-4" />
                  <span>Submitted: {format(new Date(offer.submittedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {offer.status === "Draft" && (
              <>
                <Button
                  onClick={() => handleStatusChange("Submitted")}
                  disabled={isUpdating}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAgentCommand?.(`Review and optimize draft offer for ${offer.property?.address || "property"}`)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Review
                </Button>
              </>
            )}

            {offer.status === "Submitted" && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("Withdrawn")}
                disabled={isUpdating}
              >
                Withdraw Offer
              </Button>
            )}

            {offer.status === "Countered" && (
              <>
                <Button
                  onClick={() => handleStatusChange("Accepted")}
                  disabled={isUpdating}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Counter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("Rejected")}
                  disabled={isUpdating}
                >
                  Reject Counter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAgentCommand?.(`Draft counter-offer response for ${offer.property?.address}`)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Draft Counter
                </Button>
              </>
            )}

            {["Draft", "Rejected", "Withdrawn"].includes(offer.status) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this offer. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
