import { useEffect, useRef, useState } from "react";
import "./styles/CameraMusic.css";

type HandPoint = { x: number; y: number; z: number };

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const distance = (a: HandPoint, b: HandPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const A3 = 220;
const MAJOR_PENTATONIC_STEPS = [0, 2, 4, 7, 9];
const OCTAVES = 3;

const noteFreqFromIndex = (index: number) => {
  const safeIndex = clamp(index, 0, MAJOR_PENTATONIC_STEPS.length * OCTAVES - 1);
  const octave = Math.floor(safeIndex / MAJOR_PENTATONIC_STEPS.length);
  const step = MAJOR_PENTATONIC_STEPS[safeIndex % MAJOR_PENTATONIC_STEPS.length];
  const semitones = step + octave * 12;
  return A3 * Math.pow(2, semitones / 12);
};

const CameraMusic = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handTrackerRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const subOscillatorRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoDepthRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const meterTimeRef = useRef(0);

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [volumeUi, setVolumeUi] = useState(0);
  const [tremoloUi, setTremoloUi] = useState(0);

  useEffect(() => {
    return () => {
      cleanupCamera();
      stopSynth();
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
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraEnabled(false);
  };

  const stopSynth = () => {
    try {
      oscillatorRef.current?.stop();
      subOscillatorRef.current?.stop();
      lfoRef.current?.stop();
    } catch {
      // Safe no-op if already stopped.
    }
    oscillatorRef.current?.disconnect();
    subOscillatorRef.current?.disconnect();
    lfoRef.current?.disconnect();
    masterGainRef.current?.disconnect();
    lfoDepthRef.current?.disconnect();
    filterRef.current?.disconnect();
    oscillatorRef.current = null;
    subOscillatorRef.current = null;
    lfoRef.current = null;
    masterGainRef.current = null;
    lfoDepthRef.current = null;
    filterRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setAudioEnabled(false);
    setVolumeUi(0);
    setTremoloUi(0);
  };

  const startSynth = async () => {
    if (audioEnabled) return;
    const context = new AudioContext();
    await context.resume();

    const osc = context.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = A3;

    const subOsc = context.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.value = A3 / 2;

    const masterGain = context.createGain();
    masterGain.gain.value = 0.02;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.9;

    const lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 3;

    const lfoDepth = context.createGain();
    lfoDepth.gain.value = 0.02;

    lfo.connect(lfoDepth);
    lfoDepth.connect(masterGain.gain);
    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(context.destination);

    osc.start();
    subOsc.start();
    lfo.start();

    audioContextRef.current = context;
    oscillatorRef.current = osc;
    subOscillatorRef.current = subOsc;
    masterGainRef.current = masterGain;
    lfoRef.current = lfo;
    lfoDepthRef.current = lfoDepth;
    filterRef.current = filter;
    setAudioEnabled(true);
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
          numHands: 1,
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

  const applyAudioMapping = (landmarks?: HandPoint[]) => {
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    const lfo = lfoRef.current;
    const lfoDepth = lfoDepthRef.current;
    const osc = oscillatorRef.current;
    const subOsc = subOscillatorRef.current;
    const filter = filterRef.current;
    if (!context || !masterGain || !lfo || !lfoDepth || !osc || !subOsc || !filter) {
      return;
    }

    if (!landmarks || landmarks.length < 9) {
      masterGain.gain.setTargetAtTime(0.005, context.currentTime, 0.06);
      if (performance.now() - meterTimeRef.current > 80) {
        setVolumeUi(0);
        setTremoloUi(0);
        meterTimeRef.current = performance.now();
      }
      return;
    }

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const openness = distance(thumbTip, indexTip);

    const volume = clamp((openness - 0.02) / 0.2, 0, 1);
    const tremoloRate = 1.5 + (1 - clamp(indexTip.y, 0, 1)) * 7;
    const noteCount = MAJOR_PENTATONIC_STEPS.length * OCTAVES;
    const noteIndex = Math.round(clamp(indexTip.x, 0, 1) * (noteCount - 1));
    const pitch = noteFreqFromIndex(noteIndex);

    const baseGain = 0.012 + volume * 0.16;
    const tremDepth = 0.004 + volume * 0.04;
    const cutoff = 900 + (1 - clamp(indexTip.y, 0, 1)) * 1900;

    masterGain.gain.setTargetAtTime(baseGain, context.currentTime, 0.04);
    lfo.frequency.setTargetAtTime(tremoloRate, context.currentTime, 0.05);
    lfoDepth.gain.setTargetAtTime(tremDepth, context.currentTime, 0.06);
    osc.frequency.setTargetAtTime(pitch, context.currentTime, 0.03);
    subOsc.frequency.setTargetAtTime(pitch / 2, context.currentTime, 0.05);
    filter.frequency.setTargetAtTime(cutoff, context.currentTime, 0.07);

    if (performance.now() - meterTimeRef.current > 80) {
      setVolumeUi(volume);
      setTremoloUi(tremoloRate / 8.5);
      meterTimeRef.current = performance.now();
    }
  };

  const runTrackingLoop = () => {
    const video = videoRef.current;
    if (!video || !handTrackerRef.current) return;

    const now = performance.now();
    const result = handTrackerRef.current.detectForVideo(video, now);
    const points = result?.landmarks?.[0] as HandPoint[] | undefined;

    drawLandmarks(points);
    applyAudioMapping(points);
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
      setStatus("Camera active. Tracking hand landmarks.");

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

  return (
    <section className="camera-music-section" id="camera-music">
      <div className="camera-music-container section-container">
        <h2>
          Mindpipe Jam <span>Lab</span>
        </h2>
        <p>
          Enable camera, then move your hand to control sound.
          <br />
          Thumb + index distance controls volume, vertical motion controls
          tremolo, and horizontal motion moves across a musical scale.
        </p>

        <div className="camera-music-controls">
          <button onClick={enableCamera} disabled={cameraEnabled}>
            {cameraEnabled ? "Camera Enabled" : "Enable Camera"}
          </button>
          <button onClick={startSynth} disabled={audioEnabled}>
            {audioEnabled ? "Synth Running" : "Start Synth"}
          </button>
          <button onClick={stopSynth} disabled={!audioEnabled}>
            Stop Synth
          </button>
        </div>

        {error && <div className="camera-music-error">{error}</div>}
        {!error && <div className="camera-music-status">{status}</div>}

        <div className="camera-music-stage">
          <video ref={videoRef} muted playsInline className="camera-music-video" />
          <canvas ref={canvasRef} className="camera-music-canvas" />
          {!cameraEnabled && (
            <div className="camera-music-overlay">
              Camera preview will appear here once enabled.
            </div>
          )}
        </div>

        <div className="camera-music-meters">
          <div className="meter">
            <span>Volume</span>
            <div className="meter-bar">
              <i style={{ transform: `scaleX(${volumeUi || 0})` }} />
            </div>
          </div>
          <div className="meter">
            <span>Tremolo</span>
            <div className="meter-bar">
              <i style={{ transform: `scaleX(${tremoloUi || 0})` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CameraMusic;
