import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { getAllProvidersHealth } from "@/lib/providers";

export async function GET() {
  try {
    const health = await getAllProvidersHealth();
    return NextResponse.json({ success: true, data: health } satisfies ApiResponse<typeof health>);
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Health check failed" } satisfies ApiResponse<never>, { status: 500 });
  }
}
