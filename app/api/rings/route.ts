import { NextResponse } from "next/server";
import { createRing, listRings, type CreateRingInput } from "@/lib/rings";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ rings: await listRings(50) });
  } catch {
    return NextResponse.json({ rings: [], degraded: true }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateRingInput>;
    const result = await createRing({
      startupName: body.startupName || "",
      website: body.website,
      tagline: body.tagline,
      category: body.category,
      whatItDoes: body.whatItDoes,
      intendedCustomer: body.intendedCustomer,
      founder: body.founder,
      problem: body.problem,
      story: body.story,
      imageUrl: body.imageUrl,
      socialUrl: body.socialUrl,
    });
    return NextResponse.json(result, { status: result.persisted ? 201 : 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create this Ring.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
