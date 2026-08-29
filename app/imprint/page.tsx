import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = { title: "Imprint", description: "Operator and contact information for The Pop Moment.", alternates: { canonical: "/imprint" } };

export default function Imprint() {
  return <LegalShell><p className="legal-meta">LEGAL INFORMATION</p><h1>Imprint.</h1><div className="legal-review">REQUIRES QUALIFIED LEGAL REVIEW</div><h2>Service provider</h2><p><strong>PlanetHike OÜ</strong><br />The Pop Moment is a service of PlanetHike OÜ.<br />Järvevana tee 9<br />11314 Tallinn<br />Estonia</p><p>Estonian registration number: <strong>80656111</strong><br />Legal representative: <strong>Tichi Mbanwie</strong></p><h2>Contact</h2><p>Email: <a href="mailto:hello@antibalcony.com">hello@antibalcony.com</a></p><h2>Editorial responsibility</h2><p>PlanetHike OÜ, represented by Tichi Mbanwie, at the address stated above.</p><h2>Dispute resolution</h2><p>We are not obliged and do not presently agree to participate in dispute-resolution proceedings before a consumer arbitration board, unless mandatory law requires otherwise.</p><p className="legal-meta">Last updated: 29 August 2026</p></LegalShell>;
}
