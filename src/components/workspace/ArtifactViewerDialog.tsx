import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Lock, Share2, Trash2, RefreshCw, FileText } from "lucide-react";
import { StreamingText } from "./StreamingText";
import type { Artifact } from "@/hooks/useArtifacts";

interface ArtifactViewerDialogProps {
  artifact: Artifact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare?: (artifact: Artifact) => Promise<void>;
  onDelete?: (artifact: Artifact) => Promise<void>;
  onRegenerate?: (artifact: Artifact) => void;
  isSharing?: boolean;
  isDeleting?: boolean;
}

export function ArtifactViewerDialog({
  artifact,
  open,
  onOpenChange,
  onShare,
  onDelete,
  onRegenerate,
  isSharing,
  isDeleting,
}: ArtifactViewerDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!artifact) return null;

  const isShared = artifact.visibility === "shared";
  const createdDate = new Date(artifact.created_at);

  const handleShare = async () => {
    if (onShare && !isShared) {
      await onShare(artifact);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(artifact);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(artifact);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold leading-tight pr-8">
                  {artifact.title}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-3 flex-wrap">
                  <Badge variant={isShared ? "default" : "secondary"} className="gap-1">
                    {isShared ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Shared with buyer
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        Internal only
                      </>
                    )}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    Created {format(createdDate, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <StreamingText
                content={artifact.content}
                isComplete={true}
                className="text-sm leading-relaxed"
              />
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between gap-3 pt-4 border-t flex-shrink-0 mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
              {!isShared && onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={isSharing}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  {isSharing ? "Sharing..." : "Share with Buyer"}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this artifact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{artifact.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ExistingArtifactDialogProps {
  artifact: Artifact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewExisting: () => void;
  onGenerateNew: () => void;
}

export function ExistingArtifactDialog({
  artifact,
  open,
  onOpenChange,
  onViewExisting,
  onGenerateNew,
}: ExistingArtifactDialogProps) {
  if (!artifact) return null;

  const createdDate = new Date(artifact.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Artifact Already Exists
          </DialogTitle>
          <DialogDescription className="pt-2">
            You already created this artifact on {format(createdDate, "MMM d, yyyy")}.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <p className="font-medium text-sm truncate">{artifact.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {artifact.visibility === "shared" ? "Shared with buyer" : "Internal only"}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onViewExisting();
              onOpenChange(false);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Existing
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onGenerateNew();
              onOpenChange(false);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
