/**
 * ARCANE STUDIO — Premium Interactions Engine
 * Drop this into any project for instant $10K feel.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// ── SMOOTH SCROLL ────────────────────────
export function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync GSAP ScrollTrigger with Lenis
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

// ── REVEAL ON SCROLL ─────────────────────
export function initReveals() {
  const elements = document.querySelectorAll(".reveal");
  elements.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      onEnter: () => el.classList.add("in"),
      once: true,
    });
  });

  // Stagger groups
  const staggerGroups = document.querySelectorAll(".reveal-stagger");
  staggerGroups.forEach((group) => {
    ScrollTrigger.create({
      trigger: group,
      start: "top 85%",
      onEnter: () => group.classList.add("in"),
      once: true,
    });
  });
}

// ── SPOTLIGHT CURSOR FOLLOW ──────────────
export function initSpotlight() {
  const spotlights = document.querySelectorAll(".spotlight");
  spotlights.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    });
  });
}

// ── COUNTER ANIMATION ────────────────────
export function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  counters.forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(
          { val: 0 },
          {
            val: target,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: function () {
              el.textContent =
                prefix + this.targets()[0].val.toFixed(decimals) + suffix;
            },
          }
        );
      },
    });
  });
}

// ── SCORE BARS ───────────────────────────
export function initScoreBars() {
  const bars = document.querySelectorAll(".score-bar-fill");
  bars.forEach((bar) => {
    const width = bar.dataset.score || "0";
    bar.style.width = "0%";
    ScrollTrigger.create({
      trigger: bar,
      start: "top 90%",
      once: true,
      onEnter: () => {
        bar.style.width = width + "%";
      },
    });
  });
}

// ── PARALLAX ELEMENTS ────────────────────
export function initParallax() {
  const items = document.querySelectorAll("[data-parallax]");
  items.forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: speed * 100,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });
  });
}

// ── MAGNETIC BUTTON ──────────────────────
export function initMagnetic() {
  const magnets = document.querySelectorAll(".magnetic");
  magnets.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 0.4,
        ease: "power2.out",
      });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    });
  });
}

// ── TEXT SPLIT & ANIMATE ─────────────────
export function initTextSplit() {
  const splits = document.querySelectorAll("[data-split]");
  splits.forEach((el) => {
    const text = el.textContent;
    el.innerHTML = text
      .split("")
      .map(
        (char) =>
          `<span style="display:inline-block;opacity:0;transform:translateY(20px)">${char === " " ? "&nbsp;" : char}</span>`
      )
      .join("");

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(el.querySelectorAll("span"), {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.02,
          ease: "power2.out",
        });
      },
    });
  });
}

// ── TILT CARD ────────────────────────────
export function initTilt() {
  const cards = document.querySelectorAll(".tilt-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateY: x * 8,
        rotateX: -y * 8,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 800,
      });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    });
  });
}

// ── INIT ALL ─────────────────────────────
export function initArcane(options = {}) {
  const lenis = initLenis();
  initReveals();
  initSpotlight();
  initCounters();
  initScoreBars();
  initParallax();
  initMagnetic();
  initTilt();

  if (options.textSplit) initTextSplit();

  // Refresh ScrollTrigger after fonts load
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  return { lenis, gsap, ScrollTrigger };
}
