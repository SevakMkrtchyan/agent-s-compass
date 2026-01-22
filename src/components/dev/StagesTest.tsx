import { useStages, useStage } from "@/hooks/useStages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function StagesTest() {
  const { data: allStages, isLoading: loadingAll, error: errorAll } = useStages();
  const { data: stage0, isLoading: loading0, error: error0 } = useStage(0);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Stages Database Test</h1>
      
      {/* Test useStage(0) - Single stage fetch */}
      <Card>
        <CardHeader>
          <CardTitle>useStage(0) Result</CardTitle>
        </CardHeader>
        <CardContent>
          {loading0 && <Loader2 className="animate-spin" />}
          {error0 && <p className="text-destructive">Error: {error0.message}</p>}
          {stage0 && (
            <div className="space-y-2">
              <p><strong>Icon:</strong> {stage0.icon}</p>
              <p><strong>Name:</strong> {stage0.stage_name}</p>
              <p><strong>Number:</strong> {stage0.stage_number}</p>
              <p><strong>Objective:</strong> {stage0.stage_objective}</p>
              <p><strong>Next Actions:</strong> {JSON.stringify(stage0.next_actions)}</p>
              <p><strong>Artifacts:</strong> {JSON.stringify(stage0.artifacts)}</p>
              <p><strong>Completion Criteria:</strong> {JSON.stringify(stage0.completion_criteria)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test useStages() - All stages fetch */}
      <Card>
        <CardHeader>
          <CardTitle>useStages() Result ({allStages?.length || 0} stages)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAll && <Loader2 className="animate-spin" />}
          {errorAll && <p className="text-destructive">Error: {errorAll.message}</p>}
          {allStages && (
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(allStages, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
