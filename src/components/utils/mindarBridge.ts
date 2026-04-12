// MindAR bridge fallback:
// We use native camera stream here to avoid CDN module-resolution/runtime errors
// (e.g. unresolved bare specifiers like "three") that can break gesture startup.

let activeStream: MediaStream | null = null;

export const startMindARCamera = async (): Promise<MediaStream> => {
  if (activeStream) {
    const liveTrack = activeStream.getTracks().find((track) => track.readyState === "live");
    if (liveTrack) return activeStream;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 24, max: 30 },
    },
    audio: false,
  });

  activeStream = stream;
  return stream;
};

export const stopMindARCamera = async () => {
  if (!activeStream) return;
  activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
};
