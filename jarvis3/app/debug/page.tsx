import { DebugPanel } from "@/components/debug/DebugPanel";

export default function DebugPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Debug Panel</h1>
        <p className="text-sm text-muted-foreground">
          Provider health, endpoint tests, and system diagnostics
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <DebugPanel />
      </div>
    </div>
  );
}
