import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const DEFAULTS = {
  sensitivity: 600,
  friction: 0.9,
  maxSpeed: 50,
  deadZone: 0.002,
  transitionThreshold: 10,
  snapVelocityThreshold: 0.7,
  snapCooldownMs: 400,
  snapDistanceThreshold: 12,
};

let config = { ...DEFAULTS };
let smoothY = 0.5;
let prevY = 0.5;
let latestHandY = 0.5;
let velocity = 0;
let currentScroll = 0;
let initialized = false;
let enabled = false;
let rafId = null;
let smootherInstance = null;
let transitionArmed = false;
let intentDirection = 0;
let lastSnapAt = 0;

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const resolveSmoother = () => {
  try {
    return ScrollSmoother.get() || null;
  } catch {
    return null;
  }
};

const resolveScrollTop = () => {
  if (smootherInstance) return smootherInstance.scrollTop();
  return window.scrollY || window.pageYOffset || 0;
};

const isNativeScrollPreferred = () =>
  window.matchMedia?.("(pointer: coarse)").matches ||
  window.matchMedia?.("(hover: none)").matches ||
  "ontouchstart" in window;

const resolveSnapSections = () => {
  const sections = Array.from(document.querySelectorAll("section"));
  if (sections.length) return sections;

  const fallbackSelector =
    ".landing-section, .about-section, .career-section, .work-section, .contact-section, .scroll-video-section, .camera-music-panel";
  return Array.from(document.querySelectorAll(fallbackSelector));
};

const resolveSectionTop = (el, currentTop) => {
  const rect = el.getBoundingClientRect();
  return currentTop + rect.top;
};

const pickSnapTarget = (currentTop, direction) => {
  const sections = resolveSnapSections();
  if (!sections.length) return null;

  const sectionTops = sections
    .map((el) => ({ el, top: resolveSectionTop(el, currentTop) }))
    .sort((a, b) => a.top - b.top);

  const nearest = sectionTops.reduce(
    (best, candidate) =>
      Math.abs(candidate.top - currentTop) < Math.abs(best.top - currentTop) ? candidate : best,
    sectionTops[0]
  );

  if (direction > 0) {
    const next = sectionTops.find((candidate) => candidate.top > currentTop + 24);
    return next || nearest;
  }

  if (direction < 0) {
    const previous = [...sectionTops].reverse().find((candidate) => candidate.top < currentTop - 24);
    return previous || nearest;
  }

  return nearest;
};

const maybeSnapToSection = () => {
  if (!transitionArmed) return;
  if (Date.now() - lastSnapAt < config.snapCooldownMs) return;
  if (Math.abs(velocity) > config.snapVelocityThreshold) return;

  const currentTop = resolveScrollTop();
  const target = pickSnapTarget(currentTop, intentDirection);
  transitionArmed = false;
  intentDirection = 0;
  if (!target) return;
  if (Math.abs(target.top - currentTop) < config.snapDistanceThreshold) return;

  lastSnapAt = Date.now();
  velocity = 0;
  if (smootherInstance) {
    smootherInstance.scrollTo(target.el, true, "top top");
    return;
  }
  window.scrollTo({ top: target.top, behavior: "smooth" });
};

const applyScrollDelta = (delta) => {
  if (smootherInstance) {
    currentScroll = resolveScrollTop() + delta;
    smootherInstance.scrollTop(currentScroll);
    ScrollTrigger.update();
    return;
  }
  window.scrollBy(0, delta);
  ScrollTrigger.update();
};

const step = () => {
  rafId = window.requestAnimationFrame(step);
  if (!enabled) return;
  if (isNativeScrollPreferred()) {
    velocity = 0;
    transitionArmed = false;
    intentDirection = 0;
    return;
  }
  smootherInstance = resolveSmoother();

  // Smooth input from latest hand position (input and motion are decoupled).
  smoothY = smoothY * 0.85 + latestHandY * 0.15;
  const delta = smoothY - prevY;
  prevY = smoothY;

  if (Math.abs(delta) > config.deadZone) {
    velocity += delta * config.sensitivity;
  }

  velocity *= config.friction;
  velocity = clamp(velocity, -config.maxSpeed, config.maxSpeed);

  if (Math.abs(velocity) > config.transitionThreshold) {
    transitionArmed = true;
    intentDirection = velocity > 0 ? 1 : -1;
  }

  if (Math.abs(velocity) <= 0.01) {
    velocity = 0;
    maybeSnapToSection();
    return;
  }

  applyScrollDelta(velocity);
  maybeSnapToSection();
};

export const initGestureScroll = ({
  sensitivity = DEFAULTS.sensitivity,
  friction = DEFAULTS.friction,
  maxSpeed = DEFAULTS.maxSpeed,
  transitionThreshold = DEFAULTS.transitionThreshold,
  snapVelocityThreshold = DEFAULTS.snapVelocityThreshold,
  snapCooldownMs = DEFAULTS.snapCooldownMs,
} = {}) => {
  config = {
    ...DEFAULTS,
    sensitivity,
    friction,
    maxSpeed,
    transitionThreshold,
    snapVelocityThreshold,
    snapCooldownMs,
  };
  smootherInstance = resolveSmoother();
  smoothY = 0.5;
  prevY = 0.5;
  latestHandY = 0.5;
  velocity = 0;
  currentScroll = resolveScrollTop();
  transitionArmed = false;
  intentDirection = 0;
  lastSnapAt = 0;
  enabled = true;

  if (!initialized) {
    initialized = true;
    rafId = window.requestAnimationFrame(step);
  }

  return {
    setEnabled: (next) => {
      enabled = Boolean(next);
      if (!enabled) {
        velocity = 0;
        transitionArmed = false;
        intentDirection = 0;
      }
    },
    destroy: destroyGestureScroll,
  };
};

export const setGestureScrollEnabled = (nextEnabled) => {
  enabled = Boolean(nextEnabled);
  if (!enabled) {
    velocity = 0;
    transitionArmed = false;
    intentDirection = 0;
  }
};

export const updateGestureScroll = (handY) => {
  if (!initialized || !enabled || typeof handY !== "number") return;
  latestHandY = clamp(handY, 0, 1);
};

export const destroyGestureScroll = () => {
  enabled = false;
  initialized = false;
  velocity = 0;
  transitionArmed = false;
  intentDirection = 0;
  lastSnapAt = 0;
  latestHandY = 0.5;
  currentScroll = 0;
  smootherInstance = null;
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
};
