import { NextResponse } from "next/server";
import { getCustomerOrder } from "@/lib/orders";
import { bearerToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ order: await getCustomerOrder(id, bearerToken(request)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load order.";
    const status = /Unauthorized/i.test(message) ? 401 : /not found/i.test(message) ? 404 : /not configured/i.test(message) ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
