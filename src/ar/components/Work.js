import * as THREE from 'three';

const PROJECTS = [
  { title: 'WebAR Commerce', subtitle: 'Try-on workflow in AR', color: 0x134a8e },
  { title: 'Gesture DJ Deck', subtitle: 'Hand-driven filters', color: 0x7a3c13 },
  { title: 'Realtime Viz', subtitle: 'Audio-reactive dashboard', color: 0x184f3f },
];

function panelTexture(title, subtitle, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const base = `#${color.toString(16).padStart(6, '0')}`;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, base);
  grad.addColorStop(1, '#08101a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(190, 230, 255, 0.6)';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.fillStyle = '#d9efff';
  ctx.font = '700 84px sans-serif';
  ctx.fillText(title, 52, 210);
  ctx.font = '500 48px sans-serif';
  ctx.fillStyle = 'rgba(220, 245, 255, 0.92)';
  ctx.fillText(subtitle, 52, 300);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createWorkSection() {
  const group = new THREE.Group();
  const cards = [];
  const interactive = [];
  const map = new Map();

  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.18),
    new THREE.MeshBasicMaterial({
      map: panelTexture('Work Gallery', 'Pinch card to expand', 0x12365b),
      transparent: true,
      depthWrite: false,
    })
  );
  title.position.set(0, 0.68, 0);
  title.scale.set(0.8, 0.4, 1);
  group.add(title);

  PROJECTS.forEach((project, i) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.46),
      new THREE.MeshStandardMaterial({
        map: panelTexture(project.title, project.subtitle, project.color),
        roughness: 0.6,
        metalness: 0.1,
      })
    );

    mesh.position.set((i - 1) * 0.86, 0, -Math.abs(i - 1) * 0.16);
    mesh.rotation.y = (i - 1) * -0.2;
    mesh.userData.basePos = mesh.position.clone();
    mesh.userData.baseRot = mesh.rotation.clone();
    mesh.userData.expand = 0;
    mesh.userData.hover = 0;

    group.add(mesh);
    cards.push(mesh);
    interactive.push(mesh);
    map.set(mesh, project.title);
  });

  let active = null;

  return {
    group,
    interactive,
    map,
    setHover(object, on) {
      if (!map.has(object)) return;
      object.userData.hover = on ? 1 : 0;
    },
    select(object) {
      if (!map.has(object)) return;
      active = active === object ? null : object;
    },
    update(dt, elapsed) {
      const t = Math.min(1, dt * 6);
      cards.forEach((card, i) => {
        const targetExpand = active === card ? 1 : 0;
        card.userData.expand += (targetExpand - card.userData.expand) * t;

        const hoverTarget = 1 + card.userData.hover * 0.08;
        const expandedScale = 1 + card.userData.expand * 0.56;
        const targetScale = hoverTarget * expandedScale;
        card.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), t);

        const basePos = card.userData.basePos;
        card.position.x = THREE.MathUtils.lerp(card.position.x, basePos.x, t);
        card.position.y = THREE.MathUtils.lerp(card.position.y, basePos.y + Math.sin(elapsed * 0.8 + i) * 0.02, t);
        card.position.z = THREE.MathUtils.lerp(card.position.z, basePos.z + card.userData.expand * 0.28, t);

        const baseRot = card.userData.baseRot;
        card.rotation.y = THREE.MathUtils.lerp(card.rotation.y, baseRot.y * (1 - card.userData.expand), t);
      });
    },
  };
}
