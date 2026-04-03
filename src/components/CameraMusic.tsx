import { useEffect, useRef, useState } from "react";
import { smoother } from "./Navbar";
import "./styles/CameraMusic.css";

type HandPoint = { x: number; y: number; z: number };

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const distance = (a: HandPoint, b: HandPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

const BACKING_TRACKS = [
  {
    id: "opera-night",
    label: "Opera Night",
    src: "/audio/lumivexasset-opera-night-330358.mp3",
    bpm: 84,
  },
  {
    id: "moonlight-masquerade",
    label: "Moonlight Masquerade",
    src: "/audio/michael-foster-music-moonlight-masqueradeorchestral-opera-411239.mp3",
    bpm: 76,
  },
  {
    id: "latin-baroque",
    label: "Latin Baroque Prayer",
    src: "/audio/nickpanekaiassets-latin-baroque-morning-offering-prayer-opera-283031.mp3",
    bpm: 92,
  },
];

const DEFAULT_TRACK = BACKING_TRACKS[0];

const CameraMusic = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backingAudioRef = useRef<HTMLAudioElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handTrackerRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const beatGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const toneFilterRef = useRef<BiquadFilterNode | null>(null);
  const rhythmSchedulerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(0);
  const tempoBpmRef = useRef(BACKING_TRACKS[0].bpm);
  const baseTrackBpmRef = useRef(BACKING_TRACKS[0].bpm);
  const beatDepthRef = useRef(0.14);
  const prevTipRef = useRef<HandPoint | null>(null);
  const prevTipTimeRef = useRef(0);
  const meterTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const liveVolumeRef = useRef(0.65);
  const liveBeatRef = useRef(0.25);
  const liveToneRef = useRef(0.5);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [volumeUi, setVolumeUi] = useState(0.65);
  const [beatUi, setBeatUi] = useState(0.25);
  const [backingPlaying, setBackingPlaying] = useState(false);
  const [mindpipeActive, setMindpipeActive] = useState(false);
  const [toneUi, setToneUi] = useState(0.5);
  const [handDetected, setHandDetected] = useState(false);

  const setMindpipeVars = (volume: number, beat: number) => {
    const root = document.documentElement;
    const intensity = clamp(volume * 0.65 + beat * 0.35, 0, 1);
    root.style.setProperty("--mindpipe-volume", volume.toFixed(3));
    root.style.setProperty("--mindpipe-beat", beat.toFixed(3));
    root.style.setProperty("--mindpipe-intensity", intensity.toFixed(3));
  };

  const applyMix = (volume: number, beat: number, tone: number) => {
    const safeVolume = clamp(volume, 0, 1);
    const safeBeat = clamp(beat, 0, 1);
    const safeTone = clamp(tone, 0, 1);
    liveVolumeRef.current = safeVolume;
    liveBeatRef.current = safeBeat;
    liveToneRef.current = safeTone;

    const audio = backingAudioRef.current;
    if (audio) {
      const beatBpm = 58 + safeBeat * 128;
      const phase = (performance.now() / 1000) * ((beatBpm / 60) * Math.PI * 2);
      const pulseDepth = 0.12 + safeBeat * 0.58;
      const pulse = 1 - ((Math.sin(phase) + 1) / 2) * pulseDepth;
      const nextVolume = clamp((0.03 + Math.pow(safeVolume, 1.6) * 0.97) * pulse, 0, 1);
      const nextRate = clamp(0.62 + safeTone * 0.95 + safeBeat * 0.35, 0.55, 1.95);
      audio.muted = false;
      audio.volume = nextVolume;
      audio.playbackRate = nextRate;
      (audio as HTMLMediaElement & { preservesPitch?: boolean }).preservesPitch = false;
      (audio as HTMLMediaElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;
    }
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (context && masterGain) {
      const targetVolume = 0.03 + safeVolume * 0.97;
      masterGain.gain.setTargetAtTime(targetVolume, context.currentTime, 0.04);
    }
    const toneFilter = toneFilterRef.current;
    if (context && toneFilter) {
      const freq = 320 + safeTone * 7600;
      toneFilter.frequency.setTargetAtTime(freq, context.currentTime, 0.05);
      toneFilter.Q.setTargetAtTime(0.5 + safeBeat * 5.5, context.currentTime, 0.05);
    }
    const beatDepth = clamp(0.04 + safeBeat * 0.71, 0.04, 0.75);
    beatDepthRef.current = beatDepth;
    tempoBpmRef.current = clamp(
      baseTrackBpmRef.current - 8 + safeBeat * 16,
      Math.max(55, baseTrackBpmRef.current - 22),
      baseTrackBpmRef.current + 28
    );
    setMindpipeVars(safeVolume, safeBeat);
  };

  const resetMindpipeVars = () => {
    const root = document.documentElement;
    root.style.setProperty("--mindpipe-volume", "0");
    root.style.setProperty("--mindpipe-beat", "0");
    root.style.setProperty("--mindpipe-intensity", "0");
  };

  useEffect(() => {
    setMindpipeVars(volumeUi, beatUi);
    return () => {
      cleanupCamera();
      stopControls();
      stopBackingTrack();
      resetMindpipeVars();
    };
  }, []);

  const cleanupCamera = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    lastVideoTimeRef.current = -1;
    setCameraEnabled(false);
  };

  const stopBackingTrack = () => {
    const audio = backingAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setBackingPlaying(false);
  };

  const clearBeatScheduler = () => {
    if (rhythmSchedulerRef.current !== null) {
      window.clearInterval(rhythmSchedulerRef.current);
      rhythmSchedulerRef.current = null;
    }
  };

  const stopControls = () => {
    clearBeatScheduler();
    beatDepthRef.current = 0;
    beatIndexRef.current = 0;
    prevTipRef.current = null;
    prevTipTimeRef.current = 0;
    const beatGain = beatGainRef.current;
    const masterGain = masterGainRef.current;
    const context = audioContextRef.current;
    if (beatGain && context) {
      beatGain.gain.cancelScheduledValues(context.currentTime);
      beatGain.gain.setTargetAtTime(1, context.currentTime, 0.05);
    }
    if (masterGain && context) {
      masterGain.gain.setTargetAtTime(0.62, context.currentTime, 0.08);
    }
    setControlsEnabled(false);
    setBeatUi(0);
    applyMix(0.6, 0, 0.5);
    setMindpipeActive(false);
    setToneUi(0.5);
  };

  const ensureAudioEngine = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const context = audioContextRef.current;
    await context.resume();

    if (!masterGainRef.current) {
      const masterGain = context.createGain();
      masterGain.gain.value = 0.62;
      masterGainRef.current = masterGain;
    }
    if (!beatGainRef.current) {
      const beatGain = context.createGain();
      beatGain.gain.value = 1;
      beatGainRef.current = beatGain;
    }
    if (!compressorRef.current) {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 2;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.22;
      compressorRef.current = compressor;
    }
    if (!toneFilterRef.current) {
      const toneFilter = context.createBiquadFilter();
      toneFilter.type = "lowpass";
      toneFilter.frequency.value = 4200;
      toneFilter.Q.value = 0.8;
      toneFilterRef.current = toneFilter;
    }

    const audio = backingAudioRef.current;
    if (!audio) return null;

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = context.createMediaElementSource(audio);
      sourceNodeRef.current.connect(beatGainRef.current!);
      beatGainRef.current!.connect(toneFilterRef.current!);
      toneFilterRef.current!.connect(masterGainRef.current!);
      masterGainRef.current!.connect(compressorRef.current!);
      compressorRef.current!.connect(context.destination);
    }

    return context;
  };

  const startControls = async () => {
    if (controlsEnabled) return;
    baseTrackBpmRef.current = DEFAULT_TRACK.bpm;
    tempoBpmRef.current = DEFAULT_TRACK.bpm;
    beatDepthRef.current = 0.12;
    applyMix(volumeUi, beatUi, toneUi);
    setControlsEnabled(true);
    setStatus("Controls active: hand gestures drive volume, beat, and tone.");
  };

  const ensureTracker = async () => {
    if (handTrackerRef.current) return;
    const vision = await import("@mediapipe/tasks-vision");
    const wasmCdnCandidates = [
      "/mediapipe/wasm",
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      "https://unpkg.com/@mediapipe/tasks-vision@latest/wasm",
    ];

    let fileset: any = null;
    let lastError: unknown = null;
    for (const wasmRoot of wasmCdnCandidates) {
      try {
        fileset = await vision.FilesetResolver.forVisionTasks(wasmRoot);
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (!fileset) {
      throw new Error(
        `Unable to load MediaPipe WASM assets. Check network/CSP. ${String(lastError)}`
      );
    }

    const modelAssetCandidates = [
      "/mediapipe/hand_landmarker.task",
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    ];

    let tracker: any = null;
    let trackerError: unknown = null;
    for (const modelAssetPath of modelAssetCandidates) {
      try {
        tracker = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath },
          numHands: 2,
          minHandDetectionConfidence: 0.2,
          minHandPresenceConfidence: 0.2,
          minTrackingConfidence: 0.2,
          runningMode: "VIDEO",
        });
        break;
      } catch (err) {
        trackerError = err;
      }
    }

    if (!tracker) {
      throw new Error(
        `Unable to initialize hand tracker model. ${String(trackerError)}`
      );
    }
    handTrackerRef.current = tracker;
  };

  const drawLandmarks = (landmarks?: HandPoint[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    if (!landmarks) return;
    ctx.fillStyle = "#5eead4";
    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const applyGestureControls = (landmarks?: HandPoint[]) => {
    if (!mindpipeActive) return;

    if (!landmarks || landmarks.length < 2) {
      applyMix(liveVolumeRef.current, liveBeatRef.current, liveToneRef.current);
      if (performance.now() - meterTimeRef.current > 80) {
        meterTimeRef.current = performance.now();
      }
      return;
    }

    const thumbTip = landmarks[4] ?? landmarks[0];
    const indexTip = landmarks[8] ?? landmarks[1] ?? landmarks[0];
    const openness = distance(thumbTip, indexTip);

    // Make volume very obvious: raise hand up -> louder, lower -> softer.
    const volume = clamp((1 - indexTip.y - 0.15) / 0.7, 0, 1);

    const nowPerf = performance.now();
    const prevTip = prevTipRef.current;
    const prevTime = prevTipTimeRef.current || nowPerf;
    const deltaTime = Math.max((nowPerf - prevTime) / 1000, 0.016);
    let energy = 0;
    if (prevTip) {
      energy = clamp(distance(indexTip, prevTip) / deltaTime, 0, 6.4) / 6.4;
    }
    prevTipRef.current = indexTip;
    prevTipTimeRef.current = nowPerf;

    const lift = 1 - clamp(indexTip.y, 0, 1);
    const trackBpm = baseTrackBpmRef.current;
    const tempoBpm = clamp(
      trackBpm - 18 + lift * 32 + energy * 32,
      Math.max(55, trackBpm - 22),
      trackBpm + 36
    );
    const beatDepth = clamp(
      0.08 + lift * 0.36 + energy * 0.4 + openness * 0.35,
      0.04,
      0.85
    );

    tempoBpmRef.current = tempoBpm;
    beatDepthRef.current = beatDepth;
    const beatUiNext = clamp((beatDepth - 0.04) / 0.71, 0, 1);
    const tone = clamp((openness - 0.03) / 0.2, 0, 1);
    applyMix(volume, beatUiNext, tone);

    if (nowPerf - meterTimeRef.current > 80) {
      setVolumeUi(volume);
      setBeatUi(beatUiNext);
      setToneUi(tone);
      meterTimeRef.current = nowPerf;
    }

    const scrollIntent = clamp((0.5 - indexTip.y) * 3, -1, 1);
    const delta = scrollIntent * (20 + beatDepth * 30);
    if (Math.abs(delta) > 0.2) {
      if (window.innerWidth > 1024 && smoother) {
        const current = smoother.scrollTop();
        smoother.scrollTop(current + delta);
      } else {
        window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      }
    }
  };

  const runTrackingLoop = () => {
    const video = videoRef.current;
    if (!video || !handTrackerRef.current) return;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      setHandDetected(false);
      rafRef.current = window.requestAnimationFrame(runTrackingLoop);
      return;
    }
    if (video.currentTime === lastVideoTimeRef.current) {
      rafRef.current = window.requestAnimationFrame(runTrackingLoop);
      return;
    }
    lastVideoTimeRef.current = video.currentTime;
    const now = performance.now();
    const result = handTrackerRef.current.detectForVideo(video, now);
    const points = result?.landmarks?.[0] as HandPoint[] | undefined;
    setHandDetected(Boolean(points && points.length >= 2));
    drawLandmarks(points);
    applyGestureControls(points);
    rafRef.current = window.requestAnimationFrame(runTrackingLoop);
  };

  const enableCamera = async () => {
    try {
      setError("");
      setStatus("Loading hand tracker...");
      await ensureTracker();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera API unavailable. Use HTTPS (or localhost) and a supported browser."
        );
      }

      setStatus("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 960, height: 540, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCameraEnabled(true);
      setStatus("Camera active. Use hand to control volume and beats.");

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = window.requestAnimationFrame(runTrackingLoop);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus("Failed");
      setError(message);
    }
  };

  const playBackingTrack = async () => {
    const audio = backingAudioRef.current;
    if (!audio) return;
    const context = await ensureAudioEngine();
    if (context) {
      await context.resume();
    }
    if (!audio.paused) {
      setBackingPlaying(true);
      return;
    }
    try {
      await audio.play();
      setBackingPlaying(true);
    } catch (err) {
      console.error(err);
      setBackingPlaying(false);
    }
  };

  const startMindpipe = async () => {
    try {
      setError("");
      setMindpipeActive(true);
      if (smoother) smoother.paused(false);
      const context = await ensureAudioEngine();
      if (context) {
        await context.resume();
      }
      await playBackingTrack();
      if (!controlsEnabled) {
        await startControls();
      } else {
        applyMix(volumeUi, beatUi, toneUi);
      }
      if (!cameraEnabled) {
        await enableCamera();
      }
      setStatus("Mindpipe live. Show one hand clearly in camera frame.");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus("Failed");
      setMindpipeActive(false);
    }
  };

  return (
    <section className="camera-music-panel" id="camera-music">
      <div className="camera-music-shell">
        <h3>Mindpipe Opera</h3>
        <button onClick={startMindpipe} className="camera-music-start">
          {mindpipeActive ? "Mindpipe Active" : "Enable Camera & Play"}
        </button>

        <p className="camera-music-instructions-title">Gesture guide</p>
        <p className="camera-music-instructions">
          Raise hand up for louder sound, lower for softer sound.
          <br />
          Move faster to energize the beat.
          <br />
          Open hand wider (thumb-index gap) to brighten tone.
          <br />
          Hold hand high to scroll up, low to scroll down.
        </p>

        {error && <div className="camera-music-error">{error}</div>}
        {!error && (
          <div className="camera-music-status">
            {status}
            <br />
            Backing: {DEFAULT_TRACK.label} ({DEFAULT_TRACK.bpm} BPM)
            <br />
            Cam: {cameraEnabled ? "on" : "off"} | Ctrl: {controlsEnabled ? "on" : "off"}
          </div>
        )}

        <div className="camera-music-stage">
          <video ref={videoRef} muted playsInline className="camera-music-video" />
          <canvas ref={canvasRef} className="camera-music-canvas" />
          {!cameraEnabled && (
            <div className="camera-music-overlay">
              Camera preview will appear here once enabled.
            </div>
          )}
        </div>
        <div className="camera-music-mini-meters">
          <span>{handDetected ? "Hand detected" : "No hand detected"}</span>
          <span>Vol {Math.round(volumeUi * 100)}%</span>
          <span>Beat {Math.round(beatUi * 100)}%</span>
          <span>Tone {Math.round(toneUi * 100)}%</span>
          <span>{backingPlaying ? "Playing" : "Paused"}</span>
        </div>

        <audio
          ref={backingAudioRef}
          src={DEFAULT_TRACK.src}
          preload="metadata"
          loop
          onEnded={() => setBackingPlaying(false)}
          style={{ display: "none" }}
        />
      </div>
    </section>
  );
};

export default CameraMusic;
