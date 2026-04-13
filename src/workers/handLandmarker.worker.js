import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// MediaPipe task loader may call self.import(...) inside worker contexts.
// Vite module workers don't expose this by default, so provide a safe shim.
// IMPORTANT: MediaPipe expects global ModuleFactory side-effects from loader scripts.
// Using dynamic `import(url)` does not provide that reliably in module workers.
if (typeof self.import !== "function") {
  self.import = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load worker dependency: ${url} (${response.status})`);
    }

    const source = await response.text();
    // Execute as global script so `ModuleFactory` is created on `self`.
    (0, eval)(`${source}\n//# sourceURL=${url}`);
  };
}

/** @type {HandLandmarker | null} */
let handLandmarker = null;
let initialized = false;
let pinchActive = false;
let fistActive = false;
let frameCounter = 0;

const postWorkerError = (message) => {
  self.postMessage({ type: "error", message });
};

const initHandLandmarker = async (
  wasmRoots = [],
  modelUrls = [],
  numHands = 1,
  runningMode = "VIDEO",
  minHandDetectionConfidence = 0.35,
  minTrackingConfidence = 0.35
) => {
  let vision = null;
  let lastErr = null;

  for (const root of wasmRoots) {
    try {
      // eslint-disable-next-line no-await-in-loop
      vision = await FilesetResolver.forVisionTasks(root);
      if (vision) break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!vision) {
    throw new Error(
      `Unable to initialize MediaPipe wasm assets${lastErr instanceof Error ? `: ${lastErr.message}` : ""}`
    );
  }

  let created = null;
  let createErr = null;

  for (const modelAssetPath of modelUrls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      created = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath, delegate: "CPU" },
        runningMode,
        numHands,
        minHandDetectionConfidence,
        minTrackingConfidence,
      });
      if (created) break;
    } catch (err) {
      createErr = err;
    }
  }

  if (!created) {
    throw new Error(
      `Unable to load hand landmarker model${createErr instanceof Error ? `: ${createErr.message}` : ""}`
    );
  }

  handLandmarker = created;
  initialized = true;
};

self.onmessage = async (event) => {
  const msg = event.data;

  try {
    if (msg?.type === "init") {
      await initHandLandmarker(
        msg.wasmRoots || [],
        msg.modelUrls || [],
        msg.numHands || 1,
        msg.runningMode || "VIDEO",
        msg.minHandDetectionConfidence ?? 0.5,
        msg.minTrackingConfidence ?? 0.5
      );
      self.postMessage({ type: "ready" });
      return;
    }

    if (msg?.type !== "detect") return;

    if (!initialized || !handLandmarker) {
      postWorkerError("Hand worker not initialized yet.");
      return;
    }

    const { frame, timestamp } = msg;
    if (!frame) {
      self.postMessage({ type: "NO_HAND" });
      return;
    }
    const ts = typeof timestamp === "number" ? timestamp : performance.now();
    const result = handLandmarker.detectForVideo(frame, ts);
    if (typeof frame.close === "function") {
      frame.close();
    }

    const firstHand = result?.landmarks?.[0];
    if (!firstHand?.length) {
      pinchActive = false;
      fistActive = false;
      self.postMessage({ type: "NO_HAND" });
      return;
    }

    const wrist = firstHand[0];
    const thumbTip = firstHand[4];
    const indexMcp = firstHand[5];
    const indexPip = firstHand[6];
    const indexTip = firstHand[8];
    const middleMcp = firstHand[9];
    const middlePip = firstHand[10];
    const middleTip = firstHand[12];
    const ringMcp = firstHand[13];
    const ringPip = firstHand[14];
    const ringTip = firstHand[16];
    const pinkyMcp = firstHand[17];
    const pinkyPip = firstHand[18];
    const pinkyTip = firstHand[20];
    if (
      !wrist ||
      !thumbTip ||
      !indexMcp ||
      !indexPip ||
      !indexTip ||
      !middleMcp ||
      !middlePip ||
      !middleTip ||
      !ringMcp ||
      !ringPip ||
      !ringTip ||
      !pinkyMcp ||
      !pinkyPip ||
      !pinkyTip
    ) {
      pinchActive = false;
      fistActive = false;
      self.postMessage({ type: "NO_HAND" });
      return;
    }

    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = thumbTip.z - indexTip.z;
    const pinchDistance = Math.hypot(dx, dy, dz);
    frameCounter += 1;
    if (frameCounter % 60 === 0) {
      console.log("Pinch Distance:", pinchDistance);
    }

    // Make pinch activation a little more forgiving on laptop webcams while
    // still keeping enough hysteresis to avoid rapid accidental toggles.
    pinchActive = pinchActive ? pinchDistance < 0.11 : pinchDistance < 0.085;

    const handSpan = Math.hypot(
      indexMcp.x - pinkyMcp.x,
      indexMcp.y - pinkyMcp.y,
      indexMcp.z - pinkyMcp.z
    );
    const isFingerCurled = (tip, pip, mcp) => {
      const tipToWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z);
      const mcpToWrist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y, mcp.z - wrist.z);
      return tip.y > pip.y && tipToWrist < mcpToWrist * 1.12;
    };
    const curledCount = [
      isFingerCurled(indexTip, indexPip, indexMcp),
      isFingerCurled(middleTip, middlePip, middleMcp),
      isFingerCurled(ringTip, ringPip, ringMcp),
      isFingerCurled(pinkyTip, pinkyPip, pinkyMcp),
    ].filter(Boolean).length;
    const thumbToPalm = Math.hypot(
      thumbTip.x - indexMcp.x,
      thumbTip.y - indexMcp.y,
      thumbTip.z - indexMcp.z
    );
    const fistDetected =
      curledCount >= 4 && handSpan < 0.24 && thumbToPalm < Math.max(0.16, handSpan * 0.95);
    fistActive = fistActive ? fistDetected : curledCount >= 4 && handSpan < 0.22;

    self.postMessage({
      type: "HAND_DATA",
      x: indexTip.x,
      y: indexTip.y,
      isPinching: pinchActive,
      isFist: fistActive,
    });
  } catch (err) {
    postWorkerError(err instanceof Error ? err.message : "Unknown worker error");
  }
};
