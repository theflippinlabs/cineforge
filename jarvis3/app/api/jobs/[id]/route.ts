import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, Job } from "@/types";
import { getJob, setJobCanceled, deleteJob } from "@/lib/jobs/store";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) return NextResponse.json({ success: false, error: "Job not found" } satisfies ApiResponse<never>, { status: 404 });
  return NextResponse.json({ success: true, data: job } satisfies ApiResponse<Job>);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json() as { action?: string };
  if (body.action === "cancel") {
    const job = getJob(params.id);
    if (!job) return NextResponse.json({ success: false, error: "Job not found" } satisfies ApiResponse<never>, { status: 404 });
    if (job.status !== "queued" && job.status !== "running") return NextResponse.json({ success: false, error: `Cannot cancel job with status: ${job.status}` } satisfies ApiResponse<never>, { status: 400 });
    return NextResponse.json({ success: true, data: setJobCanceled(params.id) } satisfies ApiResponse<Job | null>);
  }
  return NextResponse.json({ success: false, error: "Unknown action" } satisfies ApiResponse<never>, { status: 400 });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!deleteJob(params.id)) return NextResponse.json({ success: false, error: "Job not found" } satisfies ApiResponse<never>, { status: 404 });
  return NextResponse.json({ success: true } satisfies ApiResponse<never>);
}
