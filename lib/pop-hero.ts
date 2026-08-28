export const POP_HERO_INTERVAL_MS = 4000;

export const POP_HERO_SLIDES = [
  {
    src: "/pop-times-square-launch.webp",
    label: "Your launch",
    occasion: "Launches & milestones",
    headline: ["Your hard work.", "Up in lights."],
    invitation: "Picture your team in Times Square.",
    alt: "Illustrative Times Square scene with a celebrating team on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-together.webp",
    label: "Your love",
    occasion: "Weddings & anniversaries",
    headline: ["Your love.", "Larger than life."],
    invitation: "Imagine their face when they look up.",
    alt: "Illustrative Times Square scene with a couple’s portrait on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-graduation.webp",
    label: "Your next chapter",
    occasion: "Graduations & achievements",
    headline: ["You earned this.", "Let it show."],
    invitation: "A bigger stage for your next chapter.",
    alt: "Illustrative Times Square scene with a graduate’s portrait on the curved NASDAQ Tower screen",
  },
] as const;

export function heroSlideIndex(index: number) {
  return ((index % POP_HERO_SLIDES.length) + POP_HERO_SLIDES.length) % POP_HERO_SLIDES.length;
}
