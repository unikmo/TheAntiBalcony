import { NextResponse } from "next/server";
import { listRings } from "@/lib/rings";

// Preserve the historical archive; all new moments use consented POP intake.
export async function GET() {
  try { return NextResponse.json({ rings: await listRings() }); }
  catch { return NextResponse.json({ error: "Archive unavailable." }, { status: 503 }); }
}
export async function POST() {
  return NextResponse.json({ error: "Ring creation is retired. Please use the POP request form.", next: "/launch" }, { status: 410 });
}
