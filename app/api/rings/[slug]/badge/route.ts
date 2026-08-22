import { getRingBySlug } from "@/lib/rings";

export const runtime = "nodejs";

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  }[char] || char));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ring = await getRingBySlug(slug);
  if (!ring) return new Response("Not found", { status: 404 });

  const name = escapeXml(ring.startupName.toUpperCase());
  const date = new Date(ring.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="220" viewBox="0 0 860 220" role="img" aria-label="${name} rung in on The Anti-Balcony">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#173e6b"/><stop offset="1" stop-color="#07182e"/></linearGradient>
    <radialGradient id="bell" cx="34%" cy="24%" r="72%"><stop stop-color="#ff737b"/><stop offset=".28" stop-color="#e53943"/><stop offset=".72" stop-color="#a91220"/><stop offset="1" stop-color="#690914"/></radialGradient>
  </defs>
  <rect width="860" height="220" rx="28" fill="url(#bg)"/>
  <rect x="1" y="1" width="858" height="218" rx="27" fill="none" stroke="#31577f"/>
  <circle cx="110" cy="110" r="67" fill="url(#bell)"/>
  <circle cx="110" cy="110" r="52" fill="none" stroke="#ffffff" stroke-opacity=".18"/>
  <text x="110" y="116" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="800" letter-spacing="2">RING</text>
  <text x="205" y="52" fill="#8db7e3" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="2.8">RUNG IN ON THE ANTI-BALCONY</text>
  <text x="205" y="112" fill="#f5f8fc" font-family="Arial,sans-serif" font-size="40" font-weight="800" letter-spacing="-1">${name}</text>
  <text x="205" y="158" fill="#b8c7da" font-family="Arial,sans-serif" font-size="15" font-weight="600" letter-spacing="1.4">PUBLIC STARTUP LAUNCH · ${date}</text>
  <text x="205" y="190" fill="#d6ad57" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2">STEP OUT. RING IN YOUR STARTUP.</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
