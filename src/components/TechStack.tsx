import * as THREE from "three";
import { useRef, useMemo, useState, useEffect, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import PretextReveal from "./ui/PretextReveal";

type MotionInput = { x: number; y: number; shake: number };

const SKILLS = [
  "SQL",
  "Tableau",
  "Snowflake",
  "SaaS",
  "AI",
  "Platform",
  "Workflow Design",
  "REST APIs",
  "JSON",
  "Jira",
  "Git",
  "Figma",
  "LLMs",
  "Multi AI Agent Systems",
  "Agile",
];

const sphereGeometry = new THREE.SphereGeometry(1, 30, 30);

const initialLayout: Array<[number, number, number]> = [
  [-7.6, 2.7, 1.25],
  [-3.8, 2.9, 1.35],
  [0, 3.05, 1.45],
  [3.8, 2.9, 1.35],
  [7.6, 2.7, 1.25],
  [-8.2, 0.25, 0.95],
  [-4.1, 0.35, 1.18],
  [0, 0.5, 1.38],
  [4.1, 0.35, 1.18],
  [8.2, 0.25, 0.95],
  [-7.6, -2.35, 0.75],
  [-3.8, -2.45, 0.98],
  [0, -2.25, 1.12],
  [3.8, -2.45, 0.98],
  [7.6, -2.35, 0.75],
];

const sphereConfigs = SKILLS.map((_, index) => ({
  scale: 0.82,
  materialIndex: index % SKILLS.length,
  initialPosition: initialLayout[index] ?? [0, 0, 1],
}));

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  material: THREE.MeshPhysicalMaterial;
  initialPosition: [number, number, number];
  isActive: boolean;
  motionRef: MutableRefObject<MotionInput>;
  isMobileMotion: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  material,
  initialPosition,
  isActive,
  motionRef,
  isMobileMotion,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);

  useFrame((_state, delta) => {
    if (!isActive || !api.current) return;
    delta = Math.min(0.1, delta);
    const impulse = vec
      .copy(api.current.translation())
      .normalize()
      .multiply(
        new THREE.Vector3(
          -20 * delta * scale,
          -62 * delta * scale,
          -20 * delta * scale
        )
      );

    api.current.applyImpulse(impulse, true);

    const tiltX = isMobileMotion ? motionRef.current.x : 0;
    const tiltY = isMobileMotion ? motionRef.current.y : 0;
    const shake = isMobileMotion ? motionRef.current.shake : 0;

    api.current.applyImpulse(
      new THREE.Vector3(
        tiltX * 26 * delta,
        -tiltY * 34 * delta + shake * 22 * delta,
        0
      ),
      true
    );
  });

  return (
    <RigidBody
      linearDamping={1.35}
      angularDamping={6}
      enabledRotations={[false, false, false]}
      friction={0.2}
      position={initialPosition}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0, 0, 0]}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
  motionRef: MutableRefObject<MotionInput>;
  isMobileMotion: boolean;
};

function Pointer({
  vec = new THREE.Vector3(),
  isActive,
  motionRef,
  isMobileMotion,
}: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const sourceX = isMobileMotion ? motionRef.current.x : pointer.x;
    const sourceY = isMobileMotion ? motionRef.current.y : pointer.y;
    const targetVec = vec.lerp(
      new THREE.Vector3(
        (sourceX * viewport.width) / 2,
        (sourceY * viewport.height) / 2,
        0
      ),
      0.14
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

function MovingLights() {
  const spotRef = useRef<THREE.SpotLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spotRef.current) {
      spotRef.current.position.x = 15 + Math.sin(t * 0.42) * 3.2;
      spotRef.current.position.z = 18 + Math.cos(t * 0.37) * 2.4;
    }
    if (dirRef.current) {
      dirRef.current.position.x = -8 + Math.cos(t * 0.33) * 2.6;
      dirRef.current.position.z = 10 + Math.sin(t * 0.29) * 2.1;
    }
  });

  return (
    <>
      <spotLight
        ref={spotRef}
        position={[15, 24, 18]}
        penumbra={1}
        angle={0.34}
        color="white"
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        ref={dirRef}
        position={[-8, 15, 10]}
        intensity={1.15}
        castShadow
      />
    </>
  );
}

const TechStack = () => {
  const stackRef = useRef<HTMLDivElement | null>(null);
  const motionRef = useRef<MotionInput>({ x: 0, y: 0, shake: 0 });
  const baselineRef = useRef<{ gamma: number; beta: number } | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isMobileMotion, setIsMobileMotion] = useState(window.innerWidth <= 1024);
  const [isPhoneViewport, setIsPhoneViewport] = useState(window.innerWidth <= 767);
  const [gyroEnabled, setGyroEnabled] = useState(
    () => localStorage.getItem("gyro-enabled") === "1"
  );
  const [gestureCursorActive, setGestureCursorActive] = useState(false);

  const mobileGyroActive = isMobileMotion && gyroEnabled;
  const handCursorActive = !isMobileMotion && gestureCursorActive;
  const effectiveActive = isActive || mobileGyroActive || handCursorActive;

  useEffect(() => {
    const element = stackRef.current;
    if (!element) {
      setIsActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsActive(entry.isIntersecting || entry.intersectionRatio > 0.15);
      },
      { threshold: [0.15, 0.35, 0.6] }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const onGestureCursor = (event: Event) => {
      const detail = (event as CustomEvent<{
        x?: number;
        y?: number;
        active?: boolean;
      }>).detail;

      const active = Boolean(detail?.active);
      setGestureCursorActive(active);
      if (!active || isMobileMotion) return;

      const x = Number(detail?.x ?? window.innerWidth * 0.5);
      const y = Number(detail?.y ?? window.innerHeight * 0.5);
      const nx = THREE.MathUtils.clamp((x / window.innerWidth) * 2 - 1, -1, 1);
      const ny = THREE.MathUtils.clamp(-((y / window.innerHeight) * 2 - 1), -1, 1);
      motionRef.current.x = THREE.MathUtils.lerp(motionRef.current.x, nx, 0.55);
      motionRef.current.y = THREE.MathUtils.lerp(motionRef.current.y, ny, 0.55);
      motionRef.current.shake = THREE.MathUtils.lerp(motionRef.current.shake, 0, 0.25);
    };

    window.addEventListener("gesture-cursor", onGestureCursor as EventListener);
    return () =>
      window.removeEventListener("gesture-cursor", onGestureCursor as EventListener);
  }, [isMobileMotion]);

  useEffect(() => {
    const onResize = () => {
      setIsMobileMotion(window.innerWidth <= 1024);
      setIsPhoneViewport(window.innerWidth <= 767);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleGyroChange = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      const enabled = Boolean(detail?.enabled);
      setGyroEnabled(enabled);
      if (!enabled) {
        baselineRef.current = null;
        motionRef.current = { x: 0, y: 0, shake: 0 };
      }
    };

    window.addEventListener("gyro-control-change", handleGyroChange as EventListener);
    return () =>
      window.removeEventListener("gyro-control-change", handleGyroChange as EventListener);
  }, []);

  useEffect(() => {
    if (!mobileGyroActive) {
      baselineRef.current = null;
      motionRef.current = { x: 0, y: 0, shake: 0 };
      return;
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;

      if (!baselineRef.current) {
        baselineRef.current = { gamma, beta };
        return;
      }

      const deltaGamma = gamma - baselineRef.current.gamma;
      const deltaBeta = beta - baselineRef.current.beta;

      const x = THREE.MathUtils.clamp(deltaGamma / 34, -1, 1);
      const y = THREE.MathUtils.clamp(-deltaBeta / 46, -1, 1);

      motionRef.current.x = THREE.MathUtils.lerp(motionRef.current.x, x, 0.2);
      motionRef.current.y = THREE.MathUtils.lerp(motionRef.current.y, y, 0.2);
    };

    const onMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(
        (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
      );
      const shake = THREE.MathUtils.clamp((magnitude - 12.5) / 17, 0, 1);
      motionRef.current.shake = THREE.MathUtils.lerp(motionRef.current.shake, shake, 0.16);
    };

    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("devicemotion", onMotion);

    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [mobileGyroActive]);

  const materials = useMemo(() => {
    return SKILLS.map((skill) => {
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return new THREE.MeshPhysicalMaterial({
          color: "#ffffff",
          metalness: 0.05,
          roughness: 0.22,
          clearcoat: 0.92,
          clearcoatRoughness: 0.14,
          envMapIntensity: 0.9,
        });
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bandH = 216;
      const bandY = canvas.height / 2 - bandH / 2;
      const radius = 42;
      const x = 96;
      const w = canvas.width - 192;
      const y = bandY;
      const h = bandH;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.fillStyle = "rgba(238,245,253,0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(22,70,126,0.26)";
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = "#0f2f5f";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let fontSize = isPhoneViewport ? 146 : 118;
      const maxTextWidth = w - 150;
      do {
        ctx.font = `700 ${fontSize}px Geist, sans-serif`;
        fontSize -= 4;
      } while (ctx.measureText(skill).width > maxTextWidth && fontSize > 58);

      ctx.fillText(skill, canvas.width * 0.5, canvas.height / 2 + 4);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return new THREE.MeshPhysicalMaterial({
        map: texture,
        metalness: 0.06,
        roughness: 0.2,
        clearcoat: 0.92,
        clearcoatRoughness: 0.14,
        envMapIntensity: 0.9,
      });
    });
  }, [isPhoneViewport]);

  return (
    <div className="techstack" ref={stackRef}>
      <PretextReveal as="h2" text="My Skillset" />

      <Canvas
        dpr={[1, 1.25]}
        gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => {
          state.gl.toneMappingExposure = 1.25;
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        className="tech-canvas"
      >
        <ambientLight intensity={0.64} />
        <MovingLights />
        <Physics gravity={[0, 0, 0]}>
          <Pointer
            isActive={effectiveActive}
            motionRef={motionRef}
            isMobileMotion={mobileGyroActive || handCursorActive}
          />
          <group
            position={[0, isPhoneViewport ? -2.05 : -1.05, 0]}
            scale={isPhoneViewport ? 1.22 : 1}
          >
            {sphereConfigs.map((props, i) => (
              <SphereGeo
                key={i}
                scale={props.scale}
                material={materials[props.materialIndex]}
                initialPosition={props.initialPosition}
                isActive={effectiveActive}
                motionRef={motionRef}
                isMobileMotion={mobileGyroActive || handCursorActive}
              />
            ))}
          </group>
        </Physics>
        <Environment
          files="/models/char_enviorment.hdr"
          environmentIntensity={0.5}
          environmentRotation={[0, 4, 2]}
        />
      </Canvas>
    </div>
  );
};

export default TechStack;
