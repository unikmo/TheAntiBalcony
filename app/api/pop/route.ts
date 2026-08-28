import { submitPop, PopError } from "@/lib/pop-requests";
import { popJson, popErrorResponse } from "@/lib/pop-http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await popJson(request);
    if (body.website) throw new PopError("Submission could not be accepted.", 400);
    const result = await submitPop(body);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return popErrorResponse(error); }
}
