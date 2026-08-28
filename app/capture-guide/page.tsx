import { pageMetadata, webpageSchema } from "@/lib/discovery";
import { StructuredData } from "@/components/StructuredData";
import Link from "next/link";
import { PopShell } from "@/components/PopShell";
const description = "How to film your celebration: capture anticipation, the POP and reactions with your phone. Free guidance for company milestones, weddings, birthdays and achievements.";
export const metadata = pageMetadata("How to capture your POP celebration", description, "/capture-guide");
export default function CaptureGuide() {
  return <PopShell><StructuredData data={webpageSchema("/capture-guide", "How to capture your POP celebration", description)} /><section className="pop-wrap pop-page"><p className="pop-eyebrow">Your free capture guide</p><h1>Something happens.<br /><em>POP.</em></h1><p className="pop-intro">A cork, confetti, a cheer—or something entirely yours. The feeling matters more than the prop.</p>
    <ol className="pop-guide">
      <li><h2>01. Set the scene.</h2><p>Choose a bright, uncluttered spot. Clean your phone lens, keep the camera steady and leave room for everyone. Check that everyone is comfortable being filmed. Arrange your own props safely and follow the venue’s rules.</p></li>
      <li><h2>02. Start before the POP.</h2><p>Record 5–8 seconds of anticipation. Keep faces and the celebration in frame. Don’t cut the instant something happens.</p></li>
      <li><h2>03. Stay for the feeling.</h2><p>Keep recording for another 10–15 seconds. Capture the smiles, applause and reactions. Add a wide group shot and a few close-ups if you can.</p></li>
      <li><h2>04. Keep the originals.</h2><p>Vertical video works well for social sharing; landscape footage can also be edited. Send the original files for a paid edit, without added captions or music. Your raw celebration is not restricted to a 15-second advertising format.</p></li>
      <li><h2>05. Share it—or keep it.</h2><p>For a free POP, publish your video on a supported social platform and send us the public link. For Keep it, we curate your supplied footage into a 30–45 second film, with one revision and one UNIKMO card. If you choose Times Square, screen preparation and licensed capture are agreed separately.</p></li>
    </ol><p className="pop-note">We provide direction, not props or an on-site crew. A free social link is not an archive: retain a copy of your original video.</p><Link className="pop-button" href="/launch">Start your moment ↗</Link>
  </section></PopShell>;
}
