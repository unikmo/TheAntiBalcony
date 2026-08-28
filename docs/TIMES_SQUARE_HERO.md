# Times Square-led hero

## Direction

The aspiration is appearing in Times Square. The headline remains **Celebrate it. Show it. Keep it.**, with italic Keep it, per the user's final direction. The occasion carousel carries the Times Square aspiration visually.
The hero and header do not mention UNIKMO. The brand relationship and physical keepsake remain below the hero and in the footer/About content.
The primary CTA targets `/launch?offer=nasdaq`. NASDAQ leads the package collection; the existing prices and request-only capture/availability conditions are unchanged.

## In-image invitation

Each scene has server-rendered HTML copy, not text embedded in the image. The visitor sees their occasion, a short personal headline and an invitation to imagine the outcome. This is a creative hypothesis, not a measured conversion claim.

| Occasion | Headline | Invitation |
| --- | --- | --- |
| Launches & milestones | Your hard work. Up in lights. | Picture your team in Times Square. |
| Weddings & anniversaries | Your love. Larger than life. | Imagine their face when they look up. |
| Graduations & achievements | You earned this. Let it show. | A bigger stage for your next chapter. |

Warm-white copy sits at the lower left over a dark gradient, leaving the tower and portraits as the main image. Smaller type and insets on mobile. Desktop image height is capped at 58% of the small viewport height (640px maximum) so the invitation is visible sooner on shorter laptop screens. No added purchase button, card language or specification copy inside the image.

## Assets

Three original AI-generated illustrative images, not actual booked placements or examples of licensed camera delivery:

- `public/pop-times-square-launch.webp`: team launch, coral screen, blue hour.
- `public/pop-times-square-together.webp`: couple’s milestone, champagne screen, early evening.
- `public/pop-times-square-graduation.webp`: graduation, teal screen, daylight.

All are 1536×1024 optimized WebP derivatives. Built-in image generation was used, three independent calls, no regeneration. The original Nasdaq photograph was inspected for architecture only and is not shipped.
The exact generation prompts are retained in `docs/TIMES_SQUARE_HERO_PROMPTS.md`.
Visible caption: **Illustrative scenes**. Do not present these images as completed customer evidence, a guarantee of camera framing, or an operator endorsement.

## Carousel and discovery

- First image server-rendered and prioritized; the remaining images load lazily.
- Rotation every 4 seconds with a 350ms crossfade, only while visible/in view, unless paused. Timing is shared in `POP_HERO_INTERVAL_MS` and covered by the contract check.
- Pointer hover pauses temporarily. Keyboard focus and manual selection stop rotation until Play is selected.
- Previous/next, scene selectors, Home/End/arrow keys and touch swipes.
- Automatic rotation disabled for reduced-motion preferences.
- Metadata and shared JSON-LD/FAQ description lead with Times Square while retaining truthful UNIKMO/AntiBalcony relationships and confirmation conditions.
- Preview noindex and private-memory search exclusions remain unchanged.

## Checks

`npm run build`, `npm run lint`, `npm run test:discovery`, `npm run test:pop`, `npm run test:smoke` and `npm run test:contracts`.
The browser suite includes carousel selection, keyboard controls, reduced motion and responsive cases. Do not claim it ran without a recorded successful result.
