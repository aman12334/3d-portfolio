import * as THREE from 'three';

const SKILLS = [
  { name: 'Three.js', color: 0x4ec4ff },
  { name: 'WebXR', color: 0x8aff72 },
  { name: 'MediaPipe', color: 0xff8f5e },
  { name: 'TypeScript', color: 0x5f88ff },
  { name: 'Shaders', color: 0xf86dff },
  { name: 'GSAP', color: 0xf8e46d },
  { name: 'Audio API', color: 0x6df8d3 },
  { name: 'GLTF', color: 0xff6da2 },
];

function makeLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(3, 9, 18, 0.72)';
  ctx.fillRect(8, 16, canvas.width - 16, canvas.height - 32);
  ctx.strokeStyle = 'rgba(130, 206, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 16, canvas.width - 16, canvas.height - 32);
  ctx.fillStyle = '#d7efff';
  ctx.font = '700 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createSkillsSection() {
  const group = new THREE.Group();
  const interactive = [];
  const map = new Map();

  const titleGeo = new THREE.PlaneGeometry(1.15, 0.18);
  const titleMat = new THREE.MeshBasicMaterial({
    map: makeLabelTexture('Skills Cluster'),
    transparent: true,
    depthWrite: false,
  });
  const title = new THREE.Mesh(titleGeo, titleMat);
  title.position.set(0, 0.64, 0);
  group.add(title);

  const sphereGeo = new THREE.SphereGeometry(0.09, 24, 24);

  SKILLS.forEach((skill, i) => {
    const phi = (Math.PI * 2 * i) / SKILLS.length;
    const radius = 0.34 + ((i % 3) * 0.05);
    const mat = new THREE.MeshStandardMaterial({
      color: skill.color,
      roughness: 0.3,
      metalness: 0.25,
      emissive: skill.color,
      emissiveIntensity: 0.17,
    });
    const sphere = new THREE.Mesh(sphereGeo, mat);
    sphere.position.set(Math.cos(phi) * radius, (i % 2 === 0 ? 0.1 : -0.05) + Math.sin(phi * 2.0) * 0.08, Math.sin(phi) * radius * 0.45);
    sphere.userData.base = sphere.position.clone();
    sphere.userData.phase = i * 0.67;
    sphere.userData.scaleTarget = 1;
    sphere.userData.skill = skill.name;

    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeLabelTexture(skill.name),
        transparent: true,
        opacity: 0.86,
      })
    );
    label.scale.set(0.5, 0.13, 1);
    label.position.set(0, -0.18, 0);
    sphere.add(label);

    group.add(sphere);
    interactive.push(sphere);
    map.set(sphere, skill.name);
  });

  return {
    group,
    interactive,
    map,
    setHover(object, on) {
      if (!map.has(object)) return;
      object.userData.scaleTarget = on ? 1.2 : 1;
    },
    select(object) {
      if (!map.has(object)) return;
      object.userData.scaleTarget = 1.34;
      object.userData.pulse = 1;
    },
    update(dt, elapsed) {
      for (const sphere of interactive) {
        const b = sphere.userData.base;
        const phase = sphere.userData.phase;
        sphere.position.x = b.x + Math.cos(elapsed * 0.8 + phase) * 0.012;
        sphere.position.y = b.y + Math.sin(elapsed * 1.3 + phase) * 0.03;
        sphere.position.z = b.z + Math.sin(elapsed * 0.9 + phase) * 0.015;

        const pulse = sphere.userData.pulse ?? 0;
        sphere.userData.pulse = Math.max(0, pulse - dt * 2.2);

        const target = sphere.userData.scaleTarget + sphere.userData.pulse * 0.24;
        const t = Math.min(1, dt * 8);
        sphere.scale.x += (target - sphere.scale.x) * t;
        sphere.scale.y += (target - sphere.scale.y) * t;
        sphere.scale.z += (target - sphere.scale.z) * t;
      }
    },
  };
}
