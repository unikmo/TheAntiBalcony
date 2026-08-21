import { NextResponse } from "next/server";
import { createRing, listRings } from "@/lib/rings";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ rings: await listRings(12) });
  } catch {
    return NextResponse.json({ rings: [], degraded: true }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { startupName?: string; website?: string; tagline?: string };
    const result = await createRing({
      startupName: body.startupName || "",
      website: body.website,
      tagline: body.tagline,
    });
    return NextResponse.json(result, { status: result.persisted ? 201 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not claim this ring.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
