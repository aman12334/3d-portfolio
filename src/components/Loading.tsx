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
      }, 1200);
      return () => window.clearTimeout(doneTimer);
    }, 500);

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
        }, 850);
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

  let interval = setInterval(() => {
    if (percent <= 50) {
      const rand = Math.round(Math.random() * 5);
      percent += rand;
      setLoading(percent);
    } else {
      clearInterval(interval);
      interval = setInterval(() => {
        percent += Math.round(Math.random());
        setLoading(percent);
        if (percent > 91) {
          clearInterval(interval);
        }
      }, 2000);
    }
  }, 100);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      clearInterval(interval);
      interval = setInterval(() => {
        if (percent < 100) {
          percent++;
          setLoading(percent);
        } else {
          resolve(percent);
          clearInterval(interval);
        }
      }, 2);
    });
  }

  return { loaded, percent, clear };
};
