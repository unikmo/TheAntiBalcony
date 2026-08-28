import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"]);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Creative storage is not configured." }, { status: 503 });

  try {
    const body = (await request.json()) as {
      orderId?: string;
      accessToken?: string;
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
      width?: number;
      height?: number;
      durationSeconds?: number | null;
    };
    if (!body.orderId || !body.accessToken || !body.filename || !body.contentType) {
      return NextResponse.json({ error: "Creative upload details are incomplete." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(body.contentType)) return NextResponse.json({ error: "Use JPG, PNG, WEBP, MP4, MOV or WEBM." }, { status: 400 });
    if (!body.sizeBytes || body.sizeBytes <= 0 || body.sizeBytes > 250 * 1024 * 1024) return NextResponse.json({ error: "Creative must be under 250 MB." }, { status: 400 });
    if (!body.width || !body.height || body.height <= body.width || Math.abs(body.width / body.height - 9 / 16) > 0.015) {
      return NextResponse.json({ error: "Creative must be vertical 9:16." }, { status: 400 });
    }
    if (body.contentType.startsWith("video/") && (body.durationSeconds == null || body.durationSeconds < 14.5 || body.durationSeconds > 15.5)) {
      return NextResponse.json({ error: "Video creative must be 15 seconds." }, { status: 400 });
    }

    const { data: order, error: loadError } = await db.from("anti_balcony_orders").select("id, access_token_hash").eq("id", body.orderId).maybeSingle();
    if (loadError || !order || order.access_token_hash !== sha256(body.accessToken)) return NextResponse.json({ error: "Unauthorized booking token." }, { status: 401 });

    const ext = body.filename.split(".").pop()?.toLowerCase()?.replace(/[^a-z0-9]/g, "") || "bin";
    const path = `orders/${body.orderId}/creative-${Date.now()}.${ext}`;
    const { data, error } = await db.storage.from("anti-balcony-creative").createSignedUploadUrl(path);
    if (error || !data?.signedUrl) throw new Error(error?.message || "Could not create upload URL.");

    const { error: updateError } = await db.from("anti_balcony_orders").update({
      creative_path: path,
      creative_filename: body.filename.slice(0, 180),
      creative_content_type: body.contentType,
      creative_size_bytes: Math.round(body.sizeBytes),
      creative_width: Math.round(body.width),
      creative_height: Math.round(body.height),
      creative_duration_seconds: body.contentType.startsWith("video/") ? body.durationSeconds : null,
      updated_at: new Date().toISOString(),
    }).eq("id", body.orderId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ signedUrl: data.signedUrl, path });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare creative upload." }, { status: 400 });
  }
}
