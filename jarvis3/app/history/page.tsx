import { HistoryView } from "@/components/history/HistoryView";

export default function HistoryPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Job History</h1>
        <p className="text-sm text-muted-foreground">
          All past and current generation jobs
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <HistoryView />
      </div>
    </div>
  );
}
