import { GalleryView } from "@/components/gallery/GalleryView";
export default function GalleryPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Gallery</h1>
        <p className="text-sm text-muted-foreground">All generated outputs — images, videos, text, and code</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6"><GalleryView /></div>
    </div>
  );
}
