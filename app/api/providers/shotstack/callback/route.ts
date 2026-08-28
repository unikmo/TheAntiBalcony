import { NextResponse } from "next/server";
import { completeShotstackPackaging } from "@/lib/orders";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") || "";
  const token = url.searchParams.get("token") || "";
  if (!orderId || !token) return NextResponse.json({ error: "Missing callback capability." }, { status: 401 });
  try {
    const result = await completeShotstackPackaging(orderId, token);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Shotstack callback failed." }, { status: 400 });
  }
}
