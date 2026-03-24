import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, JarvisConfig } from "@/types";
import { readConfig, updateConfig } from "@/lib/config";

export async function GET() {
  const config = readConfig();
  const safeConfig = { ...config, premium: { ...config.premium, openaiApiKey: config.premium.openaiApiKey ? "***" : "", stabilityApiKey: config.premium.stabilityApiKey ? "***" : "", replicateApiKey: config.premium.replicateApiKey ? "***" : "" } };
  return NextResponse.json({ success: true, data: safeConfig } satisfies ApiResponse<typeof safeConfig>);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as Partial<JarvisConfig>;
    if (body.premium) {
      const current = readConfig();
      if (body.premium.openaiApiKey === "***") body.premium.openaiApiKey = current.premium.openaiApiKey;
      if (body.premium.stabilityApiKey === "***") body.premium.stabilityApiKey = current.premium.stabilityApiKey;
      if (body.premium.replicateApiKey === "***") body.premium.replicateApiKey = current.premium.replicateApiKey;
    }
    const updated = updateConfig(body);
    const safeConfig = { ...updated, premium: { ...updated.premium, openaiApiKey: updated.premium.openaiApiKey ? "***" : "", stabilityApiKey: updated.premium.stabilityApiKey ? "***" : "", replicateApiKey: updated.premium.replicateApiKey ? "***" : "" } };
    return NextResponse.json({ success: true, data: safeConfig } satisfies ApiResponse<typeof safeConfig>);
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Failed to update config" } satisfies ApiResponse<never>, { status: 500 });
  }
}
