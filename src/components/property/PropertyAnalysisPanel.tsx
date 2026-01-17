import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnalysisStatus = "idle" | "generating" | "fetching-comps" | "complete" | "error";

interface PropertyAnalysisPanelProps {
  analysis: string | null;
  isGenerating: boolean;
  isFetchingComps?: boolean;
  error: string | null;
  onGenerate: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export function PropertyAnalysisPanel({
  analysis,
  isGenerating,
  isFetchingComps = false,
  error,
  onGenerate,
  onRegenerate,
  className,
}: PropertyAnalysisPanelProps) {
  const getStatus = (): AnalysisStatus => {
    if (error) return "error";
    if (isFetchingComps) return "fetching-comps";
    if (isGenerating) return "generating";
    if (analysis) return "complete";
    return "idle";
  };

  const status = getStatus();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Property Analysis
          {status === "complete" && (
            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Idle State - Not yet generated */}
        {status === "idle" && (
          <div className="p-6 bg-muted/50 rounded-lg text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              AI analysis not yet generated for this property.
            </p>
            <Button onClick={onGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate AI Analysis
            </Button>
          </div>
        )}

        {/* Fetching Comparables State */}
        {status === "fetching-comps" && (
          <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Fetching comparable properties...
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Searching for recently sold homes in the area.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generating State */}
        {status === "generating" && (
          <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Analyzing property...
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Generating comprehensive market analysis. This may take 30-60 seconds.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <LoadingStep label="Evaluating market position" />
              <LoadingStep label="Comparing to recent sales" />
              <LoadingStep label="Analyzing buyer fit" />
              <LoadingStep label="Generating recommendations" />
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="p-6 bg-destructive/10 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Analysis generation failed</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerate}
                  className="mt-3 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Complete State - Show Analysis */}
        {status === "complete" && analysis && (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-6 mb-3 first:mt-0 border-b pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-medium mt-4 mb-2">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-1 my-3">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-muted-foreground">{children}</li>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-muted-foreground my-2">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-border">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-sm text-foreground whitespace-nowrap">
                      {children}
                    </td>
                  ),
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>

            {onRegenerate && (
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Analysis
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
      {label}
    </div>
  );
}
