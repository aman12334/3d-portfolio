import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { createSkillsSection } from './ar/components/Skills.js';
import { createWorkSection } from './ar/components/Work.js';
import { createTimelineSection } from './ar/components/Timeline.js';
import { createAvatar } from './ar/components/Avatar.js';
import { GestureController } from './gestures.js';
import { AudioSystem } from './audio.js';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root container');
}

container.innerHTML = '';
container.style.width = '100vw';
container.style.height = '100vh';
container.style.overflow = 'hidden';
container.style.position = 'fixed';
container.style.inset = '0';
container.style.background = 'radial-gradient(circle at 20% 10%, #13273a 0%, #050a12 60%, #02040a 100%)';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x030a12, 3, 12);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 1.6, 2.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const arHint = document.createElement('div');
arHint.textContent = 'Allow camera and hand tracking. Use pinch to click, swipe to move, open palm to reset.';
arHint.style.position = 'absolute';
arHint.style.left = '50%';
arHint.style.bottom = '16px';
arHint.style.transform = 'translateX(-50%)';
arHint.style.padding = '10px 14px';
arHint.style.color = '#e7f2ff';
arHint.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
arHint.style.fontSize = '12px';
arHint.style.border = '1px solid rgba(255,255,255,0.2)';
arHint.style.borderRadius = '999px';
arHint.style.background = 'rgba(4, 16, 26, 0.65)';
arHint.style.backdropFilter = 'blur(8px)';
container.appendChild(arHint);

const hemi = new THREE.HemisphereLight(0xa4d2ff, 0x101018, 1.2);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
keyLight.position.set(1.4, 2.1, 1.3);
scene.add(keyLight);

const fill = new THREE.PointLight(0x2e7dff, 1.25, 8, 2);
fill.position.set(-2.4, 0.8, 2.8);
scene.add(fill);

const anchorRoot = new THREE.Group();
anchorRoot.position.set(0, 1.4, -1.8);
scene.add(anchorRoot);

const sectionRoot = new THREE.Group();
anchorRoot.add(sectionRoot);

const skills = createSkillsSection();
const work = createWorkSection();
const timeline = createTimelineSection();
const avatarPromise = createAvatar();

skills.group.position.set(-1.15, 0.25, 0);
work.group.position.set(0, 0.0, -1.1);
timeline.group.position.set(1.1, -0.15, -2.2);

sectionRoot.add(skills.group);
sectionRoot.add(work.group);
sectionRoot.add(timeline.group);

const avatarHolder = new THREE.Group();
avatarHolder.position.set(0, -0.2, -0.4);
sectionRoot.add(avatarHolder);

avatarPromise.then((avatarGroup) => {
  avatarHolder.add(avatarGroup);
});

const interactive = [
  ...skills.interactive,
  ...work.interactive,
  ...timeline.interactive,
];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
const lastPointer = new THREE.Vector2(0, 0);
const pointerVelocity = new THREE.Vector2(0, 0);

let hovered = null;
let sectionTargetOffset = 0;
let sectionOffset = 0;
let sceneYawTarget = 0;
let sceneYaw = 0;
let isDragging = false;

const audio = new AudioSystem('/audio/lumivexasset-opera-night-330358.mp3');
const gestures = new GestureController({
  parent: container,
  smoothing: 0.2,
});

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function setPointerFromClient(clientX, clientY) {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
}

function pickObject() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactive, false);
  return hits[0]?.object ?? null;
}

function triggerSelect(object) {
  if (!object) return;
  audio.ensureStarted();

  if (skills.map.has(object)) {
    skills.select(object);
    sectionTargetOffset = 0;
  }

  if (work.map.has(object)) {
    work.select(object);
    sectionTargetOffset = -0.75;
  }

  if (timeline.map.has(object)) {
    timeline.select(object);
    sectionTargetOffset = -1.5;
  }
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  isDragging = true;
  setPointerFromClient(event.clientX, event.clientY);
  triggerSelect(pickObject());
  audio.ensureStarted();
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

window.addEventListener('pointermove', (event) => {
  const px = (event.clientX / window.innerWidth) * 2 - 1;
  const py = -(event.clientY / window.innerHeight) * 2 + 1;
  pointerVelocity.set(px - lastPointer.x, py - lastPointer.y);
  lastPointer.set(px, py);
  pointer.set(px, py);

  if (isDragging) {
    timeline.scrollBy(pointerVelocity.x * 0.9);
    sceneYawTarget += pointerVelocity.x * 0.85;
  }
});

window.addEventListener('wheel', (event) => {
  sectionTargetOffset += event.deltaY * 0.0007;
  sectionTargetOffset = THREE.MathUtils.clamp(sectionTargetOffset, -1.8, 0.25);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

gestures.on('frame', (g) => {
  pointer.set(g.pointerX, g.pointerY);

  if (g.pinchStart) {
    triggerSelect(pickObject());
    audio.ensureStarted();
  }

  if (Math.abs(g.horizontalDelta) > 0.001) {
    timeline.scrollBy(g.horizontalDelta * 4.0);
    sceneYawTarget += g.horizontalDelta * 2.4;
  }

  const volume = clamp01(1 - g.handY);
  audio.setVolume(volume);
  audio.setTone(THREE.MathUtils.clamp((g.handY - 0.5) * 2, -1, 1));
  audio.setBassIntensity(g.depth);

  if (g.openPalm) {
    sectionTargetOffset = 0;
    sceneYawTarget = 0;
    timeline.resetScroll();
  }
});

(async () => {
  try {
    await gestures.init();
  } catch (error) {
    console.warn('Gesture init failed:', error);
  }
})();

if (navigator.xr) {
  const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['local-floor'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: container },
  });
  arButton.style.position = 'absolute';
  arButton.style.bottom = '66px';
  arButton.style.left = '50%';
  arButton.style.transform = 'translateX(-50%)';
  container.appendChild(arButton);
}

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(0.04, clock.getDelta());
  const elapsed = clock.elapsedTime;

  raycaster.setFromCamera(pointer, camera);
  const hit = pickObject();

  if (hovered && hovered !== hit) {
    skills.setHover(hovered, false);
    work.setHover(hovered, false);
    timeline.setHover(hovered, false);
    hovered = null;
  }

  if (hit && hovered !== hit) {
    skills.setHover(hit, true);
    work.setHover(hit, true);
    timeline.setHover(hit, true);
    hovered = hit;
  }

  sectionOffset = THREE.MathUtils.lerp(sectionOffset, sectionTargetOffset, dt * 3.2);
  sceneYaw = THREE.MathUtils.lerp(sceneYaw, sceneYawTarget, dt * 3.4);

  sectionRoot.position.z = sectionOffset;
  sectionRoot.rotation.y = sceneYaw;

  const parallaxX = pointer.x * 0.03;
  const parallaxY = pointer.y * 0.02;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, dt * 2.4);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.6 + parallaxY, dt * 2.4);

  skills.update(dt, elapsed);
  work.update(dt, elapsed);
  timeline.update(dt, elapsed);
  audio.update(dt);

  renderer.render(scene, camera);
});
