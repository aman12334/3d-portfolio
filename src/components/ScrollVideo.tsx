import { useEffect, useRef, useState } from "react";
import "./styles/ScrollVideo.css";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const ScrollVideo = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      video.pause();
    };

    const onError = () => setHasError(true);
    const keepPaused = () => video.pause();

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("error", onError);
    video.addEventListener("play", keepPaused);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("error", onError);
      video.removeEventListener("play", keepPaused);
    };
  }, []);

  useEffect(() => {
    const updateFrame = () => {
      rafRef.current = null;
      const section = sectionRef.current;
      const video = videoRef.current;
      if (!section || !video || !duration) return;

      const rect = section.getBoundingClientRect();
      const totalScrollable = Math.max(rect.height - window.innerHeight, 1);
      const scrolledInsideSection = clamp(-rect.top, 0, totalScrollable);
      const nextProgress = scrolledInsideSection / totalScrollable;
      const nextTime = nextProgress * duration;

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${nextProgress || 0})`;
      }
      if (Math.abs(video.currentTime - nextTime) > 0.02) {
        video.currentTime = nextTime;
      }
    };

    const scheduleUpdate = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(updateFrame);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [duration]);

  return (
    <section className="scroll-video-section" ref={sectionRef}>
      <div className="scroll-video-head section-container">
        <h2>
          Scroll <span>Video</span>
        </h2>
        <p>Scroll down to play this video frame by frame.</p>
      </div>
      <div className="scroll-video-sticky">
        {hasError ? (
          <div className="scroll-video-fallback">
            Add your video at <code>public/videos/scroll-video.mp4</code>
          </div>
        ) : (
          <video
            ref={videoRef}
            src="/videos/scroll-video.mp4"
            className="scroll-video-player"
            muted
            playsInline
            preload="auto"
          />
        )}
        <div className="scroll-video-progress">
          <span ref={progressRef} />
        </div>
      </div>
    </section>
  );
};

export default ScrollVideo;
