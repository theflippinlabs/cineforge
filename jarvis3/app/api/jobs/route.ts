import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, PaginatedResponse, Job, JobStatus, TaskType } from "@/types";
import { listJobs } from "@/lib/jobs/store";
import { orchestrate } from "@/lib/orchestrator";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as JobStatus | null;
  const taskType = searchParams.get("taskType") as TaskType | null;
  const workflowId = searchParams.get("workflowId");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const { items, total } = listJobs({ status: status ?? undefined, taskType: taskType ?? undefined, workflowId: workflowId ?? undefined, limit, offset });
  return NextResponse.json({ success: true, data: { items, total, page: Math.floor(offset / limit), pageSize: limit } } satisfies ApiResponse<PaginatedResponse<Job>>);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { prompt: string; taskType?: TaskType; options?: Record<string, unknown> };
    if (!body.prompt || typeof body.prompt !== "string") return NextResponse.json({ success: false, error: "prompt is required" }, { status: 400 });
    const result = await orchestrate(body.prompt, { taskType: body.taskType, extraOptions: body.options });
    return NextResponse.json({ success: true, data: result } satisfies ApiResponse<typeof result>, { status: 201 });
  } catch (err) {
    console.error("[POST /api/jobs]", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Internal server error" } satisfies ApiResponse<never>, { status: 500 });
  }
}
