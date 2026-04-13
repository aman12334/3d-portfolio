import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

type GestureCursorDetail = {
  x?: number;
  y?: number;
  active?: boolean;
  isPinching?: boolean;
};

const trackAREvent = (action: string, label: string) => {
  console.log("[AR_EVENT]", { action, label, at: new Date().toISOString() });
};

const MobileARScene = ({ active }: { active: boolean }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<{ x: number; y: number; has: boolean; pinching: boolean }>({
    x: 0,
    y: 0,
    has: false,
    pinching: false,
  });
  const prevPinchRef = useRef(false);
  const tapRef = useRef<{ pending: boolean; x: number; y: number }>({
    pending: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const onGesture = (event: Event) => {
      const detail = (event as CustomEvent<GestureCursorDetail>).detail;
      if (!detail?.active) {
        gestureRef.current.has = false;
        gestureRef.current.pinching = false;
        return;
      }
      if (typeof detail.x === "number" && typeof detail.y === "number") {
        gestureRef.current.has = true;
        gestureRef.current.x = (detail.x / window.innerWidth) * 2 - 1;
        gestureRef.current.y = -(detail.y / window.innerHeight) * 2 + 1;
      }
      gestureRef.current.pinching = Boolean(detail.isPinching);
    };

    window.addEventListener("gesture-cursor", onGesture as EventListener);
    return () => window.removeEventListener("gesture-cursor", onGesture as EventListener);
  }, []);

  useEffect(() => {
    if (!active || !mountRef.current) return;

    const mount = mountRef.current;
    const isPhonePortrait = window.innerWidth < 900 && window.innerHeight > window.innerWidth;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      isPhonePortrait ? 58 : 54,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    camera.position.set(0, isPhonePortrait ? 1.42 : 1.5, 0);
    camera.lookAt(0, isPhonePortrait ? 1.14 : 1.3, isPhonePortrait ? -2.4 : -2);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.92));
    const rim = new THREE.DirectionalLight(0xb8d6ff, 1.2);
    rim.position.set(2, 3, 1);
    scene.add(rim);

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.12, 48),
      new THREE.MeshBasicMaterial({ color: 0x99c8ff, transparent: true, opacity: 0.85 })
    );
    reticle.rotation.x = -Math.PI / 2;
    reticle.position.set(0, isPhonePortrait ? -0.5 : -0.36, isPhonePortrait ? -2.2 : -2);
    camera.add(reticle);

    const portfolioGroup = new THREE.Group();
    portfolioGroup.visible = false;
    portfolioGroup.scale.setScalar(isPhonePortrait ? 0.9 : 1);
    scene.add(portfolioGroup);

    const avatar = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 40, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0xf6b2ca,
        metalness: 0.24,
        roughness: 0.3,
        clearcoat: 0.7,
      })
    );
    avatar.position.set(0, 0.22, 0);
    portfolioGroup.add(avatar);

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.19, 0.32, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0x161b2e, roughness: 0.42, metalness: 0.16 })
    );
    torso.position.set(0, -0.2, 0);
    portfolioGroup.add(torso);

    const createCard = (label: string, color = "#88b9ff") => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 260;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 3;
        const r = 28;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(canvas.width - r, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
        ctx.lineTo(canvas.width, canvas.height - r);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
        ctx.lineTo(r, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = `700 ${isPhonePortrait ? 46 : 58}px Geist, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      return new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.38), mat);
    };

    const buttons: Array<{ mesh: THREE.Mesh; id: string; baseY: number; baseScale: number }> = [
      {
        mesh: createCard("View Projects"),
        id: "projects",
        baseY: isPhonePortrait ? 0.38 : 0.62,
        baseScale: isPhonePortrait ? 0.68 : 1,
      },
      {
        mesh: createCard("Experience"),
        id: "experience",
        baseY: isPhonePortrait ? 0.02 : 0.2,
        baseScale: isPhonePortrait ? 0.68 : 1,
      },
      {
        mesh: createCard("Contact"),
        id: "contact",
        baseY: isPhonePortrait ? -0.34 : -0.22,
        baseScale: isPhonePortrait ? 0.68 : 1,
      },
    ];

    buttons.forEach((entry, index) => {
      entry.mesh.scale.setScalar(entry.baseScale);
      entry.mesh.position.set(
        index === 0 ? (isPhonePortrait ? -0.52 : -0.84) : index === 1 ? (isPhonePortrait ? 0.52 : 0.84) : 0,
        entry.baseY,
        isPhonePortrait ? -0.03 : -0.05
      );
      entry.mesh.lookAt(new THREE.Vector3(0, entry.baseY, 2));
      portfolioGroup.add(entry.mesh);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    let hoveredId = "";
    let placed = false;
    let placedBaseY = 0;
    let frameId = 0;
    let portal: THREE.Mesh | null = null;

    const openSection = (selector: string) => {
      const section = document.querySelector(selector);
      if (section instanceof HTMLElement) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const spawnPortal = () => {
      if (portal) {
        scene.remove(portal);
        portal.geometry.dispose();
        (portal.material as THREE.Material).dispose();
        portal = null;
      }
      const material = new THREE.MeshBasicMaterial({
        color: 0x1a2740,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.92,
      });
      portal = new THREE.Mesh(new THREE.SphereGeometry(8, 48, 48), material);
      portal.position.copy(camera.position);
      portal.scale.setScalar(0.01);
      scene.add(portal);
      gsap.to(portal.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: "power3.out" });
      trackAREvent("ar_interaction", "clicked_project_portal");
    };

    const onSelect = (id: string) => {
      if (id === "projects") {
        spawnPortal();
        openSection("#projects-start");
      } else if (id === "experience") {
        openSection("#career");
        trackAREvent("ar_interaction", "clicked_experience");
      } else if (id === "contact") {
        openSection("#contact");
        trackAREvent("ar_interaction", "clicked_contact");
      }
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const setTapFromClient = (clientX: number, clientY: number) => {
      tapRef.current.pending = true;
      tapRef.current.x = (clientX / window.innerWidth) * 2 - 1;
      tapRef.current.y = -(clientY / window.innerHeight) * 2 + 1;
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      setTapFromClient(touch.clientX, touch.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      setTapFromClient(e.clientX, e.clientY);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      pointer.set(
        tapRef.current.pending
          ? tapRef.current.x
          : gestureRef.current.has
            ? gestureRef.current.x
            : 0,
        tapRef.current.pending
          ? tapRef.current.y
          : gestureRef.current.has
            ? gestureRef.current.y
            : 0
      );

      reticle.material.opacity = placed ? 0.45 : 0.9;

      buttons.forEach((entry, i) => {
        entry.mesh.position.y = entry.baseY + Math.sin(t * 1.1 + i * 0.6) * 0.015;
        entry.mesh.lookAt(camera.position.x, camera.position.y + 0.04, camera.position.z + 1.6);
      });

      if (portfolioGroup.visible) {
        portfolioGroup.position.y = placedBaseY + Math.sin(t * 1.2) * 0.012;
      }

      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(buttons.map((b) => b.mesh), false);
      const nextHover = intersections[0]
        ? buttons.find((b) => b.mesh.uuid === intersections[0].object.uuid)?.id || ""
        : "";

      if (nextHover !== hoveredId) {
        hoveredId = nextHover;
        buttons.forEach((entry) => {
          const isHovered = entry.id === hoveredId;
          gsap.to(entry.mesh.scale, {
            x: isHovered ? entry.baseScale * 1.08 : entry.baseScale,
            y: isHovered ? entry.baseScale * 1.08 : entry.baseScale,
            z: 1,
            duration: 0.18,
            overwrite: true,
          });
        });
      }

      const pinching = gestureRef.current.pinching;
      if (pinching && !prevPinchRef.current) {
        if (!placed) {
          const pos = new THREE.Vector3();
          reticle.getWorldPosition(pos);
          pos.y = Math.max(-0.15, pos.y);
          pos.z -= isPhonePortrait ? 0.28 : 0.18;
          portfolioGroup.position.copy(pos);
          placedBaseY = pos.y;
          portfolioGroup.visible = true;
          placed = true;
          trackAREvent("ar_interaction", "placed_portfolio_anchor");
        } else if (hoveredId) {
          onSelect(hoveredId);
        }
      }

      if (tapRef.current.pending) {
        if (!placed) {
          const pos = new THREE.Vector3();
          reticle.getWorldPosition(pos);
          pos.y = Math.max(-0.15, pos.y);
          pos.z -= isPhonePortrait ? 0.28 : 0.18;
          portfolioGroup.position.copy(pos);
          placedBaseY = pos.y;
          portfolioGroup.visible = true;
          placed = true;
          trackAREvent("ar_interaction", "placed_portfolio_anchor_touch");
        } else if (hoveredId) {
          onSelect(hoveredId);
        }
        tapRef.current.pending = false;
      }
      prevPinchRef.current = pinching;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(frameId);
      scene.clear();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [active]);

  return <div ref={mountRef} className={`mobile-ar-scene ${active ? "active" : ""}`} />;
};

export default MobileARScene;
