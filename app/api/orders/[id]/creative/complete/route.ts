import { NextResponse } from "next/server";
import { completeCreativeUpload } from "@/lib/orders";
import { bearerToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await completeCreativeUpload(id, bearerToken(request));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not finalize creative upload.";
    const status = /Unauthorized/i.test(message) ? 401 : /not configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
