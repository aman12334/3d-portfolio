import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

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
  scale: 1.02,
  materialIndex: index % SKILLS.length,
  initialPosition: initialLayout[index] ?? [0, 0, 1],
}));

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  material: THREE.MeshPhysicalMaterial;
  initialPosition: [number, number, number];
  isActive: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  material,
  initialPosition,
  isActive,
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
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
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
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const workTop = document.getElementById("work")?.getBoundingClientRect().top ?? 0;
      setIsActive(scrollY > workTop);
    };

    const navLinks = document.querySelectorAll(".header a");
    navLinks.forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      element.addEventListener("click", () => {
        const interval = setInterval(() => {
          handleScroll();
        }, 16);
        setTimeout(() => {
          clearInterval(interval);
        }, 1200);
      });
    });

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
      let fontSize = 118;
      const maxTextWidth = w - 150;
      do {
        ctx.font = `700 ${fontSize}px Geist, sans-serif`;
        fontSize -= 4;
      } while (ctx.measureText(skill).width > maxTextWidth && fontSize > 58);

      ctx.fillText(skill, canvas.width / 2, canvas.height / 2 + 4);

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
  }, []);

  return (
    <div className="techstack">
      <h2>My Skillset</h2>

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
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.8, 0]}>
          <planeGeometry args={[50, 50]} />
          <shadowMaterial transparent opacity={0.26} />
        </mesh>
        <Physics gravity={[0, 0, 0]}>
          <Pointer isActive={isActive} />
          <group position={[0, -1.05, 0]}>
            {sphereConfigs.map((props, i) => (
              <SphereGeo
                key={i}
                scale={props.scale}
                material={materials[props.materialIndex]}
                initialPosition={props.initialPosition}
                isActive={isActive}
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
