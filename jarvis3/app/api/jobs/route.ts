import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, PaginatedResponse, Job, JobStatus, TaskType } from "@/types";
import { listJobs } from "@/lib/jobs/store";
import { orchestrate } from "@/lib/orchestrator";

// GET /api/jobs — list jobs with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as JobStatus | null;
  const taskType = searchParams.get("taskType") as TaskType | null;
  const workflowId = searchParams.get("workflowId");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const { items, total } = listJobs({
    status: status ?? undefined,
    taskType: taskType ?? undefined,
    workflowId: workflowId ?? undefined,
    limit,
    offset,
  });

  const response: ApiResponse<PaginatedResponse<Job>> = {
    success: true,
    data: { items, total, page: Math.floor(offset / limit), pageSize: limit },
  };

  return NextResponse.json(response);
}

// POST /api/jobs — create and enqueue a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      prompt: string;
      taskType?: TaskType;
      options?: Record<string, unknown>;
    };

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "prompt is required" },
        { status: 400 }
      );
    }

    const result = await orchestrate(body.prompt, {
      taskType: body.taskType,
      extraOptions: body.options,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/jobs]", err);
    return NextResponse.json(
      { success: false, error } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
