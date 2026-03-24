import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, Workflow } from "@/types";
import { listWorkflows } from "@/lib/orchestrator";

// GET /api/workflows
export async function GET() {
  const workflows = listWorkflows();
  // Sort most recent first
  const sorted = [...workflows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({
    success: true,
    data: { items: sorted, total: sorted.length },
  } satisfies ApiResponse<{ items: Workflow[]; total: number }>);
}
