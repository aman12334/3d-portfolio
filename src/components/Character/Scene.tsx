import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const { setLoading } = useLoading();

  useEffect(() => {
    if (canvasDiv.current) {
      let isDisposed = false;
      let frameId = 0;
      let rect = canvasDiv.current.getBoundingClientRect();
      let container = { width: rect.width, height: rect.height };
      const aspect = container.width / container.height;
      const scene = sceneRef.current;
      const mountNode = canvasDiv.current;

      // Ensure only one renderer canvas is attached per mount.
      mountNode.querySelectorAll("canvas").forEach((canvas) => canvas.remove());

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(container.width, container.height);
      const targetPixelRatio = window.innerWidth <= 1024 ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, targetPixelRatio));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      mountNode.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
      camera.position.z = 10;
      camera.position.set(0, 13.1, 24.7);
      camera.zoom = 1.1;
      camera.updateProjectionMatrix();

      let headBone: THREE.Object3D | null = null;
      let eyeBones: THREE.Object3D[] = [];
      let screenLight: any | null = null;
      let mixer: THREE.AnimationMixer;
      let onResize: (() => void) | null = null;

      const clock = new THREE.Clock();

      const light = setLighting(scene);
      let progress = setProgress((value) => setLoading(value));
      const { loadCharacter } = setCharacter(renderer, scene, camera);
      let loaderReleased = false;
      const releaseLoader = () => {
        if (loaderReleased) return;
        loaderReleased = true;
        progress
          .loaded()
          .then(() => {
            setTimeout(() => {
              light.turnOnLights();
              animationsRef.current?.startIntro?.();
            }, 2500);
          })
          .catch(() => {
            progress.clear();
          });
      };
      const animationsRef: {
        current:
          | ReturnType<typeof setAnimations>
          | null;
      } = { current: null };
      // Hard fallback: never block the full app on character readiness.
      const loaderFallbackTimer = window.setTimeout(() => {
        releaseLoader();
      }, 6000);

      loadCharacter().then((gltf) => {
        if (isDisposed) return;
        if (gltf) {
          const animations = setAnimations(gltf);
          animationsRef.current = animations;
          hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
          mixer = animations.mixer;
          let character = gltf.scene;
          scene.add(character);
          headBone = character.getObjectByName("spine006") || null;
          eyeBones = [];
          character.traverse((child) => {
            const asBone = child as THREE.Bone;
            if (asBone.isBone && /eye/i.test(child.name)) {
              eyeBones.push(child);
            }
          });
          const torsoBone = character.getObjectByName("spine005") || null;

          if (window.innerWidth > 1024) {
            character.updateMatrixWorld(true);
            const anchor = torsoBone || headBone;
            if (anchor) {
              const anchorWorld = new THREE.Vector3();
              anchor.getWorldPosition(anchorWorld);
              character.position.x -= anchorWorld.x;
              character.updateMatrixWorld(true);
            }
          }

          screenLight = character.getObjectByName("screenlight") || null;
          releaseLoader();
          onResize = () => handleResize(renderer, camera, canvasDiv, character);
          window.addEventListener("resize", onResize);
        }
      });

      let mouse = { x: 0, y: 0 },
        interpolation = { x: 0.1, y: 0.2 };
      let motionInput = { x: 0, y: 0, shake: 0 };
      let gyroEnabled = localStorage.getItem("gyro-enabled") === "1";
      let gestureCursorActive = false;
      let orientationBaseline: { gamma: number; beta: number } | null = null;

      const onMouseMove = (event: MouseEvent) => {
        if (gestureCursorActive) return;
        if (isMobileView() && gyroEnabled) return;
        handleMouseMove(event, (x, y) => (mouse = { x, y }));
      };
      let debounce: number | undefined;
      let activeTouchTarget: HTMLElement | null = null;
      const onTouchMove = (e: TouchEvent) => {
        if (isMobileView() && gyroEnabled) return;
        handleTouchMove(e, (x, y) => (mouse = { x, y }));
      };
      const onTouchStart = (event: TouchEvent) => {
        if (isMobileView() && gyroEnabled) return;
        activeTouchTarget = event.currentTarget as HTMLElement;
        debounce = setTimeout(() => {
          activeTouchTarget?.addEventListener("touchmove", onTouchMove);
        }, 200);
      };

      const onTouchEnd = () => {
        if (isMobileView() && gyroEnabled) return;
        if (activeTouchTarget) {
          activeTouchTarget.removeEventListener("touchmove", onTouchMove);
        }
        activeTouchTarget = null;
        handleTouchEnd((x, y, interpolationX, interpolationY) => {
          mouse = { x, y };
          interpolation = { x: interpolationX, y: interpolationY };
        });
      };

      const isMobileView = () => window.innerWidth <= 1024;
      const onGyroControlChange = (event: Event) => {
        const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
        gyroEnabled = Boolean(detail?.enabled);
        orientationBaseline = null;
        motionInput = { x: 0, y: 0, shake: 0 };
        mouse = { x: 0, y: gyroEnabled ? -0.262 : 0 };
        interpolation = { x: gyroEnabled ? 0.2 : 0.1, y: gyroEnabled ? 0.2 : 0.2 };
      };

      const onGestureCursor = (event: Event) => {
        const detail = (event as CustomEvent<{ x?: number; y?: number; active?: boolean }>).detail;
        const active = Boolean(detail?.active);
        gestureCursorActive = active;
        if (!active || isMobileView()) return;

        const x = Number(detail?.x ?? window.innerWidth * 0.5);
        const y = Number(detail?.y ?? window.innerHeight * 0.5);
        const nx = THREE.MathUtils.clamp((x / window.innerWidth) * 2 - 1, -1, 1);
        const ny = THREE.MathUtils.clamp(-((y / window.innerHeight) * 2 - 1), -1, 1);
        mouse = {
          x: THREE.MathUtils.lerp(mouse.x, nx, 0.55),
          y: THREE.MathUtils.lerp(mouse.y, ny, 0.55),
        };
        interpolation = { x: 0.18, y: 0.18 };
      };

      const onDeviceOrientation = (event: DeviceOrientationEvent) => {
        if (!isMobileView() || !gyroEnabled) return;
        const gamma = event.gamma ?? 0;
        const beta = event.beta ?? 0;
        if (!orientationBaseline) {
          orientationBaseline = { gamma, beta };
          return;
        }
        const deltaGamma = gamma - orientationBaseline.gamma;
        const deltaBeta = beta - orientationBaseline.beta;
        const nextX = THREE.MathUtils.clamp(deltaGamma / 34, -1, 1);
        const nextY = THREE.MathUtils.clamp(-deltaBeta / 46 - 0.262, -1, 1);
        motionInput = {
          ...motionInput,
          x: THREE.MathUtils.lerp(motionInput.x, nextX, 0.2),
          y: THREE.MathUtils.lerp(motionInput.y, nextY, 0.2),
        };
        mouse = { x: motionInput.x, y: motionInput.y };
      };

      const onDeviceMotion = (event: DeviceMotionEvent) => {
        if (!isMobileView() || !gyroEnabled) return;
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;
        const magnitude = Math.sqrt(
          (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
        );
        const shake = THREE.MathUtils.clamp((magnitude - 12.5) / 17, 0, 1);
        motionInput.shake = THREE.MathUtils.lerp(motionInput.shake, shake, 0.16);
      };

      document.addEventListener("mousemove", onMouseMove);
      window.addEventListener("deviceorientation", onDeviceOrientation);
      window.addEventListener("devicemotion", onDeviceMotion);
      window.addEventListener("gyro-control-change", onGyroControlChange as EventListener);
      window.addEventListener("gesture-cursor", onGestureCursor as EventListener);
      const landingDiv = document.getElementById("landingDiv");
      if (landingDiv) {
        landingDiv.addEventListener("touchstart", onTouchStart);
        landingDiv.addEventListener("touchend", onTouchEnd);
      }
      const animate = () => {
        if (isDisposed) return;
        frameId = requestAnimationFrame(animate);
        if (headBone) {
          handleHeadRotation(
            headBone,
            mouse.x,
            mouse.y,
            interpolation.x,
            interpolation.y,
            THREE.MathUtils.lerp
          );
          if (isMobileView() && gyroEnabled) {
            const elapsed = clock.getElapsedTime();
            const shakeX = motionInput.shake * 0.008 * Math.sin(elapsed * 18);
            const shakeY = motionInput.shake * 0.006 * Math.cos(elapsed * 15);
            headBone.rotation.y += shakeY;
            headBone.rotation.x += shakeX;

            eyeBones.forEach((eyeBone) => {
              eyeBone.rotation.y = THREE.MathUtils.lerp(
                eyeBone.rotation.y,
                motionInput.x * 0.16 + shakeY * 0.8,
                0.18
              );
              eyeBone.rotation.x = THREE.MathUtils.lerp(
                eyeBone.rotation.x,
                -motionInput.y * 0.11 + shakeX * 0.8,
                0.18
              );
            });
          }
          light.setPointLight(screenLight);
        }
        const delta = clock.getDelta();
        if (mixer) {
          mixer.update(delta);
        }
        renderer.render(scene, camera);
      };
      animate();
      return () => {
        isDisposed = true;
        if (frameId) {
          window.cancelAnimationFrame(frameId);
        }
        window.clearTimeout(loaderFallbackTimer);
        clearTimeout(debounce);
        scene.clear();
        renderer.dispose();
        if (onResize) {
          window.removeEventListener("resize", onResize);
        }
        if (mountNode.contains(renderer.domElement)) {
          mountNode.removeChild(renderer.domElement);
        }
        document.removeEventListener("mousemove", onMouseMove);
        if (landingDiv) {
          landingDiv.removeEventListener("touchmove", onTouchMove);
          landingDiv.removeEventListener("touchstart", onTouchStart);
          landingDiv.removeEventListener("touchend", onTouchEnd);
        }
        window.removeEventListener("deviceorientation", onDeviceOrientation);
        window.removeEventListener("devicemotion", onDeviceMotion);
        window.removeEventListener("gyro-control-change", onGyroControlChange as EventListener);
        window.removeEventListener("gesture-cursor", onGestureCursor as EventListener);
      };
    }
  }, []);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
