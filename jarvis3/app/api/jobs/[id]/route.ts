import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, Job } from "@/types";
import { getJob, setJobCanceled, deleteJob } from "@/lib/jobs/store";

// GET /api/jobs/[id] — get a single job
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = getJob(params.id);
  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" } satisfies ApiResponse<never>,
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: job } satisfies ApiResponse<Job>);
}

// PATCH /api/jobs/[id] — update job (currently only supports cancellation)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json() as { action?: string };

  if (body.action === "cancel") {
    const job = getJob(params.id);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }
    if (job.status !== "queued" && job.status !== "running") {
      return NextResponse.json(
        { success: false, error: `Cannot cancel job with status: ${job.status}` } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }
    const updated = setJobCanceled(params.id);
    return NextResponse.json({ success: true, data: updated } satisfies ApiResponse<Job | null>);
  }

  return NextResponse.json(
    { success: false, error: "Unknown action" } satisfies ApiResponse<never>,
    { status: 400 }
  );
}

// DELETE /api/jobs/[id] — delete a job record
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = deleteJob(params.id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Job not found" } satisfies ApiResponse<never>,
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true } satisfies ApiResponse<never>);
}
