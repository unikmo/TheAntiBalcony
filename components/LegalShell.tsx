import type { ReactNode } from "react";
import { PopShell } from "./PopShell";
export function LegalShell({ children }: { children: ReactNode }) {
  return <PopShell><article className="legal-page">{children}</article></PopShell>;
}
