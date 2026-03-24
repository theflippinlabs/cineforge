import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(startStr: string, endStr?: string): string {
  const start = new Date(startStr).getTime();
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "\u2026";
}

export function taskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "Text",
    image: "Image",
    video: "Video",
    code: "Code",
    workflow: "Workflow",
  };
  return labels[type] ?? type;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: "text-yellow-400",
    running: "text-blue-400",
    completed: "text-green-400",
    failed: "text-red-400",
    canceled: "text-gray-400",
    available: "text-green-400",
    unavailable: "text-red-400",
    unchecked: "text-yellow-400",
    error: "text-red-400",
  };
  return colors[status] ?? "text-muted-foreground";
}

export function statusBg(status: string): string {
  const colors: Record<string, string> = {
    queued: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    running: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    completed: "bg-green-400/10 text-green-400 border-green-400/20",
    failed: "bg-red-400/10 text-red-400 border-red-400/20",
    canceled: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    available: "bg-green-400/10 text-green-400 border-green-400/20",
    unavailable: "bg-red-400/10 text-red-400 border-red-400/20",
    unchecked: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    pending: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  };
  return colors[status] ?? "bg-muted text-muted-foreground border-border";
}
