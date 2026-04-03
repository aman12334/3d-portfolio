import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";

interface Marker {
  id: string;
  location: [number, number];
}

interface Arc {
  id: string;
  from: [number, number];
  to: [number, number];
}

interface GlobeProps {
  markers?: Marker[];
  arcs?: Arc[];
  className?: string;
  markerColor?: [number, number, number];
  baseColor?: [number, number, number];
  arcColor?: [number, number, number];
  glowColor?: [number, number, number];
  dark?: number;
  mapBrightness?: number;
  markerSize?: number;
  markerElevation?: number;
  arcWidth?: number;
  arcHeight?: number;
  speed?: number;
  theta?: number;
  diffuse?: number;
  mapSamples?: number;
  initialPhi?: number;
  interactive?: boolean;
  animateFlight?: boolean;
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0.19, 0.43, 0.71],
  baseColor = [1, 1, 1],
  arcColor = [0.2, 0.51, 0.84],
  glowColor = [0.95, 0.96, 0.98],
  dark = 0.07,
  mapBrightness = 2.6,
  markerSize = 0.12,
  markerElevation = 0.08,
  arcWidth = 0.9,
  arcHeight = 0.24,
  speed = 0.006,
  theta = 0.3,
  diffuse = 1.25,
  mapSamples = 15000,
  initialPhi = 0,
  interactive = true,
  animateFlight = true,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const velocity = useRef({ phi: 0, theta: 0 });
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const isPausedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!interactive) return;
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
    isPausedRef.current = true;
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!interactive) return;
    if (!pointerInteracting.current) return;

    const deltaX = e.clientX - pointerInteracting.current.x;
    const deltaY = e.clientY - pointerInteracting.current.y;
    dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 };

    const now = Date.now();
    if (lastPointer.current) {
      const dt = Math.max(now - lastPointer.current.t, 1);
      const maxVelocity = 0.14;
      velocity.current = {
        phi: Math.max(
          -maxVelocity,
          Math.min(maxVelocity, ((e.clientX - lastPointer.current.x) / dt) * 0.3)
        ),
        theta: Math.max(
          -maxVelocity,
          Math.min(maxVelocity, ((e.clientY - lastPointer.current.y) / dt) * 0.08)
        ),
      };
    }
    lastPointer.current = { x: e.clientX, y: e.clientY, t: now };
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!interactive) return;
    if (pointerInteracting.current) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
      lastPointer.current = null;
    }
    pointerInteracting.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab";
    }
    isPausedRef.current = false;
  }, [interactive]);

  useEffect(() => {
    if (!interactive) return;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp, interactive]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let phi = initialPhi;
    let flightT = 0;

    const interpolatedFlightLocation = () => {
      if (!arcs.length) return null;
      const arc = arcs[0];
      const t = flightT;
      const lat = arc.from[0] + (arc.to[0] - arc.from[0]) * t;
      const lon = arc.from[1] + (arc.to[1] - arc.from[1]) * t;
      return [lat, lon] as [number, number];
    };

    const markersForFrame = () => {
      const baseMarkers = markers.map((m) => ({
        location: m.location,
        size: markerSize * 0.55,
      }));

      if (!animateFlight) return baseMarkers;
      const moving = interpolatedFlightLocation();
      if (!moving) return baseMarkers;
      return [...baseMarkers, { location: moving, size: markerSize * 1.9 }];
    };

    const init = () => {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width,
        height: width,
        phi: initialPhi,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markersForFrame(),
        arcs: arcs.map((a) => ({
          from: a.from,
          to: a.to,
        })),
        arcColor,
        arcWidth,
        arcHeight,
      });

      const animate = () => {
        if (!globe) return;

        if (!isPausedRef.current) {
          phi += speed;
          if (animateFlight) {
            flightT = (flightT + 0.0065) % 1;
          }
          if (
            Math.abs(velocity.current.phi) > 0.0001 ||
            Math.abs(velocity.current.theta) > 0.0001
          ) {
            phiOffsetRef.current += velocity.current.phi;
            thetaOffsetRef.current += velocity.current.theta;
            velocity.current.phi *= 0.95;
            velocity.current.theta *= 0.95;
          }

          const thetaMin = -0.42;
          const thetaMax = 0.42;
          if (thetaOffsetRef.current < thetaMin) {
            thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1;
          } else if (thetaOffsetRef.current > thetaMax) {
            thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1;
          }
        }

        globe.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
          dark,
          mapBrightness,
          markerColor,
          baseColor,
          arcColor,
          markerElevation,
          markers: markersForFrame(),
          arcs: arcs.map((a) => ({
            from: a.from,
            to: a.to,
          })),
        });

        animationId = requestAnimationFrame(animate);
      };

      animate();
      setTimeout(() => {
        if (canvas) {
          canvas.style.opacity = "1";
        }
      }, 80);
    };

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObserver?.disconnect();
          init();
        }
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      if (globe) globe.destroy();
    };
  }, [
    arcs,
    arcColor,
    arcHeight,
    arcWidth,
    baseColor,
    dark,
    diffuse,
    glowColor,
    mapBrightness,
    mapSamples,
    markerColor,
    markerElevation,
    markers,
    markerSize,
    speed,
    theta,
    initialPhi,
    interactive,
    animateFlight,
  ]);

  return (
    <div className={`cobe-globe-wrap ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={interactive ? handlePointerDown : undefined}
        style={{
          width: "100%",
          height: "100%",
          cursor: interactive ? "grab" : "default",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
    </div>
  );
}
