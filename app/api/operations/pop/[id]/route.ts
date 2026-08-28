import { authorizedByEnvironmentSecret } from "@/lib/tokens";
import { listPopCards, reviewPop } from "@/lib/pop-requests";
import { popJson, popErrorResponse } from "@/lib/pop-http";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorizedByEnvironmentSecret(request, "OPS_API_SECRET")) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { id } = await params;
    const row = await reviewPop(id, await popJson(request));
    return Response.json({ request: row, cards: row.status === "ready" ? await listPopCards(id) : [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return popErrorResponse(error); }
}
