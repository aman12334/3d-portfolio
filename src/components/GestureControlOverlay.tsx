import { useEffect, useRef, useState } from "react";
import { smoother as navbarSmoother } from "./Navbar";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { startMindARCamera, stopMindARCamera } from "./utils/mindarBridge";
import "./styles/GestureControlOverlay.css";

type WorkerReadyMessage = { type: "ready" };
type WorkerErrorMessage = { type: "error"; message: string };
type WorkerHandDataMessage = {
  type: "HAND_DATA";
  x: number;
  y: number;
  isPinching: boolean;
};
type WorkerNoHandMessage = { type: "NO_HAND" };
type WorkerMessage =
  | WorkerReadyMessage
  | WorkerErrorMessage
  | WorkerHandDataMessage
  | WorkerNoHandMessage;

const TARGET_PRIORITY: Array<{ match: string; closest?: string }> = [
  // Top navigation targets (About / Work / Projects / Contact)
  { match: ".header ul a, .header ul a *", closest: ".header ul a" },
  { match: "[data-href], [data-href] *", closest: "[data-href]" },

  // Work section controls and tiles
  { match: ".work-stack-hit-zone, .work-stack-hit-zone *", closest: ".work-stack-hit-zone" },
  { match: ".work-stack-step, .work-stack-step *", closest: ".work-stack-step" },
  { match: ".work-stack-tile, .work-stack-tile *", closest: ".work-stack-tile" },
  { match: ".work-project-link, .work-project-link *", closest: ".work-project-link" },

  // Embedded project media (YouTube / iframe / video)
  { match: ".work-project-embed, .work-project-embed *", closest: ".work-project-embed" },
  { match: "iframe, video", closest: "iframe, video" },

  // Footer/Contact actionable links
  { match: ".professional-card, .professional-card *", closest: ".professional-card" },
  { match: ".contact-section a, .contact-section a *", closest: ".contact-section a" },

  // Generic interactive fallback
  { match: "a, a *, button, button *", closest: "a, button" },
  { match: "[onclick], [onclick] *", closest: "[onclick]" },
  { match: "[role='button'], [role='button'] *", closest: "[role='button']" },
];

const INTERACTION_FALLBACK_SELECTOR = [
  ".header ul a",
  "[data-href]",
  ".work-stack-hit-zone",
  ".work-stack-step",
  ".work-stack-tile",
  ".work-project-link",
  ".work-project-embed",
  "iframe",
  "video",
  ".professional-card",
  ".contact-section a",
  "button",
  "a",
].join(", ");

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const GestureControlOverlay = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const workerReadyRef = useRef(false);
  const workerBusyRef = useRef(false);
  const enabledRef = useRef(false);
  const cursorRafIdRef = useRef<number | null>(null);
  const workerRafIdRef = useRef<number | null>(null);

  const currentCursorXRef = useRef(window.innerWidth * 0.5);
  const currentCursorYRef = useRef(window.innerHeight * 0.5);
  const targetCursorXRef = useRef(window.innerWidth * 0.5);
  const targetCursorYRef = useRef(window.innerHeight * 0.5);

  const isPinchingRef = useRef(false);
  const prevPinchingRef = useRef(false);
  const prevPinchYRef = useRef(0);
  const pinchStartYRef = useRef(0);
  const initialScrollYRef = useRef(0);
  const lastClickAtRef = useRef(0);
  const lastDetectPostAtRef = useRef(0);
  const previousHoverElRef = useRef<HTMLElement | null>(null);
  const handDetectedRef = useRef(false);

  const [enabled, setEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [error, setError] = useState("");

  const dispatchHover = (el: HTMLElement | null, x: number, y: number) => {
    const previousEl = previousHoverElRef.current;

    if (previousEl !== el) {
      if (previousEl) {
        previousEl.dispatchEvent(
          new MouseEvent("mouseleave", {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
          })
        );
      }

      if (el) {
        el.dispatchEvent(
          new MouseEvent("mouseenter", {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
          })
        );
      }
    }

    if (el) {
      el.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        })
      );
    }

    previousHoverElRef.current = el;
  };

  const resetVirtualInteraction = () => {
    const x = currentCursorXRef.current;
    const y = currentCursorYRef.current;

    if (previousHoverElRef.current) {
      previousHoverElRef.current.dispatchEvent(
        new MouseEvent("mouseleave", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        })
      );
    }

    previousHoverElRef.current = null;
    isPinchingRef.current = false;
    prevPinchingRef.current = false;
    prevPinchYRef.current = 0;
    pinchStartYRef.current = 0;
    initialScrollYRef.current = 0;
  };

  const getRaycastStack = (cursorX: number, cursorY: number) => {
    const screenX = clamp(cursorX, 0, window.innerWidth - 1);
    const screenY = clamp(cursorY, 0, window.innerHeight - 1);
    const cursorEl = cursorRef.current;
    const pinkCursorEl = document.querySelector(".cursor-main") as HTMLElement | null;
    const canvases = Array.from(document.querySelectorAll("canvas")) as HTMLCanvasElement[];
    const originalCanvasPointerEvents: string[] = [];
    let previousDisplay = "";
    let pinkPreviousDisplay = "";

    if (cursorEl) {
      previousDisplay = cursorEl.style.display;
      cursorEl.style.display = "none";
    }
    if (pinkCursorEl) {
      pinkPreviousDisplay = pinkCursorEl.style.display;
      pinkCursorEl.style.display = "none";
    }
    canvases.forEach((canvas, i) => {
      originalCanvasPointerEvents[i] = canvas.style.pointerEvents;
      canvas.style.pointerEvents = "none";
    });

    const stack = document.elementsFromPoint(screenX, screenY);

    canvases.forEach((canvas, i) => {
      canvas.style.pointerEvents = originalCanvasPointerEvents[i] || "";
    });

    if (cursorEl) {
      cursorEl.style.display = previousDisplay || "block";
    }
    if (pinkCursorEl) {
      pinkCursorEl.style.display = pinkPreviousDisplay || "block";
    }

    return stack;
  };

  const resolveFromHitElements = (hitElements: Element[]) => {
    for (const el of hitElements) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest("[data-gesture-ui]")) continue;

      const styles = window.getComputedStyle(el);
      if (
        styles.pointerEvents === "none" ||
        styles.visibility === "hidden" ||
        styles.opacity === "0"
      ) {
        continue;
      }

      for (const rule of TARGET_PRIORITY) {
        if (el.matches(rule.match)) {
          if (rule.closest) {
            const closest = el.closest(rule.closest);
            if (closest instanceof HTMLElement) return closest;
          }
          return el;
        }
      }

      if (styles.cursor === "pointer") {
        return el;
      }
    }

    return null;
  };

  const findFallbackTarget = (x: number, y: number) => {
    const candidates = Array.from(
      document.querySelectorAll(INTERACTION_FALLBACK_SELECTOR)
    ) as HTMLElement[];
    let best: { el: HTMLElement; dist: number } | null = null;

    for (const el of candidates) {
      if (el.closest("[data-gesture-ui]")) continue;
      const styles = window.getComputedStyle(el);
      if (
        styles.pointerEvents === "none" ||
        styles.visibility === "hidden" ||
        styles.opacity === "0" ||
        styles.display === "none"
      ) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const contains =
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      if (contains) return el;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(cx - x, cy - y);

      if (!best || dist < best.dist) {
        best = { el, dist };
      }
    }

    if (best && best.dist < 140) return best.el;
    return null;
  };

  const resolveInteractionTarget = (cursorX: number, cursorY: number) => {
    const hitElements = getRaycastStack(cursorX, cursorY);
    return resolveFromHitElements(hitElements);
  };

  const resolveActionableTarget = (targetElement: HTMLElement) => {
    const actionable = targetElement.closest(
      "a, button, [data-href], [data-scroll-target], [role='button'], [tabindex], iframe, video"
    );
    if (actionable instanceof HTMLElement && !actionable.closest("[data-gesture-ui]")) {
      return actionable;
    }
    return targetElement;
  };

  const forceReactClick = (targetElement: HTMLElement) => {
    const reactKey = Object.keys(targetElement).find((k) => k.startsWith("__reactProps$"));
    if (!reactKey) return false;

    const maybeProps = (targetElement as unknown as Record<string, unknown>)[reactKey] as
      | {
          onClick?: (e: Record<string, unknown>) => void;
        }
      | undefined;

    if (!maybeProps?.onClick || typeof maybeProps.onClick !== "function") return false;

    let defaultPrevented = false;
    maybeProps.onClick({
      target: targetElement,
      currentTarget: targetElement,
      preventDefault: () => {
        defaultPrevented = true;
      },
      stopPropagation: () => {},
      get defaultPrevented() {
        return defaultPrevented;
      },
    });

    return true;
  };

  const dispatchNativeClick = (target: HTMLElement, x: number, y: number) => {
    const clickX = Math.round(x);
    const clickY = Math.round(y);
    const eventConfig: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clickX,
      clientY: clickY,
    };

    if (typeof PointerEvent !== "undefined") {
      target.dispatchEvent(new PointerEvent("pointerdown", eventConfig));
    }
    target.dispatchEvent(new MouseEvent("mousedown", eventConfig));
    if (typeof PointerEvent !== "undefined") {
      target.dispatchEvent(new PointerEvent("pointerup", eventConfig));
    }
    target.dispatchEvent(new MouseEvent("mouseup", eventConfig));
    target.dispatchEvent(new MouseEvent("click", eventConfig));
  };

  const triggerInteractionTarget = (x: number, y: number, now: number) => {
    const clickX = Math.round(clamp(x, 0, window.innerWidth - 1));
    const clickY = Math.round(clamp(y, 0, window.innerHeight - 1));
    const hitElements = getRaycastStack(clickX, clickY);
    let resolvedTarget = resolveFromHitElements(hitElements);
    if (!resolvedTarget) {
      resolvedTarget = findFallbackTarget(clickX, clickY);
    }

    if (!resolvedTarget) {
      console.log("FAILED: No clickable target found in stack:", hitElements);
      return false;
    }

    console.log("SUCCESS: Clicking resolved target:", resolvedTarget);
    resolvedTarget.style.outline = "3px solid green";
    window.setTimeout(() => {
      resolvedTarget.style.outline = "";
    }, 500);
    const actionableTarget = resolveActionableTarget(resolvedTarget);

    if (typeof actionableTarget.focus === "function") {
      actionableTarget.focus({ preventScroll: true });
    }

    const dataHref = actionableTarget.getAttribute("data-href");
    const dataScrollTarget = actionableTarget.getAttribute("data-scroll-target");
    const href = actionableTarget.getAttribute("href");

    const targetSection =
      dataHref || dataScrollTarget || (href && href.startsWith("#") ? href : null);

    if (targetSection) {
      if (targetSection.startsWith("#")) {
        const section = document.querySelector(targetSection);
        if (!section) {
          console.warn(`Cannot scroll: Section ${targetSection} not found in DOM.`);
          return false;
        }
      }
      const smoother = ScrollSmoother.get() || navbarSmoother;
      if (smoother) {
        const section = document.querySelector(targetSection);
        smoother.scrollTo(section || targetSection, true, "top top");
      } else {
        const fallback = document.querySelector(targetSection);
        if (fallback instanceof HTMLElement) {
          fallback.scrollIntoView({ behavior: "smooth" });
        }
      }

      lastClickAtRef.current = now;
      window.dispatchEvent(
        new CustomEvent("gesture-click", {
          detail: { x: clickX, y: clickY, target: targetSection },
        })
      );
      return true;
    }

    if (forceReactClick(actionableTarget) || forceReactClick(resolvedTarget)) {
      lastClickAtRef.current = now;
      window.dispatchEvent(
        new CustomEvent("gesture-click", {
          detail: {
            x: clickX,
            y: clickY,
            target:
              actionableTarget.getAttribute("href") ||
              actionableTarget.getAttribute("data-href") ||
              actionableTarget.tagName.toLowerCase(),
          },
        })
      );
      return true;
    }

    dispatchNativeClick(actionableTarget, clickX, clickY);
    if (actionableTarget.tagName.toLowerCase() === "iframe") {
      actionableTarget.focus();
    }
    lastClickAtRef.current = now;
    window.dispatchEvent(
      new CustomEvent("gesture-click", {
        detail: {
          x: clickX,
          y: clickY,
          target:
            actionableTarget.getAttribute("href") ||
            actionableTarget.getAttribute("data-href") ||
            actionableTarget.tagName.toLowerCase(),
        },
      })
    );
    return true;
  };

  const handleHandData = (msg: WorkerHandDataMessage) => {
    targetCursorXRef.current = clamp((1 - msg.x) * window.innerWidth, 0, window.innerWidth - 1);
    targetCursorYRef.current = clamp(msg.y * window.innerHeight, 0, window.innerHeight - 1);
    isPinchingRef.current = msg.isPinching;

    if (!handDetectedRef.current) {
      handDetectedRef.current = true;
      setHandDetected(true);
    }
  };

  const handleNoHand = () => {
    if (handDetectedRef.current) {
      handDetectedRef.current = false;
      setHandDetected(false);
    }
    isPinchingRef.current = false;
    prevPinchingRef.current = false;
    prevPinchYRef.current = 0;
    dispatchHover(null, currentCursorXRef.current, currentCursorYRef.current);
  };

  const postFrameToWorker = () => {
    const worker = workerRef.current;
    const video = videoRef.current;
    if (!worker || !video || !workerReadyRef.current || workerBusyRef.current) return;
    if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) return;

    const now = performance.now();
    if (now - lastDetectPostAtRef.current < 40) return;

    workerBusyRef.current = true;
    lastDetectPostAtRef.current = now;

    createImageBitmap(video)
      .then((bitmap) => {
        worker.postMessage(
          {
            type: "detect",
            frame: bitmap,
            timestamp: now,
          },
          [bitmap]
        );
      })
      .catch((err) => {
        workerBusyRef.current = false;
        setError(err instanceof Error ? err.message : "Failed to create frame bitmap.");
      });
  };

  const animateCursor = () => {
    if (!enabledRef.current) return;
    const dx = targetCursorXRef.current - currentCursorXRef.current;
    const dy = targetCursorYRef.current - currentCursorYRef.current;
    const distance = Math.hypot(dx, dy);
    const lerpFactor = distance < 12 ? 0.05 : 0.3;

    currentCursorXRef.current += dx * lerpFactor;
    currentCursorYRef.current += dy * lerpFactor;

    currentCursorXRef.current = clamp(currentCursorXRef.current, 0, window.innerWidth - 1);
    currentCursorYRef.current = clamp(currentCursorYRef.current, 0, window.innerHeight - 1);

    const cursor = cursorRef.current;
    const isPinching = isPinchingRef.current;
    let frameScrollDelta = 0;
    if (cursor) {
      cursor.style.transform = `translate(${currentCursorXRef.current}px, ${currentCursorYRef.current}px) scale(${isPinching ? 0.5 : 1})`;
      cursor.style.opacity = handDetectedRef.current ? "1" : "0.45";
      cursor.style.background = isPinching ? "#ff3b3b" : "white";
    }

    if (isPinching && !prevPinchingRef.current) {
      prevPinchYRef.current = currentCursorYRef.current;
      pinchStartYRef.current = currentCursorYRef.current;
      const smoother = ScrollSmoother.get() || navbarSmoother;
      initialScrollYRef.current = smoother ? smoother.scrollTop() : window.scrollY;
      const now = Date.now();
      if (now - lastClickAtRef.current > 250) {
        const x = Math.round(clamp(currentCursorXRef.current, 0, window.innerWidth - 1));
        const y = Math.round(clamp(currentCursorYRef.current, 0, window.innerHeight - 1));
        const target = resolveInteractionTarget(x, y);
        if (target) {
          triggerInteractionTarget(x, y, now);
        }
      }
    } else if (isPinching) {
      const frameDrag = currentCursorYRef.current - prevPinchYRef.current;
      prevPinchYRef.current = currentCursorYRef.current;
      frameScrollDelta = -frameDrag * 2.5;
      const dragDistance = currentCursorYRef.current - pinchStartYRef.current;
      const scrollTarget = initialScrollYRef.current - dragDistance * 2.5;
      const smoother = ScrollSmoother.get() || navbarSmoother;
      if (smoother) {
        smoother.scrollTop(scrollTarget);
        ScrollTrigger.update();
      } else {
        window.scrollTo({ top: scrollTarget, behavior: "instant" as ScrollBehavior });
      }
    }

    if (handDetectedRef.current && !isPinching) {
      const hoverEl = resolveInteractionTarget(currentCursorXRef.current, currentCursorYRef.current);
      dispatchHover(hoverEl, currentCursorXRef.current, currentCursorYRef.current);
    } else {
      dispatchHover(null, currentCursorXRef.current, currentCursorYRef.current);
    }

    prevPinchingRef.current = isPinching;
    if (!isPinching) {
      prevPinchYRef.current = currentCursorYRef.current;
    }

    window.dispatchEvent(
      new CustomEvent("gesture-cursor", {
        detail: {
          x: currentCursorXRef.current,
          y: currentCursorYRef.current,
          isPinching,
          scrollDelta: frameScrollDelta,
          active: enabledRef.current,
        },
      })
    );

    cursorRafIdRef.current = window.requestAnimationFrame(animateCursor);
  };

  const animateWorker = () => {
    if (!enabledRef.current) return;
    postFrameToWorker();
    workerRafIdRef.current = window.requestAnimationFrame(animateWorker);
  };

  const initWorker = () => {
    if (workerRef.current) return;

    const worker = new Worker(new URL("../workers/handLandmarker.worker.js", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;

      if (msg.type === "ready") {
        workerReadyRef.current = true;
        if (enabledRef.current) {
          document.body.classList.add("gesture-mode-active");
        }
        return;
      }

      if (msg.type === "error") {
        workerBusyRef.current = false;
        setError(msg.message || "Hand worker error");
        return;
      }

      if (msg.type === "HAND_DATA") {
        workerBusyRef.current = false;
        handleHandData(msg);
        return;
      }

      if (msg.type === "NO_HAND") {
        workerBusyRef.current = false;
        handleNoHand();
      }
    };

    worker.postMessage({
      type: "init",
      wasmRoots: ["https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"],
      modelUrls: [
        "/mediapipe/hand_landmarker.task",
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      ],
      runningMode: "VIDEO",
      numHands: 1,
    });

    workerRef.current = worker;
  };

  const enable = async () => {
    if (starting || enabled) return;
    setError("");
    setStarting(true);

    try {
      let stream: MediaStream;
      try {
        stream = await startMindARCamera();
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: false,
        });
      }

      streamRef.current = stream;
      workerReadyRef.current = false;
      initWorker();

      const video = videoRef.current;
      if (!video) throw new Error("Camera element not found.");

      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();

      enabledRef.current = true;
      setEnabled(true);
      setStarting(false);

      if (workerReadyRef.current) {
        document.body.classList.add("gesture-mode-active");
      }

      const centerX = window.innerWidth * 0.5;
      const centerY = window.innerHeight * 0.5;

      currentCursorXRef.current = centerX;
      currentCursorYRef.current = centerY;
      targetCursorXRef.current = centerX;
      targetCursorYRef.current = centerY;

      workerBusyRef.current = false;
      lastDetectPostAtRef.current = 0;
      lastClickAtRef.current = 0;
      isPinchingRef.current = false;
      prevPinchingRef.current = false;
      prevPinchYRef.current = 0;
      pinchStartYRef.current = 0;
      initialScrollYRef.current = 0;
      handDetectedRef.current = false;

      document.documentElement.classList.add("gesture-ar-mode");
      document.body.classList.add("gesture-ar-mode");
      document.getElementById("root")?.classList.add("gesture-ar-mode");

      if (navbarSmoother) navbarSmoother.paused(false);
      cursorRafIdRef.current = window.requestAnimationFrame(animateCursor);
      workerRafIdRef.current = window.requestAnimationFrame(animateWorker);
    } catch (err) {
      setStarting(false);
      setEnabled(false);
      enabledRef.current = false;
      setError(err instanceof Error ? err.message : "Unable to start camera mode.");
    }
  };

  const disable = () => {
    enabledRef.current = false;

    document.documentElement.classList.remove("gesture-ar-mode");
    document.body.classList.remove("gesture-ar-mode");
    document.body.classList.remove("gesture-mode-active");
    document.getElementById("root")?.classList.remove("gesture-ar-mode");

    setEnabled(false);
    setHandDetected(false);
    handDetectedRef.current = false;

    resetVirtualInteraction();
    workerBusyRef.current = false;
    workerReadyRef.current = false;

    if (cursorRafIdRef.current !== null) {
      window.cancelAnimationFrame(cursorRafIdRef.current);
      cursorRafIdRef.current = null;
    }
    if (workerRafIdRef.current !== null) {
      window.cancelAnimationFrame(workerRafIdRef.current);
      workerRafIdRef.current = null;
    }

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    const mediaStream = videoRef.current?.srcObject as MediaStream | null;
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    void stopMindARCamera();

    const centerX = window.innerWidth * 0.5;
    const centerY = window.innerHeight * 0.5;
    currentCursorXRef.current = centerX;
    currentCursorYRef.current = centerY;
    targetCursorXRef.current = centerX;
    targetCursorYRef.current = centerY;

    window.dispatchEvent(
      new CustomEvent("gesture-cursor", {
        detail: { active: false },
      })
    );
  };

  useEffect(() => {
    return () => {
      disable();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      document.documentElement.classList.remove("gesture-ar-mode");
      document.body.classList.remove("gesture-ar-mode");
      document.body.classList.remove("gesture-mode-active");
      document.getElementById("root")?.classList.remove("gesture-ar-mode");
    };
  }, []);

  return (
    <>
      <div className="gesture-overlay-root" style={{ pointerEvents: "none" }}>
        <video
          ref={videoRef}
          className={`gesture-overlay-camera ${enabled ? "gesture-overlay-camera-active" : ""}`}
          style={{ pointerEvents: "none" }}
          aria-hidden
        />
        <div
          id="virtual-cursor"
          ref={cursorRef}
          className={`gesture-overlay-cursor ${enabled ? "visible" : ""}`}
          style={{
            position: "fixed",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "white",
            pointerEvents: "none",
            zIndex: 9999,
          }}
          aria-hidden
        />
      </div>

      <div className="gesture-overlay-ui-layer">
        <button
          type="button"
          className="gesture-overlay-toggle"
          onClick={() => {
            if (enabled) disable();
            else void enable();
          }}
          data-gesture-ui
        >
          {starting
            ? "Opening Immersive View..."
            : enabled
              ? "Disable Camera Magic"
              : "Explore The Magic With Your Camera"}
        </button>

        {enabled ? (
          <div className="gesture-overlay-status" data-gesture-ui>
            {handDetected
              ? "Hand detected: point to explore, pinch to click and scroll."
              : "Raise one hand to begin immersive controls."}
          </div>
        ) : null}

        {error ? (
          <div className="gesture-overlay-error" data-gesture-ui>
            {error}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default GestureControlOverlay;
