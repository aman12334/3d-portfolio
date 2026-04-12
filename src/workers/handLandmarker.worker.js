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
let frameCounter = 0;

const postWorkerError = (message) => {
  self.postMessage({ type: "error", message });
};

const initHandLandmarker = async (
  wasmRoots = [],
  modelUrls = [],
  numHands = 1,
  runningMode = "VIDEO"
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
        msg.runningMode || "VIDEO"
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
      self.postMessage({ type: "NO_HAND" });
      return;
    }

    const thumbTip = firstHand[4];
    const indexTip = firstHand[8];
    if (!thumbTip || !indexTip) {
      pinchActive = false;
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

    pinchActive = pinchActive ? pinchDistance < 0.08 : pinchDistance < 0.06;

    self.postMessage({
      type: "HAND_DATA",
      x: indexTip.x,
      y: indexTip.y,
      isPinching: pinchActive,
    });
  } catch (err) {
    postWorkerError(err instanceof Error ? err.message : "Unknown worker error");
  }
};
