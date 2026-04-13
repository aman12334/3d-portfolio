import * as THREE from 'three';

const CAREER = [
  { year: '2019', role: 'Frontend Engineer' },
  { year: '2020', role: '3D UI Specialist' },
  { year: '2021', role: 'XR Prototyper' },
  { year: '2022', role: 'Creative Technologist' },
  { year: '2023', role: 'Immersive Engineer' },
  { year: '2024', role: 'Lead AR Developer' },
  { year: '2025', role: 'Spatial Portfolio Architect' },
];

function timelineTexture(year, role) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0f1f35');
  grad.addColorStop(1, '#1a3d5f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(120, 200, 255, 0.65)';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.fillStyle = '#9fd8ff';
  ctx.font = '700 78px sans-serif';
  ctx.fillText(year, 40, 120);

  ctx.fillStyle = '#e2f4ff';
  ctx.font = '600 42px sans-serif';
  ctx.fillText(role, 40, 205);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createTimelineSection() {
  const group = new THREE.Group();
  const strip = new THREE.Group();
  group.add(strip);

  const interactive = [];
  const map = new Map();
  const cards = [];

  const line = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.01, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0x5ab3ff,
      emissive: 0x1f4f8b,
      emissiveIntensity: 0.35,
    })
  );
  line.position.y = -0.25;
  group.add(line);

  CAREER.forEach((entry, i) => {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.3),
      new THREE.MeshStandardMaterial({
        map: timelineTexture(entry.year, entry.role),
        roughness: 0.55,
        metalness: 0.12,
      })
    );

    card.position.set(i * 0.62, 0, 0);
    card.userData.baseY = (i % 2 === 0 ? 0.02 : -0.02);
    card.userData.hover = 0;
    card.userData.bump = 0;

    strip.add(card);
    cards.push(card);
    interactive.push(card);
    map.set(card, entry);
  });

  let scrollTarget = 0;
  let scroll = 0;

  return {
    group,
    interactive,
    map,
    scrollBy(delta) {
      scrollTarget += delta;
      scrollTarget = THREE.MathUtils.clamp(scrollTarget, -2.8, 0.4);
    },
    resetScroll() {
      scrollTarget = 0;
    },
    setHover(object, on) {
      if (!map.has(object)) return;
      object.userData.hover = on ? 1 : 0;
    },
    select(object) {
      if (!map.has(object)) return;
      object.userData.bump = 1;
    },
    update(dt, elapsed) {
      const t = Math.min(1, dt * 7);
      scroll += (scrollTarget - scroll) * t;
      strip.position.x = scroll;

      cards.forEach((card, i) => {
        const bob = Math.sin(elapsed * 1.1 + i * 0.6) * 0.012;
        const hoverLift = card.userData.hover * 0.05;
        card.position.y = THREE.MathUtils.lerp(card.position.y, card.userData.baseY + bob + hoverLift, t);

        card.userData.bump = Math.max(0, card.userData.bump - dt * 2.4);
        const bumpScale = 1 + card.userData.bump * 0.22;
        const hoverScale = 1 + card.userData.hover * 0.07;
        const target = bumpScale * hoverScale;
        card.scale.lerp(new THREE.Vector3(target, target, target), t);
      });
    },
  };
}
