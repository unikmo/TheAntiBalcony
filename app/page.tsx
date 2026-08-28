import { PopHome } from "@/components/PopHome";
import { StructuredData } from "@/components/StructuredData";
import { homeSchema, pageMetadata, SITE_DESCRIPTION } from "@/lib/discovery";

export const metadata = pageMetadata("Celebrate it. Show it. Keep it.", SITE_DESCRIPTION, "/");

export default function Home() {
  return <><StructuredData data={homeSchema()} /><PopHome /></>;
}
