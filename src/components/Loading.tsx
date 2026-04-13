import { useEffect, useMemo, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";
import { Globe } from "./ui/cobe-globe";

const typingText = "From Mumbai to Maryland - welcome to my journey.";

const MUMBAI: [number, number] = [19.076, 72.8777];
const MARYLAND: [number, number] = [39.0458, -76.6413];
const GLOBE_MARKER_COLOR: [number, number, number] = [0.18, 0.42, 0.7];
const GLOBE_BASE_COLOR: [number, number, number] = [0.98, 0.99, 1];
const GLOBE_ARC_COLOR: [number, number, number] = [0.06, 0.47, 0.96];
const GLOBE_GLOW_COLOR: [number, number, number] = [0.94, 0.96, 1];

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (percent < 100 || loaded) return;

    const loadedTimer = window.setTimeout(() => {
      setLoaded(true);
      const doneTimer = window.setTimeout(() => {
        setIsLoaded(true);
      }, 180);
      return () => window.clearTimeout(doneTimer);
    }, 90);

    return () => window.clearTimeout(loadedTimer);
  }, [percent, loaded]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTypedCount((prev) => {
        if (prev >= typingText.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 55);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    import("./utils/initialFX").then((module) => {
      if (isLoaded) {
        setClicked(true);
        setTimeout(() => {
          if (module.initialFX) {
            module.initialFX();
          }
          setIsLoading(false);
        }, 140);
      }
    });
  }, [isLoaded, setIsLoading]);

  const markers = useMemo(
    () => [
      { id: "mumbai", location: MUMBAI },
      { id: "maryland", location: MARYLAND },
    ],
    []
  );

  const arcs = useMemo(
    () => [
      {
        id: "mumbai-to-maryland",
        from: MUMBAI,
        to: MARYLAND,
      },
    ],
    []
  );

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          Aman Tiwari
        </a>
      </div>

      <div
        className={`loading-screen loading-screen-globe ${
          clicked ? "loading-screen-globe-out" : ""
        }`}
      >
        <div className="loading-globe-shell">
          <Globe
            markers={markers}
            arcs={arcs}
            markerColor={GLOBE_MARKER_COLOR}
            baseColor={GLOBE_BASE_COLOR}
            arcColor={GLOBE_ARC_COLOR}
            glowColor={GLOBE_GLOW_COLOR}
            dark={0.06}
            mapBrightness={2.8}
            markerSize={0.045}
            markerElevation={0.045}
            arcWidth={1.25}
            arcHeight={0.24}
            speed={0.008}
            theta={0.2}
            initialPhi={0.16}
            diffuse={1.3}
            mapSamples={16000}
            interactive={false}
            animateFlight
            className="loading-globe"
          />
          <div className="loading-map-label loading-map-label-mumbai">Mumbai</div>
          <div className="loading-map-label loading-map-label-maryland">Maryland</div>

          <div className="loading-route-label">Mumbai → Maryland</div>

          <div className="loading-typed-line" aria-live="polite">
            {typingText.slice(0, typedCount)}
            <span className="loading-typed-caret" aria-hidden="true">
              |
            </span>
          </div>

          <div className="loading-progress-inline">Loading {percent}%</div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent = 0;
  let finished = false;

  const applyPercent = (next: number) => {
    percent = Math.max(0, Math.min(100, Math.round(next)));
    setLoading(percent);
  };

  const tick = () => {
    if (finished) return;
    if (percent < 40) applyPercent(percent + 4);
    else if (percent < 70) applyPercent(percent + 2);
    else if (percent < 90) applyPercent(percent + 1);
    else if (percent < 95) applyPercent(percent + 1);
  };

  let interval = window.setInterval(tick, 90);

  const stopTicker = () => {
    window.clearInterval(interval);
  };

  function clear() {
    finished = true;
    stopTicker();
    applyPercent(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      finished = true;
      stopTicker();
      interval = window.setInterval(() => {
        if (percent < 100) {
          applyPercent(percent + 1);
        } else {
          resolve(percent);
          stopTicker();
        }
      }, 14);
    });
  }

  return { loaded, percent, clear };
};
