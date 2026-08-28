export const POP_HERO_SLIDES = [
  {
    src: "/pop-times-square-launch.webp",
    label: "Your launch",
    alt: "Illustrative Times Square scene with a celebrating team on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-together.webp",
    label: "Your love",
    alt: "Illustrative Times Square scene with a couple’s portrait on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-graduation.webp",
    label: "Your next chapter",
    alt: "Illustrative Times Square scene with a graduate’s portrait on the curved NASDAQ Tower screen",
  },
] as const;

export function heroSlideIndex(index: number) {
  return ((index % POP_HERO_SLIDES.length) + POP_HERO_SLIDES.length) % POP_HERO_SLIDES.length;
}
