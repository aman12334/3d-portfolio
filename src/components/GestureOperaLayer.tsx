import { useEffect, useRef } from "react";

type GestureCursorDetail = {
  x?: number;
  y?: number;
  active?: boolean;
  isPinching?: boolean;
  scrollDelta?: number;
};

const TRACKS = [
  "/audio/michael-foster-music-moonlight-masqueradeorchestral-opera-411239.mp3",
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const lerp = (from: number, to: number, factor: number) => from + (to - from) * factor;

const GestureOperaLayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(Math.floor(Math.random() * TRACKS.length));
  const volumeRef = useRef(0.08);
  const toneRef = useRef(0.9);
  const liveRef = useRef(false);

  useEffect(() => {
    const shutdownAudio = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
      liveRef.current = false;
      volumeRef.current = 0.08;
      toneRef.current = 0.9;
    };

    const ensureAudio = () => {
      if (audioRef.current) return audioRef.current;
      const audio = new Audio(TRACKS[trackIndexRef.current]);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = volumeRef.current;
      audio.playbackRate = toneRef.current;
      audioRef.current = audio;
      return audio;
    };

    const onGestureCursor = (event: Event) => {
      const detail = (event as CustomEvent<GestureCursorDetail>).detail;
      const active = Boolean(detail?.active);

      if (!active) {
        shutdownAudio();
        return;
      }

      const audio = ensureAudio();
      if (!liveRef.current || audio.paused) {
        liveRef.current = true;
        void audio.play().catch(() => {});
      }

      const yNorm = clamp(1 - (detail?.y ?? window.innerHeight * 0.5) / window.innerHeight, 0, 1);
      const xNorm = clamp((detail?.x ?? window.innerWidth * 0.5) / window.innerWidth, 0, 1);
      const scrollEnergy = clamp(Math.abs(detail?.scrollDelta ?? 0) / 24, 0, 1);
      const pinchBoost = detail?.isPinching ? 0.08 : 0;

      const targetVolume = clamp(0.07 + yNorm * 0.65 + scrollEnergy * 0.22 + pinchBoost, 0.04, 1);
      const targetTone = clamp(0.72 + xNorm * 0.48 + scrollEnergy * 0.28, 0.65, 1.85);
      volumeRef.current = lerp(volumeRef.current, targetVolume, 0.18);
      toneRef.current = lerp(toneRef.current, targetTone, 0.16);

      audio.volume = volumeRef.current;
      audio.playbackRate = toneRef.current;
    };

    const onGestureClick = (_event: Event) => {
      const audioEl = audioRef.current;
      if (!audioEl) return;

      const prevRate = audioEl.playbackRate;
      const prevVolume = audioEl.volume;
      audioEl.playbackRate = clamp(prevRate + 0.2, 0.65, 2);
      audioEl.volume = clamp(prevVolume + 0.16, 0.04, 1);

      window.setTimeout(() => {
        const current = audioRef.current;
        if (!current) return;
        current.playbackRate = prevRate;
        current.volume = clamp(prevVolume, 0.04, 1);
      }, 180);
    };

    window.addEventListener("gesture-cursor", onGestureCursor as EventListener);
    window.addEventListener("gesture-click", onGestureClick as EventListener);

    return () => {
      window.removeEventListener("gesture-cursor", onGestureCursor as EventListener);
      window.removeEventListener("gesture-click", onGestureClick as EventListener);
      shutdownAudio();
    };
  }, []);

  return null;
};

export default GestureOperaLayer;
