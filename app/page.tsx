import type { Metadata } from "next";
import { AntiBalconyV2 } from "@/components/AntiBalconyV2";

export const metadata: Metadata = {
  title: "Launch Your Startup in Public",
  description: "Create a public Ring for what you built and share the moment your startup entered the world.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <AntiBalconyV2 />;
}
