import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, Workflow } from "@/types";
import { getWorkflow } from "@/lib/orchestrator";

// GET /api/workflows/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const workflow = getWorkflow(params.id);
  if (!workflow) {
    return NextResponse.json(
      { success: false, error: "Workflow not found" } satisfies ApiResponse<never>,
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: workflow } satisfies ApiResponse<Workflow>);
}
