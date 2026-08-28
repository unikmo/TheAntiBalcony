"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { heroSlideIndex, POP_HERO_INTERVAL_MS, POP_HERO_SLIDES } from "@/lib/pop-hero";
import "@/app/pop-hero.css";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const motionAllowed = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}
const tabVisible = () => document.visibilityState === "visible";
const serverSnapshot = () => false;

export function PopHeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const canAnimate = useSyncExternalStore(subscribeMotion, motionAllowed, serverSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, tabVisible, serverSnapshot);
  const rotating = canAnimate && visible && inView && !paused && !hovered;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setActive(index => heroSlideIndex(index + 1)), POP_HERO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [rotating, active]);

  function select(index: number) {
    setPaused(true);
    setActive(heroSlideIndex(index));
  }

  return <div ref={root} className="pop-carousel" role="region" aria-roledescription="carousel" aria-label="Times Square possibilities"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={event => {
      // Focus stops rotation until the visitor explicitly presses Play.
      if (!(event.target instanceof Element) || !event.target.closest("[data-rotation-control]")) setPaused(true);
    }}
    onKeyDown={event => {
      // Let the native occasion picker handle its own arrows and Home/End.
      if (event.target instanceof HTMLSelectElement) return;
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      select(event.key === "Home" ? 0 : event.key === "End" ? POP_HERO_SLIDES.length - 1 : active + (event.key === "ArrowRight" ? 1 : -1));
    }}>
    <div className="pop-carousel-stage" id="pop-hero-slides"
      onPointerDown={event => {
        if (event.pointerType === "mouse") return;
        touchStart.current = { x: event.clientX, y: event.clientY };
        setPaused(true);
      }}
      onPointerCancel={() => { touchStart.current = null; }}
      onPointerUp={event => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - start.y)) select(active + (dx < 0 ? 1 : -1));
      }}>
      {POP_HERO_SLIDES.map((slide, index) => <div key={slide.src}
        className={`pop-carousel-slide ${index === active ? "is-active" : ""}`}
        role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${POP_HERO_SLIDES.length}: ${slide.label}`}
        aria-hidden={index !== active}>
        <Image src={slide.src} alt={slide.alt} fill
          sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1184px) calc(100vw - 64px), 1120px"
          priority={index === 0} loading={index === 0 ? undefined : "lazy"} />
        <div className="pop-carousel-story">
          <p className="pop-carousel-occasion">{slide.occasion}</p>
          <h2>{slide.headline[0]}<br />{slide.headline[1]}</h2>
          <p className="pop-carousel-invitation">{slide.invitation}</p>
        </div>
      </div>)}
    </div>
    <div className="pop-carousel-bar">
      <p className="pop-carousel-caption">Illustrative scenes · {active + 1} / {POP_HERO_SLIDES.length}</p>
      <div className="pop-carousel-controls">
        <button type="button" aria-label="Previous Times Square scene" aria-controls="pop-hero-slides" onClick={() => select(active - 1)}><span aria-hidden="true">←</span></button>
        <select className="pop-carousel-picker" aria-label="Find your moment" aria-controls="pop-hero-slides"
          value={active} onChange={event => select(Number(event.target.value))}>
          {POP_HERO_SLIDES.map((slide, index) => <option key={slide.src} value={index}>{slide.label}</option>)}
        </select>
        <button type="button" aria-label="Next Times Square scene" aria-controls="pop-hero-slides" onClick={() => select(active + 1)}><span aria-hidden="true">→</span></button>
        <button data-rotation-control type="button" disabled={!canAnimate}
          aria-label={!canAnimate ? "Automatic rotation off: reduced motion" : paused ? "Play carousel" : "Pause carousel"}
          onClick={() => setPaused(value => !value)}>
          <span aria-hidden="true">{paused || !canAnimate ? "▶" : "Ⅱ"}</span>
        </button>
      </div>
    </div>
    <span className="pop-visually-hidden" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
      {POP_HERO_SLIDES[active].label}, scene {active + 1} of {POP_HERO_SLIDES.length}.
    </span>
  </div>;
}
