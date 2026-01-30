import { useState } from "react";
import { ExternalLink, Copy, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PortalLinkDialogProps {
  buyerId: string;
  buyerName: string;
  portalToken: string | null;
  onTokenUpdated: (newToken: string) => void;
}

export function PortalLinkDialog({ 
  buyerId, 
  buyerName, 
  portalToken,
  onTokenUpdated 
}: PortalLinkDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const portalUrl = portalToken 
    ? `${window.location.origin}/portal/${buyerId}?token=${portalToken}`
    : null;

  const generateToken = async () => {
    setIsGenerating(true);
    try {
      // Generate a secure token
      const array = new Uint8Array(24);
      crypto.getRandomValues(array);
      const token = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase
        .from("buyers")
        .update({ portal_token: token })
        .eq("id", buyerId);

      if (error) throw error;

      onTokenUpdated(token);
      toast({
        title: "Portal link generated",
        description: "You can now share this link with your buyer.",
      });
    } catch (error) {
      console.error("Failed to generate portal token:", error);
      toast({
        title: "Error generating link",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!portalUrl) return;
    
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast({
        title: "Link copied!",
        description: "The portal link has been copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please select and copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const openPortal = () => {
    if (portalUrl) {
      window.open(portalUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Link2 className="h-3.5 w-3.5" />
          Portal Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buyer Portal Link</DialogTitle>
          <DialogDescription>
            Share this link with {buyerName} so they can access their buyer portal and chat with AI assistance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {portalUrl ? (
            <>
              <div className="flex gap-2">
                <Input 
                  value={portalUrl} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={openPortal}>
                  <ExternalLink className="h-4 w-4" />
                  Open Portal
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={generateToken}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate Link
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                ⚠️ Regenerating will invalidate the previous link. Only do this if the link was compromised.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                No portal link exists yet. Generate one to share with your buyer.
              </p>
              <Button onClick={generateToken} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Generate Portal Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
