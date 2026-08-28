import { NextResponse } from "next/server";
import { createMomentOrder } from "@/lib/orders";
import type { DisplayWindowCode, MomentTier } from "@/lib/providers/blindspot";

export const runtime = "nodejs";

const WINDOWS: DisplayWindowCode[] = ["08-12", "12-16", "16-20", "20-24"];
const TIERS: MomentTier[] = ["snapshot", "video", "takeover"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName?: string;
      email?: string;
      occasion?: string;
      tier?: MomentTier;
      eventDate?: string;
      preferredWindow?: DisplayWindowCode;
      backupWindow?: DisplayWindowCode | "" | null;
      anyTimeSameDay?: boolean;
      creativeMessage?: string;
      legalAccepted?: boolean;
      board?: "times_square_flexible" | "nasdaq_tower";
    };

    if (!body.tier || !TIERS.includes(body.tier)) {
      return NextResponse.json({ error: "Choose a valid package." }, { status: 400 });
    }
    if (!body.preferredWindow || !WINDOWS.includes(body.preferredWindow)) {
      return NextResponse.json({ error: "Choose a valid four-hour window." }, { status: 400 });
    }
    const backupWindow = body.backupWindow && WINDOWS.includes(body.backupWindow as DisplayWindowCode)
      ? body.backupWindow as DisplayWindowCode
      : null;

    const result = await createMomentOrder({
      customerName: body.customerName || "",
      email: body.email || "",
      occasion: body.occasion || "",
      tier: body.tier,
      eventDate: body.eventDate || "",
      preferredWindow: body.preferredWindow,
      backupWindow,
      anyTimeSameDay: body.anyTimeSameDay !== false,
      creativeMessage: body.creativeMessage || null,
      legalAccepted: Boolean(body.legalAccepted),
      board: body.board === "nasdaq_tower" ? "nasdaq_tower" : "times_square_flexible",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create this booking." },
      { status: 400 },
    );
  }
}
