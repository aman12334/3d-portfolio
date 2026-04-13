import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export async function createAvatar() {
  const group = new THREE.Group();

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  loader.setDRACOLoader(draco);

  const candidates = [
    '/models/avatar.glb',
    '/models/character.glb',
    'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  ];

  let model = null;
  for (const path of candidates) {
    try {
      const gltf = await loader.loadAsync(path);
      model = gltf.scene;
      break;
    } catch {
      // try next model path
    }
  }

  if (model) {
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    model.scale.set(0.36, 0.36, 0.36);
    model.position.set(0, -0.58, 0.18);
    group.add(model);
  } else {
    const fallback = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.48, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0x99cfff,
        emissive: 0x245c8e,
        emissiveIntensity: 0.34,
        roughness: 0.35,
        metalness: 0.24,
      })
    );
    fallback.position.set(0, -0.25, 0.18);
    group.add(fallback);
  }

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.08, 32),
    new THREE.MeshStandardMaterial({
      color: 0x10324a,
      emissive: 0x0f2b46,
      emissiveIntensity: 0.45,
      roughness: 0.55,
      metalness: 0.14,
    })
  );
  pedestal.position.set(0, -0.56, 0.2);
  group.add(pedestal);

  return group;
}
