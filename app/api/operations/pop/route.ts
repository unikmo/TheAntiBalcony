import { authorizedByEnvironmentSecret } from "@/lib/tokens";
import { listPopOperations } from "@/lib/pop-requests";
import { popErrorResponse } from "@/lib/pop-http";
export async function GET(request: Request) {
  if (!authorizedByEnvironmentSecret(request, "OPS_API_SECRET")) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try { return Response.json({ requests: await listPopOperations() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return popErrorResponse(error); }
}
