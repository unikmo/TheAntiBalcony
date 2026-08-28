"use client";
import { useState } from "react";
import Image from "next/image";

export function PopPreview() {
  const [playing, setPlaying] = useState(false);
  return <figure className="pop-screen">
    {playing ? <video controls autoPlay playsInline preload="none" poster="/antibalcony-nasdaq-unikmo.webp" aria-label="Illustrative UNIKMO NASDAQ creative, not recorded proof of a live placement" onEnded={() => setPlaying(false)}>
      <source src="/antibalcony-nasdaq-unikmo-proof-v2.mp4" type="video/mp4" />
      Your browser cannot play this preview.
    </video> : <button type="button" onClick={() => setPlaying(true)} aria-label="Play the illustrative NASDAQ preview">
      <Image src="/antibalcony-nasdaq-unikmo.webp" alt="UNIKMO creative shown on the NASDAQ Tower in an illustrative Times Square scene" fill sizes="(max-width: 720px) 90vw, 45vw" />
      <span className="pop-play">Play the preview ↗</span>
    </button>}
    <figcaption>Creative visualisation. Not footage of a booked placement.</figcaption>
  </figure>;
}
