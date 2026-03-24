import { WorkflowsView } from "@/components/workflows/WorkflowsView";
export default function WorkflowsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Workflows</h1>
        <p className="text-sm text-muted-foreground">Multi-step chained AI pipelines</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6"><WorkflowsView /></div>
    </div>
  );
}
