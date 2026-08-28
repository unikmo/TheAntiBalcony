import { NextResponse } from "next/server";
import { createOperationsUpload } from "@/lib/media-storage";
import { authorizedByEnvironmentSecret } from "@/lib/tokens";

export const runtime = "nodejs";

const KINDS = ["capture", "deliverable_video", "deliverable_image"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorizedByEnvironmentSecret(request, "OPS_API_SECRET") && !authorizedByEnvironmentSecret(request, "FULFILLMENT_CALLBACK_SECRET")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json() as { kind?: string; filename?: string; contentType?: string; size?: number };
    if (!KINDS.includes(body.kind as (typeof KINDS)[number])) return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
    const upload = await createOperationsUpload({
      orderId: id,
      kind: body.kind as (typeof KINDS)[number],
      filename: body.filename || "asset",
      contentType: body.contentType || "",
      size: Number(body.size || 0),
    });
    return NextResponse.json({ upload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare upload." }, { status: 400 });
  }
}
