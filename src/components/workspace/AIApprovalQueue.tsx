import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import { 
  CONTENT_TYPE_CONFIG, 
  mockPendingApprovals,
  type AIContentItem,
  type ApprovalStatus 
} from "@/types/aiContent";
import { mockBuyers } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface AIApprovalQueueProps {
  buyerId?: string; // If provided, filter to specific buyer
}

export function AIApprovalQueue({ buyerId }: AIApprovalQueueProps) {
  const [approvals, setApprovals] = useState(mockPendingApprovals);
  const [selectedContent, setSelectedContent] = useState<AIContentItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const filteredApprovals = buyerId
    ? approvals.filter((a) => a.buyerId === buyerId)
    : approvals;

  const pendingApprovals = filteredApprovals.filter((a) => a.approvalStatus === "pending");

  const handleApprove = (contentId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === contentId
          ? { ...a, approvalStatus: "approved" as ApprovalStatus, approvedAt: new Date() }
          : a
      )
    );
    setSelectedContent(null);
  };

  const handleReject = (contentId: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === contentId
          ? { ...a, approvalStatus: "rejected" as ApprovalStatus, rejectionReason: rejectReason }
          : a
      )
    );
    setShowRejectDialog(false);
    setRejectReason("");
    setSelectedContent(null);
  };

  const getBuyer = (buyerId: string) => {
    return mockBuyers.find((b) => b.id === buyerId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Content Approval</h3>
          <p className="text-sm text-muted-foreground">
            Review and approve AI-generated content before it's visible to buyers
          </p>
        </div>
        {pendingApprovals.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {pendingApprovals.length} Pending
          </Badge>
        )}
      </div>

      {/* Empty State */}
      {pendingApprovals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">All Caught Up!</h3>
            <p className="text-sm text-muted-foreground">
              No AI content pending approval at this time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Approvals */}
      <div className="space-y-3">
        {pendingApprovals.map((content) => {
          const config = CONTENT_TYPE_CONFIG[content.type];
          const buyer = getBuyer(content.buyerId);

          return (
            <Card key={content.id} className="border-warning/30 bg-warning/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{config.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-medium text-foreground">{content.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs gap-1">
                            <Bot className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {buyer && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <User className="h-3 w-3" />
                              {buyer.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(content.createdAt)}
                      </span>
                    </div>

                    {/* Preview */}
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {content.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setSelectedContent(content)}
                      >
                        <Eye className="h-3 w-3" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1 bg-success hover:bg-success/90"
                        onClick={() => handleApprove(content.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedContent(content);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedContent && !showRejectDialog} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{CONTENT_TYPE_CONFIG[selectedContent.type].icon}</span>
                  <div>
                    <DialogTitle>{selectedContent.title}</DialogTitle>
                    <DialogDescription>
                      {CONTENT_TYPE_CONFIG[selectedContent.type].label} • Generated {formatDate(selectedContent.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4">
                <div className="p-4 rounded-lg bg-secondary/50 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">AI-Generated Content</span>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {selectedContent.content}
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Review Carefully</p>
                      <p className="text-muted-foreground mt-1">
                        This content includes {CONTENT_TYPE_CONFIG[selectedContent.type].label.toLowerCase()}.
                        Ensure all information is accurate before approving for buyer visibility.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedContent(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="gap-1 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="gap-1 bg-success hover:bg-success/90"
                  onClick={() => handleApprove(selectedContent.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This helps improve future AI-generated content.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedContent && handleReject(selectedContent.id)}
              disabled={!rejectReason.trim()}
            >
              Reject Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
