import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface PortalDocumentsProps {
  buyerId: string;
}

interface SharedArtifact {
  id: string;
  title: string;
  artifact_type: string;
  content: string;
  created_at: string;
  shared_at: string | null;
}

export function PortalDocuments({ buyerId }: PortalDocumentsProps) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["portal-documents", buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("id, title, artifact_type, content, created_at, shared_at")
        .eq("buyer_id", buyerId)
        .eq("visibility", "shared")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SharedArtifact[];
    },
  });

  const getDocumentIcon = (type: string) => {
    return <FileText className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Your Documents</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Your Documents</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No documents yet</p>
            <p className="text-muted-foreground text-sm">
              Documents shared by your agent will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Documents</h1>
        <Badge variant="secondary">{documents.length} documents</Badge>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                {getDocumentIcon(doc.artifact_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {doc.artifact_type}
                  </Badge>
                  <span>•</span>
                  <span>
                    {format(new Date(doc.shared_at || doc.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
