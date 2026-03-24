import { SettingsForm } from "@/components/settings/SettingsForm";
export default function SettingsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure local providers and feature toggles</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6"><SettingsForm /></div>
    </div>
  );
}
