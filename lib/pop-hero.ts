export const POP_HERO_INTERVAL_MS = 4000;

export const POP_HERO_SLIDES = [
  {
    src: "/pop-times-square-wedding.webp",
    label: "Wedding",
    occasion: "Your wedding",
    headline: ["Your forever.", "Up in lights."],
    invitation: "Your favourite day. For the city to see.",
    alt: "Illustrative Times Square scene with a newlywed couple on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-proposal.webp",
    label: "Proposal",
    occasion: "The big question",
    headline: ["One question.", "A whole new chapter."],
    invitation: "Imagine asking with all of Times Square watching.",
    alt: "Illustrative Times Square scene with a marriage proposal on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-birthday.webp",
    label: "Birthday",
    occasion: "Their birthday",
    headline: ["Their day.", "In a bigger way."],
    invitation: "Put someone you love in the spotlight.",
    alt: "Illustrative Times Square scene with a birthday celebration and cake on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-baby-shower.webp",
    label: "Baby shower",
    occasion: "A little one on the way",
    headline: ["Your little beginning.", "A big welcome."],
    invitation: "A new chapter worth celebrating.",
    alt: "Illustrative Times Square scene with expectant parents celebrating a baby shower on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-together.webp",
    label: "I love you",
    occasion: "Just because you love them",
    headline: ["Three little words.", "One giant gesture."],
    invitation: "Say it where they’ll never forget it.",
    alt: "Illustrative Times Square scene with a couple’s portrait on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-memories.webp",
    label: "Our memories",
    occasion: "The moments that made you",
    headline: ["Your favourite people.", "Your favourite moments."],
    invitation: "Bring a memory back, bigger than ever.",
    alt: "Illustrative Times Square scene with friends sharing a happy memory on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-anniversary.webp",
    label: "Anniversary",
    occasion: "Another year together",
    headline: ["Still you.", "Always you."],
    invitation: "Celebrate the years. And everything ahead.",
    alt: "Illustrative Times Square scene with an older couple celebrating their anniversary on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-graduation.webp",
    label: "Graduation",
    occasion: "Graduations & achievements",
    headline: ["You earned this.", "Let it show."],
    invitation: "A bigger stage for your next chapter.",
    alt: "Illustrative Times Square scene with a graduate’s portrait on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-launch.webp",
    label: "Launch",
    occasion: "Launches & milestones",
    headline: ["Your hard work.", "Up in lights."],
    invitation: "Picture your team in Times Square.",
    alt: "Illustrative Times Square scene with a celebrating team on the curved NASDAQ Tower screen",
  },
  {
    src: "/pop-times-square-team-win.webp",
    label: "Team win",
    occasion: "A win worth sharing",
    headline: ["We did it.", "Let the city know."],
    invitation: "Give everyone who made it happen their moment.",
    alt: "Illustrative Times Square scene with a team celebrating a trophy win on the curved NASDAQ Tower screen",
  },
] as const;

export function heroSlideIndex(index: number) {
  return ((index % POP_HERO_SLIDES.length) + POP_HERO_SLIDES.length) % POP_HERO_SLIDES.length;
}
