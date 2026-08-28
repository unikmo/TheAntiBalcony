# Times Square-led hero

## Direction

The aspiration is appearing in Times Square. The headline remains **Celebrate it. Show it. Keep it.**, with italic Keep it, per the user's final direction. The occasion carousel carries the Times Square aspiration visually.
The hero and header do not mention UNIKMO. The brand relationship and physical keepsake remain below the hero and in the footer/About content.
The primary CTA targets `/launch?offer=nasdaq`. NASDAQ leads the package collection; the existing prices and request-only capture/availability conditions are unchanged.

## In-image invitation

Each scene has server-rendered HTML copy, not text embedded in the image. The visitor sees their occasion, a short personal headline and an invitation to imagine the outcome. This is a creative hypothesis, not a measured conversion claim.

| Occasion | Headline | Invitation |
| --- | --- | --- |
| Wedding | Your forever. Up in lights. | Your favourite day. For the city to see. |
| Proposal | One question. A whole new chapter. | Imagine asking with all of Times Square watching. |
| Birthday | Their day. In a bigger way. | Put someone you love in the spotlight. |
| Baby shower | Your little beginning. A big welcome. | A new chapter worth celebrating. |
| I love you | Three little words. One giant gesture. | Say it where they’ll never forget it. |
| Our memories | Your favourite people. Your favourite moments. | Bring a memory back, bigger than ever. |
| Anniversary | Still you. Always you. | Celebrate the years. And everything ahead. |
| Graduation | You earned this. Let it show. | A bigger stage for your next chapter. |
| Launch | Your hard work. Up in lights. | Picture your team in Times Square. |
| Team win | We did it. Let the city know. | Give everyone who made it happen their moment. |

Warm-white copy sits at the lower left over a dark gradient, leaving the tower and portraits as the main image. Smaller type and insets on mobile. Desktop image height is capped at 58% of the small viewport height (640px maximum) so the invitation is visible sooner on shorter laptop screens. No added purchase button, card language or specification copy inside the image.

## Assets

Ten original AI-generated illustrative images, not actual booked placements or examples of licensed camera delivery:

- `public/pop-times-square-launch.webp`: team launch, coral screen, blue hour.
- `public/pop-times-square-together.webp`: couple’s milestone, champagne screen, early evening.
- `public/pop-times-square-graduation.webp`: graduation, teal screen, daylight.
- `public/pop-times-square-wedding.webp`: newlyweds on the tower.
- `public/pop-times-square-proposal.webp`: a marriage proposal on the tower.
- `public/pop-times-square-birthday.webp`: a birthday portrait and cake.
- `public/pop-times-square-baby-shower.webp`: expectant parents and balloons.
- `public/pop-times-square-memories.webp`: friends sharing a happy memory.
- `public/pop-times-square-anniversary.webp`: an older couple celebrating their years together.
- `public/pop-times-square-team-win.webp`: a sports team sharing a trophy win.

All are 1536×1024 optimized WebP derivatives. Built-in image generation was used, ten independent calls across two batches, no regeneration. The original Nasdaq photograph was inspected for architecture only and is not shipped.
The exact generation prompts are retained in `docs/TIMES_SQUARE_HERO_PROMPTS.md` (original three) and `docs/TIMES_SQUARE_OCCASIONS_PROMPTS.md` (seven additions).
Visible caption: **Illustrative scenes**. Do not present these images as completed customer evidence, a guarantee of camera framing, or an operator endorsement.

## Carousel and discovery

- First image server-rendered and prioritized; the remaining images load lazily.
- Rotation every 4 seconds with a 350ms crossfade, only while visible/in view, unless paused. Timing is shared in `POP_HERO_INTERVAL_MS` and covered by the contract check.
- Pointer hover pauses temporarily. Keyboard focus and manual selection stop rotation until Play is selected.
- Previous/next, a named ten-occasion picker, Home/End/arrow keys and touch swipes. The native picker retains its own keyboard behavior. Picking an occasion pauses autoplay, so no one has to wait through the full 40-second cycle to find their occasion.
- Automatic rotation disabled for reduced-motion preferences.
- Metadata and shared JSON-LD/FAQ description lead with Times Square while retaining truthful UNIKMO/AntiBalcony relationships and confirmation conditions.
- Preview noindex and private-memory search exclusions remain unchanged.

## Checks

`npm run build`, `npm run lint`, `npm run test:discovery`, `npm run test:pop`, `npm run test:smoke` and `npm run test:contracts`.
The browser suite includes carousel selection, keyboard controls, reduced motion and responsive cases. Do not claim it ran without a recorded successful result.
