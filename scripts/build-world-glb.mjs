import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Node does not expose FileReader, while GLTFExporter uses it to assemble a binary GLB.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

if (!process.argv.includes('--blockout')) {
  console.error('This script builds an optional procedural blockout only. Use Blender art/blender/build-environment.py to regenerate the canonical moonlit-world.glb, or pass --blockout explicitly.');
  process.exit(1);
}

const OUT = resolve('art/blockout/midautumn-world.glb');
const COLORS = { night: 0x080b24, moon: 0xf4d99a, moonShadow: 0xb39a6b, violet: 0x6c648f, coral: 0xc86f5c, leaf: 0x1b3035, leafLight: 0x35504c, earth: 0x211b38, water: 0x1d3155, paper: 0xf0ddbc };

function yQuaternionTrack(name, times, angles) {
  const values = angles.flatMap((angle) => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)]);
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values);
}
function zQuaternionTrack(name, times, angles) {
  const values = angles.flatMap((angle) => [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)]);
  return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, values);
}

function material(color, roughness = 0.88, emissive = 0, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity });
}
function mesh(geometry, mat, name) {
  const value = new THREE.Mesh(geometry, mat);
  value.name = name;
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}
function add(parent, child) {
  parent.add(child);
  return child;
}
function sphere(radius, color, name, roughness = 0.9) { return mesh(new THREE.SphereGeometry(radius, 28, 18), material(color, roughness), name); }
function roundedBox(width, height, depth, color, name, radius = 0.08) { return mesh(new RoundedBoxGeometry(width, height, depth, 3, radius), material(color, 0.93), name); }

function lantern(name, color = COLORS.coral) {
  const root = new THREE.Group();
  root.name = name;
  add(root, mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.66, 16), material(color, 0.9, color, 0.02), `${name}_BODY`)).scale.z = 0.78;
  const cap = add(root, mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.1, 12), material(COLORS.moon, 0.8), `${name}_CAP`));
  cap.position.y = 0.38;
  const base = cap.clone(); base.name = `${name}_BASE`; base.position.y = -0.38; root.add(base);
  const band = add(root, mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 20), material(COLORS.moon, 0.82), `${name}_BAND`));
  band.rotation.x = Math.PI / 2;
  const glow = add(root, mesh(new THREE.SphereGeometry(0.22, 16, 12), material(color, 0.65, color, 0.08), `${name}_GLOW`));
  glow.scale.setScalar(0.8);
  return root;
}

function character(name, bodyColor, skinColor, isHang = false) {
  const root = new THREE.Group();
  root.name = `${name}_ROOT`;
  const body = add(root, mesh(new THREE.CapsuleGeometry(isHang ? 0.38 : 0.27, isHang ? 0.78 : 0.52, 8, 16), material(bodyColor, 0.95), `${name}_BODY`));
  body.position.y = 0.65;
  const head = add(root, sphere(0.27, skinColor, `${name}_HEAD`, 0.94));
  head.position.y = 1.38;
  const hair = add(root, sphere(isHang ? 0.34 : 0.29, isHang ? 0x2d2232 : 0x2a2028, `${name}_HAIR`, 0.98));
  hair.position.set(0, 1.47, -0.06); hair.scale.set(1, 1.15, 0.66);
  for (const side of [-1, 1]) {
    const eye = add(root, sphere(0.028, 0x11101b, `${name}_EYE_${side > 0 ? 'R' : 'L'}`, 0.7));
    eye.position.set(side * 0.09, 1.4, 0.245);
    const arm = add(root, mesh(new THREE.CapsuleGeometry(0.06, 0.3, 5, 10), material(isHang ? skinColor : bodyColor, 0.95), `${name}_ARM_${side > 0 ? 'R' : 'L'}`));
    arm.position.set(side * 0.31, 0.82, 0); arm.rotation.z = side * -0.48;
  }
  if (isHang) {
    const sleeve = add(root, mesh(new THREE.TorusGeometry(0.36, 0.07, 8, 20), material(skinColor, 0.95), `${name}_SLEEVE`));
    sleeve.rotation.x = Math.PI / 2; sleeve.position.y = 0.82;
    const ribbon = add(root, mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 18), material(COLORS.coral, 0.9), `${name}_RIBBON`));
    ribbon.rotation.x = Math.PI / 2; ribbon.position.set(0, 1.53, -0.03);
  } else {
    const hat = add(root, mesh(new THREE.ConeGeometry(0.34, 0.32, 12), material(0x5f4e4a, 0.98), `${name}_HAT`));
    hat.position.y = 1.72;
    const hatBand = add(root, mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 16), material(COLORS.moon, 0.86), `${name}_HAT_BAND`));
    hatBand.rotation.x = Math.PI / 2; hatBand.position.y = 1.64;
  }
  return root;
}

function buildWorld() {
  const scene = new THREE.Scene();
  scene.name = 'MID_AUTUMN_WORLD';

  // Pod 0 — moon approach.
  const moonPod = add(scene, new THREE.Group()); moonPod.name = 'pod_moon_approach';
  const moon = add(moonPod, new THREE.Group()); moon.name = 'MOON_HERO'; moon.position.set(0, 4.3, -5.7);
  add(moon, sphere(2.62, COLORS.moon, 'MOON_DISK', 0.78));
  const halo = add(moon, sphere(2.96, COLORS.moon, 'FX_MOON_HALO', 0.6)); halo.scale.setScalar(1.02);
  const craters = [[-0.95, 0.7, 0.08], [0.72, 0.65, 0.14], [-0.28, -0.72, 0.1], [1.02, -0.45, 0.07], [-1.2, -0.3, 0.12], [0.15, 1.1, 0.06]];
  craters.forEach(([x, y, radius], index) => { const crater = add(moon, sphere(radius, index % 2 ? COLORS.moonShadow : 0xc1a975, `MOON_CRATER_${index}`, 0.99)); crater.position.set(x, y, 2.5); crater.scale.z = 0.12; });
  const clouds = add(moonPod, new THREE.Group()); clouds.name = 'FX_CLOUDS'; clouds.position.set(0, 0.9, -3.1);
  for (let index = 0; index < 8; index += 1) { const puff = add(clouds, sphere(0.56, COLORS.violet, `CLOUD_${index}`, 0.99)); puff.position.set(-5.2 + index * 1.35, Math.sin(index) * 0.2, 0); puff.scale.set(1.55, 0.38, 0.7); }
  const stars = add(moonPod, new THREE.Group()); stars.name = 'FX_STARS';
  for (let index = 0; index < 80; index += 1) { const star = add(stars, sphere(index % 7 === 0 ? 0.035 : 0.016, COLORS.moon, `STAR_${index}`, 0.75)); const angle = index * 2.399; const radius = 9 + (index % 11) * 0.72; star.position.set(Math.cos(angle) * radius, -1 + (index % 17) * 0.72, -8 - (index % 9) * 0.9); }

  // Pod 1 — gate.
  const gatePod = add(scene, new THREE.Group()); gatePod.name = 'pod_lunar_gate'; gatePod.position.z = 2;
  [-1.5, 1.5].forEach((x, index) => { const pillar = add(gatePod, mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.7, 14), material(COLORS.coral, 0.94), `GATE_PILLAR_${index}`)); pillar.position.set(x, 1.35, -2); });
  const arch = add(gatePod, mesh(new THREE.TorusGeometry(1.5, 0.13, 10, 36, Math.PI), material(COLORS.coral, 0.92), 'GATE_ARCH')); arch.position.set(0, 2.7, -2); arch.rotation.z = Math.PI;
  const gateLamp = add(gatePod, lantern('LANTERN_GATE', COLORS.moon)); gateLamp.position.set(0, 2.1, -1.7); gateLamp.scale.setScalar(0.72);

  // Pod 2/3 — the island and character guides.
  const islandPod = add(scene, new THREE.Group()); islandPod.name = 'pod_cuoi_hang'; islandPod.position.z = 4.3;
  const island = add(islandPod, mesh(new THREE.CylinderGeometry(5.6, 6.3, 0.45, 48), material(COLORS.earth, 0.99), 'ISLAND_BASE')); island.position.set(0, -0.24, -0.6);
  const lake = add(islandPod, mesh(new THREE.CircleGeometry(2.2, 40), material(COLORS.water, 0.95), 'LAKE_SURFACE')); lake.rotation.x = -Math.PI / 2; lake.position.set(2, 0.03, -1);
  const treeRoot = add(islandPod, new THREE.Group()); treeRoot.name = 'BANYAN_TREE'; treeRoot.position.set(-2, 0, -1);
  const trunk = add(treeRoot, mesh(new THREE.CylinderGeometry(0.17, 0.38, 2.5, 12), material(0x3a2b2e, 0.97), 'TREE_TRUNK')); trunk.position.y = 1.25; trunk.rotation.z = -0.08;
  for (let index = 0; index < 13; index += 1) { const leaf = add(treeRoot, sphere(0.58 + (index % 3) * 0.08, index % 3 === 0 ? COLORS.leafLight : COLORS.leaf, `TREE_LEAF_${index}`, 0.98)); leaf.position.set(Math.sin(index * 2.2) * 0.72, 2.18 + (index % 4) * 0.2, Math.cos(index * 1.6) * 0.46); leaf.scale.y = 0.62; }
  const cuoi = add(islandPod, character('CUOI', 0x75624a, 0x8c6a52)); cuoi.position.set(-1.1, 0, -1.1);
  const hang = add(islandPod, character('HANG', 0xd8b6a3, 0xd6ad9c, true)); hang.position.set(2.65, 0, -1.05); hang.scale.set(0.84, 1.1, 0.84);

  // Pod 4 — lantern street.
  const lanternPod = add(scene, new THREE.Group()); lanternPod.name = 'pod_lantern_street'; lanternPod.position.z = 6.6;
  for (let index = 0; index < 14; index += 1) { const light = add(lanternPod, lantern(`LANTERN_${String(index).padStart(2, '0')}`, index % 2 ? COLORS.coral : COLORS.moon)); light.position.set(-5.5 + index * 0.86, 0.7 + Math.sin(index) * 0.18, 1.1 + Math.cos(index * 1.3) * 0.55); light.rotation.y = (index % 3) * 0.12; }
  const couple = add(lanternPod, new THREE.Group()); couple.name = 'COUPLE_WALK'; couple.position.set(0, 0, 0.5);
  const walkA = add(couple, character('WALK_A', 0x4c3b5f, 0x9b7567)); walkA.position.set(-0.45, 0, -0.4); walkA.scale.setScalar(0.72);
  const walkB = add(couple, character('WALK_B', 0x6b4050, 0xd6ad9c, true)); walkB.position.set(0.45, 0, -0.4); walkB.scale.setScalar(0.72);

  // Pod 5/6 — memories and letter.
  const memoryPod = add(scene, new THREE.Group()); memoryPod.name = 'pod_memories'; memoryPod.position.z = 8.9;
  [-1.5, 0, 1.5].forEach((x, index) => { const card = add(memoryPod, roundedBox(1.18, 1.42, 0.08, [0xc88269, 0x8a78b5, 0xd3a95f][index], `MEMORY_FRAME_${index}`, 0.06)); card.position.set(x, 1.25 + (index % 2) * 0.18, 0.2); const inset = add(card, roundedBox(0.88, 0.88, 0.03, index === 1 ? 0x4d496c : 0x92776c, `MEMORY_IMAGE_${index}`, 0.03)); inset.position.set(0, 0.13, 0.065); });
  const letterPod = add(scene, new THREE.Group()); letterPod.name = 'pod_letter_stage'; letterPod.position.z = 12.3;
  const pedestal = add(letterPod, mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.42, 24), material(0x4e3d61, 0.97), 'LETTER_PEDESTAL')); pedestal.position.set(0, 0.18, -1.8);
  const envelope = add(letterPod, roundedBox(1.55, 0.95, 0.12, COLORS.paper, 'LETTER_ENVELOPE', 0.04)); envelope.position.set(0, 0.82, -1.8); envelope.rotation.z = -0.08;
  const seal = add(letterPod, sphere(0.14, COLORS.coral, 'FX_SEAL', 0.86)); seal.position.set(0.1, 0.82, -1.92);

  const idleTracks = [
    new THREE.VectorKeyframeTrack('CUOI_ROOT.position', [0, 1.8, 3.6], [-1.1, 0, -1.1, -1.1, 0.045, -1.1, -1.1, 0, -1.1]),
    new THREE.VectorKeyframeTrack('HANG_ROOT.position', [0, 1.8, 3.6], [2.65, 0, -1.05, 2.65, 0.055, -1.05, 2.65, 0, -1.05]),
    yQuaternionTrack('CUOI_ROOT', [0, 1.8, 3.6], [-0.02, 0.025, -0.02]),
    yQuaternionTrack('HANG_ROOT', [0, 1.8, 3.6], [0.02, -0.03, 0.02]),
  ];
  const lanternTracks = [];
  for (let index = 0; index < 14; index += 1) lanternTracks.push(zQuaternionTrack(`LANTERN_${String(index).padStart(2, '0')}`, [0, 1.2, 2.4], [-0.025, 0.045 + index * 0.002, -0.025]));
  const clips = [
    new THREE.AnimationClip('Idle', 3.6, idleTracks),
    new THREE.AnimationClip('LanternSway', 2.4, lanternTracks),
    new THREE.AnimationClip('CloudDrift', 4, [new THREE.NumberKeyframeTrack('FX_CLOUDS.position[x]', [0, 2, 4], [0, 0.5, 0])]),
    new THREE.AnimationClip('LetterOpen', 2, [new THREE.VectorKeyframeTrack('LETTER_ENVELOPE.scale', [0, 1, 2], [1, 1, 1, 1.02, 1.02, 1.02, 1, 1, 1])]),
  ];
  scene.animations = clips;
  return scene;
}

const scene = buildWorld();
const exporter = new GLTFExporter();
const result = await exporter.parseAsync(scene, { binary: true, animations: scene.animations });
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, Buffer.from(result));
console.log(`procedural blockout GLB: ${OUT} (${Buffer.byteLength(result)} bytes)`);
