import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Send, X, Eye, FileText } from "lucide-react";
import type { Artifact } from "@/hooks/useArtifacts";

// Simple markdown renderer for preview
function renderMarkdownContent(text: string) {
  const lines = text.split("\n");
  
  return lines.map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="font-semibold text-foreground mt-3 mb-1.5 first:mt-0">
          {parseInlineMarkdown(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      return (
        <h2 key={i} className="font-bold text-lg text-foreground mt-4 mb-2 first:mt-0">
          {parseInlineMarkdown(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="ml-4 text-foreground/90">
          {parseInlineMarkdown(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, "");
      return (
        <li key={i} className="ml-4 text-foreground/90 list-decimal">
          {parseInlineMarkdown(content)}
        </li>
      );
    } else if (line.trim() === "") {
      return <br key={i} />;
    } else {
      return (
        <p key={i} className="text-foreground/90">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  });
}

function parseInlineMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(
        <strong key={keyCounter++} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    parts.push(remaining);
    break;
  }

  return parts;
}

interface ArtifactPreviewModeProps {
  artifact: Artifact;
  buyerVersion: string;
  buyerName: string;
  onBack: () => void;
  onSend: (content: string) => Promise<void>;
  onCancel: () => void;
  isSending: boolean;
}

export function ArtifactPreviewMode({
  artifact,
  buyerVersion,
  buyerName,
  onBack,
  onSend,
  onCancel,
  isSending,
}: ArtifactPreviewModeProps) {
  const [editedContent, setEditedContent] = useState(buyerVersion);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("buyer");

  const handleSend = async () => {
    await onSend(editedContent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 pb-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Preview Buyer Version</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Review and edit what <span className="font-medium">{buyerName}</span> will see before sharing
        </p>
      </div>

      {/* Content Area with Tabs */}
      <div className="flex-1 min-h-0 mt-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 w-full grid grid-cols-2">
            <TabsTrigger value="buyer" className="gap-2">
              <Eye className="h-4 w-4" />
              Buyer Version
            </TabsTrigger>
            <TabsTrigger value="full" className="gap-2">
              <FileText className="h-4 w-4" />
              Full Artifact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer" className="flex-1 min-h-0 mt-4 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default" className="gap-1">
                  <Eye className="h-3 w-3" />
                  What {buyerName} will see
                </Badge>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-full min-h-[300px] font-mono text-sm resize-none border-0 bg-transparent focus-visible:ring-0"
                    placeholder="Edit the buyer version..."
                  />
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed space-y-1">
                    {renderMarkdownContent(editedContent)}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="flex justify-end gap-2 mt-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedContent(buyerVersion);
                      setIsEditing(false);
                    }}
                  >
                    Cancel Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Done Editing
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="full" className="flex-1 min-h-0 mt-4 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="mb-2">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Original (internal only)
                </Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed space-y-1 opacity-80">
                  {renderMarkdownContent(artifact.content)}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t flex-shrink-0 mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
          disabled={isSending}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to View
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSending}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isSending || isEditing}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Sending..." : `Send to ${buyerName}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
