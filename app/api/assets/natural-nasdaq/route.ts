import chunk0 from "@/lib/natural-nasdaq/chunk0";
import chunk1 from "@/lib/natural-nasdaq/chunk1";
import chunk2 from "@/lib/natural-nasdaq/chunk2";
import chunk3 from "@/lib/natural-nasdaq/chunk3";

const hero = Buffer.from(chunk0 + chunk1 + chunk2 + chunk3, "base64");

export const dynamic = "force-static";

export function GET() {
  return new Response(new Uint8Array(hero), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
