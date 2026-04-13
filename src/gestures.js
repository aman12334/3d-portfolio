import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class GestureController {
  constructor(options = {}) {
    this.parent = options.parent ?? document.body;
    this.smoothing = options.smoothing ?? 0.2;
    this.handlers = new Map();

    this.video = null;
    this.landmarker = null;
    this.running = false;

    this.prev = {
      pinch: false,
      x: 0.5,
      y: 0.5,
      handY: 0.5,
      depth: 0.5,
    };

    this.smooth = {
      x: 0,
      y: 0,
      handY: 0.5,
      depth: 0.5,
      horizontalDelta: 0,
    };
  }

  on(event, cb) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event).push(cb);
  }

  emit(event, payload) {
    (this.handlers.get(event) ?? []).forEach((cb) => cb(payload));
  }

  async init() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });

    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = stream;
    this.video.style.position = 'absolute';
    this.video.style.right = '12px';
    this.video.style.bottom = '12px';
    this.video.style.width = '108px';
    this.video.style.height = '72px';
    this.video.style.objectFit = 'cover';
    this.video.style.opacity = '0.14';
    this.video.style.borderRadius = '10px';
    this.video.style.border = '1px solid rgba(255,255,255,0.2)';
    this.parent.appendChild(this.video);

    await this.video.play();

    const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/mediapipe/hand_landmarker.task',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    });

    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.video?.srcObject) {
      this.video.srcObject.getTracks().forEach((t) => t.stop());
    }
    if (this.video?.parentElement) {
      this.video.parentElement.removeChild(this.video);
    }
  }

  loop = () => {
    if (!this.running || !this.landmarker || !this.video) return;

    const now = performance.now();
    const result = this.landmarker.detectForVideo(this.video, now);

    let pointerX = this.prev.x;
    let pointerY = this.prev.y;
    let handY = this.prev.handY;
    let depth = this.prev.depth;
    let pinch = false;
    let openPalm = false;

    if (result.landmarks?.length) {
      const lm = result.landmarks[0];
      const wrist = lm[0];
      const thumbTip = lm[4];
      const indexTip = lm[8];
      const middleTip = lm[12];
      const ringTip = lm[16];
      const pinkyTip = lm[20];
      const indexPip = lm[6];
      const middlePip = lm[10];
      const ringPip = lm[14];
      const pinkyPip = lm[18];

      const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
      pinch = pinchDist < 0.055;

      const fingersUp =
        indexTip.y < indexPip.y &&
        middleTip.y < middlePip.y &&
        ringTip.y < ringPip.y &&
        pinkyTip.y < pinkyPip.y;
      openPalm = fingersUp && pinchDist > 0.11;

      pointerX = 1 - indexTip.x;
      pointerY = indexTip.y;
      handY = wrist.y;

      const handSpan = Math.hypot(indexTip.x - pinkyTip.x, indexTip.y - pinkyTip.y);
      depth = Math.min(1, Math.max(0, (handSpan - 0.08) / 0.2));
    }

    const s = this.smoothing;
    this.smooth.x += (pointerX - this.smooth.x) * s;
    this.smooth.y += (pointerY - this.smooth.y) * s;
    this.smooth.handY += (handY - this.smooth.handY) * s;
    this.smooth.depth += (depth - this.smooth.depth) * s;

    const horizontalDelta = this.smooth.x - this.prev.x;
    this.smooth.horizontalDelta += (horizontalDelta - this.smooth.horizontalDelta) * s;

    const pinchStart = pinch && !this.prev.pinch;

    const payload = {
      pointerX: this.smooth.x * 2 - 1,
      pointerY: -(this.smooth.y * 2 - 1),
      handY: this.smooth.handY,
      depth: this.smooth.depth,
      horizontalDelta: this.smooth.horizontalDelta,
      pinch,
      pinchStart,
      openPalm,
    };

    this.prev.pinch = pinch;
    this.prev.x = this.smooth.x;
    this.prev.y = this.smooth.y;
    this.prev.handY = this.smooth.handY;
    this.prev.depth = this.smooth.depth;

    this.emit('frame', payload);

    requestAnimationFrame(this.loop);
  };
}
