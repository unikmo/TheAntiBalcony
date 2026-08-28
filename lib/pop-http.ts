import { PopError } from "@/lib/pop-requests";
export async function popJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new PopError("Send JSON, not a video upload.", 415);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) throw new PopError("Cross-site submissions are not allowed.", 403);
  // Enforce size while reading, even if the caller omits or forges Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new PopError("Request body required.", 400);
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 12000) { await reader.cancel(); throw new PopError("Use a video link, not an uploaded file.", 413); }
    chunks.push(value);
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new PopError("Invalid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new PopError("Invalid request.", 400);
  return body as Record<string, unknown>;
}
export function popErrorResponse(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : "Request failed." }, { status: error instanceof PopError ? error.status : 400, headers: { "Cache-Control": "no-store" } });
}
