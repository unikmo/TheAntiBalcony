import { absoluteUrl, IS_PREVIEW, POP_FAQS, SITE_DESCRIPTION } from "@/lib/discovery";

// Optional, experimental text index. Not an indexing protocol or ranking signal.
export function GET() {
  const text = `# The Pop Moment by UNIKMO

> ${SITE_DESCRIPTION}

Celebrate it. Show it. Keep it.

## Public sources
- [Experience and current prices](${absoluteUrl("/")}): Free POP; Keep it; Go public — NASDAQ request.
- [About](${absoluteUrl("/about")}): Brand, audience, scope and relationship to AntiBalcony and UNIKMO.
- [Capture guide](${absoluteUrl("/capture-guide")}): How to film anticipation, the POP and reactions.
- [Launch guides](${absoluteUrl("/guides")}): Retained startup-launch resources, not current Ring or takeover offers.
- [Imprint](${absoluteUrl("/imprint")}): Operator and contact information.

## Questions and answers
${POP_FAQS.map(({ question, answer }) => `### ${question}\n${answer}`).join("\n\n")}

## Boundaries
Generic billboard and takeover packages are retired. No confirmed capture-provider partnership is claimed. Private requests, card tokens and customer films are intentionally absent from this index. This file is an optional summary of public pages, not a guarantee of inclusion in AI answers.
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600", ...(IS_PREVIEW ? { "X-Robots-Tag": "noindex, nofollow" } : {}) } });
}
