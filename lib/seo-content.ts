export type Guide = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
  related: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-launch-a-startup",
    title: "How to Launch a Startup: A Practical Public-Launch Guide",
    description: "A practical startup launch process covering positioning, proof, distribution, launch day and the public artifact that keeps working after launch.",
    eyebrow: "STARTUP LAUNCH GUIDE",
    intro: "A startup launch is not one post or one platform. It is a coordinated moment that makes the product understandable, gives people something concrete to react to and creates proof you can keep sharing after launch day.",
    sections: [
      { heading: "1. Decide what the launch must achieve", body: ["Choose one primary outcome: awareness, signups, customers, feedback, investor visibility or partner attention. A launch with five equal goals usually produces weak messaging.", "Write one sentence that says what changed for the customer now that your product exists. That sentence should guide the homepage, launch post and founder outreach."] },
      { heading: "2. Build a launch asset before distribution", body: ["Prepare a clear product page, one strong visual, a short founder explanation and a launch page on a domain you control. Keep that page updated so people can find useful context after a social post leaves their feed.", "Earlier AntiBalcony launch records were called Rings and remain in the archive. New celebrations use The Pop Moment by UNIKMO; it creates memory films, not a substitute for your product website."] },
      { heading: "3. Sequence distribution", body: ["Use the channels where you already have a plausible audience first: customers, email, LinkedIn, X, communities, partners and relevant launch platforms. Product Hunt can be one channel, but it should not be the whole launch plan."] },
      { heading: "4. Keep the proof", body: ["Save screenshots, launch metrics, quotes, customer reactions and any media generated around launch day. Turn them into follow-up posts and sales proof instead of treating launch day as an isolated event."] },
    ],
    related: ["product-launch-checklist", "product-launch-plan", "where-to-launch-your-startup"],
  },
  {
    slug: "product-launch-checklist",
    title: "Product Launch Checklist for Startups",
    description: "A focused product launch checklist for startup teams preparing messaging, assets, distribution, measurement and post-launch follow-up.",
    eyebrow: "PRODUCT LAUNCH CHECKLIST",
    intro: "The useful launch checklist is short enough to execute and strict enough to prevent the most common failure: publishing everywhere before the message and conversion path are ready.",
    sections: [
      { heading: "Positioning", body: ["Define the customer, problem, product category and single clearest benefit. Make sure a first-time visitor can understand the product without founder context."] },
      { heading: "Launch assets", body: ["Prepare the landing page, product visual, short demo, founder note, FAQs, social copy, email copy and a permanent public launch URL."] },
      { heading: "Distribution", body: ["List owned channels first, then communities and launch platforms. Assign each channel an owner and a publishing time instead of improvising on launch day."] },
      { heading: "Measurement and follow-up", body: ["Track visits, signups, qualified conversations, conversions and useful feedback. Schedule follow-up content before launch day so momentum does not disappear after 24 hours."] },
    ],
    related: ["product-launch-plan", "how-to-launch-a-startup", "startup-launch-announcement"],
  },
  {
    slug: "product-launch-plan",
    title: "Product Launch Plan: From Pre-Launch to Follow-Up",
    description: "Build a startup product launch plan with a simple timeline for positioning, assets, distribution, launch day and post-launch reuse.",
    eyebrow: "PRODUCT LAUNCH PLAN",
    intro: "A strong launch plan creates a sequence, not a single date. The work before launch earns clarity; the work after launch compounds the proof.",
    sections: [
      { heading: "Two to four weeks before", body: ["Lock positioning, identify launch audiences, gather product visuals, prepare the launch page and recruit a small group of early supporters who can give real feedback."] },
      { heading: "Launch week", body: ["Finalize channel-specific copy, verify analytics, test signup and payment paths, prepare founder outreach and create the public launch artifact you will link from every channel."] },
      { heading: "Launch day", body: ["Publish the owned launch page first. Then distribute through email, social, communities and launch platforms. Respond quickly to questions because conversation is part of the launch asset."] },
      { heading: "Week after launch", body: ["Publish results, lessons, customer reactions and product improvements. Keep linking to the permanent launch record instead of forcing people to find an old social post."] },
    ],
    related: ["product-launch-checklist", "build-in-public", "how-to-launch-a-startup"],
  },
  {
    slug: "build-in-public",
    title: "Build in Public Without Turning Your Startup Into Content",
    description: "A practical build-in-public approach that shares useful progress, decisions and launch proof without making constant posting the product.",
    eyebrow: "BUILD IN PUBLIC",
    intro: "Building in public works when the public record helps customers understand progress and gives the founder accountable milestones. It fails when content production becomes more important than product progress.",
    sections: [
      { heading: "Share decisions, not noise", body: ["Useful public updates explain what changed, why it changed and what you learned. Avoid posting activity simply to maintain a streak."] },
      { heading: "Create milestones people can reference", body: ["Launches, major releases, customer milestones and important pivots deserve permanent pages. They give later readers context that a timeline of disconnected posts cannot."] },
      { heading: "Use public proof across channels", body: ["Use your own product or milestone page as the destination across your launch channels. The Pop Moment can preserve the celebration in a curated film and UNIKMO cards; it does not guarantee discovery, distribution or permanent hosting of free social videos."] },
    ],
    related: ["how-to-launch-a-startup", "startup-launch-announcement", "where-to-launch-your-startup"],
  },
  {
    slug: "how-to-launch-on-product-hunt",
    title: "How to Launch on Product Hunt Without Making It Your Entire Launch",
    description: "Prepare a Product Hunt launch while keeping your owned launch page, audience and follow-up independent of one platform.",
    eyebrow: "PRODUCT HUNT LAUNCH",
    intro: "Product Hunt can add discovery, feedback and social proof. Treat it as an important distribution channel, not as the place where your startup launch begins and ends.",
    sections: [
      { heading: "Prepare the product before the listing", body: ["Make the landing page understandable, tighten onboarding and prepare screenshots or a demo that communicate value immediately."] },
      { heading: "Launch from an owned URL too", body: ["Create a permanent launch page that explains the startup, founder, customer and problem. Link it from your broader launch campaign so the launch remains useful after ranking day ends."] },
      { heading: "Plan the conversation", body: ["Be available to answer questions, collect feedback and route serious prospects into your normal customer journey. Do not optimize only for votes."] },
    ],
    related: ["product-hunt-launch-checklist", "product-hunt-alternatives", "where-to-launch-your-startup"],
  },
  {
    slug: "product-hunt-alternatives",
    title: "Product Hunt Alternatives for Startup Launches",
    description: "Compare different ways to launch a startup publicly, including launch platforms, communities, owned audiences and permanent public launch pages.",
    eyebrow: "PRODUCT HUNT ALTERNATIVES",
    intro: "There is no universal Product Hunt replacement because different launch channels solve different jobs: discovery, feedback, community, customer acquisition or public proof.",
    sections: [
      { heading: "Use discovery platforms for reach", body: ["Platforms with an existing audience can expose a product to people you do not already know. Their strength is distribution; their weakness is that attention is rented and time-limited."] },
      { heading: "Use communities for relevance", body: ["Founder, developer, industry and customer communities can deliver higher-quality conversations when the product genuinely fits the group."] },
      { heading: "Keep an owned destination", body: ["Maintain a product launch page on a domain you control. Earlier AntiBalcony Rings remain accessible as an archive, while The Pop Moment by UNIKMO now focuses on celebrating and curating milestone memories. It is not a product-discovery network or a promise of audience reach."] },
    ],
    related: ["how-to-launch-on-product-hunt", "where-to-launch-your-startup", "build-in-public"],
  },
  {
    slug: "product-hunt-launch-checklist",
    title: "Product Hunt Launch Checklist",
    description: "A concise Product Hunt launch checklist covering page preparation, assets, launch-day participation and owned follow-up.",
    eyebrow: "PRODUCT HUNT CHECKLIST",
    intro: "A Product Hunt launch is stronger when the product page, founder response plan and post-launch destination are ready before the listing goes live.",
    sections: [
      { heading: "Before launch", body: ["Test onboarding, prepare clear visuals, write a concise description, prepare founder responses and make sure analytics identify Product Hunt traffic separately."] },
      { heading: "During launch", body: ["Respond to questions, thank useful feedback, capture notable comments and route interested users to the appropriate next step."] },
      { heading: "After launch", body: ["Publish what you learned, reuse credible social proof and link back to a permanent launch record so the campaign keeps a useful destination."] },
    ],
    related: ["how-to-launch-on-product-hunt", "product-hunt-alternatives", "startup-launch-announcement"],
  },
  {
    slug: "where-to-launch-your-startup",
    title: "Where to Launch Your Startup: Channels, Communities and Launch Sites",
    description: "Choose where to launch your startup based on audience fit, discovery, feedback, customer intent and the need for a permanent public launch record.",
    eyebrow: "STARTUP LAUNCH WEBSITES",
    intro: "The best place to launch depends on who must notice. Most startups should combine an owned launch page with a small number of distribution channels rather than trying to appear everywhere.",
    sections: [
      { heading: "Owned audience", body: ["Start by considering email subscribers, existing customers, founder networks and your own website. Test which audiences produce useful conversations and conversions rather than assuming a channel will perform best."] },
      { heading: "Launch and discovery platforms", body: ["Use product-discovery sites when you want exposure, early adopters and feedback. Measure downstream behavior, not only ranking or reactions."] },
      { heading: "Communities", body: ["Choose communities where the problem already matters. Tailor the message to the community instead of reposting the same launch copy everywhere."] },
      { heading: "Public launch record", body: ["Create a maintained, shareable launch page on your own site. For the celebration itself, The Pop Moment offers a free social-link page after review or a paid curated film with a UNIKMO card. A free social link is not a permanent video archive."] },
    ],
    related: ["product-hunt-alternatives", "how-to-launch-a-startup", "build-in-public"],
  },
  {
    slug: "startup-launch-announcement",
    title: "Startup Launch Announcement: What to Say and What to Leave Out",
    description: "Write a startup launch announcement that explains the customer, problem, product and next step without burying the launch under founder jargon.",
    eyebrow: "STARTUP LAUNCH ANNOUNCEMENT",
    intro: "The best launch announcement is understandable to someone who did not watch the product being built. Lead with the customer change, not the amount of work behind it.",
    sections: [
      { heading: "Opening", body: ["Say what launched, who it is for and what problem it changes. Avoid a long origin story before the reader understands the product."] },
      { heading: "Proof", body: ["Show the product, explain one concrete use case and include a clear destination where people can learn more or try it."] },
      { heading: "Founder context", body: ["Add the short story behind the product only after the value is clear. A useful founder note explains why you cared enough to build it and what you learned."] },
      { heading: "Call to action", body: ["Ask for one thing: try it, join, buy, give feedback or share. Link to the permanent launch page so every repost points to the same source."] },
    ],
    related: ["how-to-launch-a-startup", "product-launch-checklist", "build-in-public"],
  },
];

export const GUIDE_MAP = Object.fromEntries(GUIDES.map((guide) => [guide.slug, guide]));
