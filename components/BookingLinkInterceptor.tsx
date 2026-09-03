"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function BookingLinkInterceptor() {
  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const href = target.getAttribute("href") || "";
      if (!href.startsWith("mailto:hello@antibalcony.com?subject=")) return;

      const subject = decodeURIComponent(href.split("subject=")[1] || "");
      const params = new URLSearchParams();
      if (/show \+ keep/i.test(subject)) params.set("package", "video");
      else if (/the moment/i.test(subject)) params.set("package", "takeover");
      else if (/show it/i.test(subject)) params.set("package", "snapshot");

      const momentMatch = subject.match(/My Times Square moment\s*[—-]\s*(.+)$/i);
      if (momentMatch?.[1]) params.set("occasion", momentMatch[1].trim());

      event.preventDefault();
      router.push(`/book${params.size ? `?${params.toString()}` : ""}`);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [router]);

  return null;
}
