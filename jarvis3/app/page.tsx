import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function HomePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold">Command Center</h1>
          <p className="text-sm text-muted-foreground">Generate text, images, video, and code with local AI</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense><ChatInterface /></Suspense>
      </div>
    </div>
  );
}
