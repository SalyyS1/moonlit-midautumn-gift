import * as THREE from 'three';

const C = {
  night: 0x080b24, moon: 0xf4d99a, moonShadow: 0xb39a6b, violet: 0x6c648f,
  coral: 0xc86f5c, leaf: 0x1b3035, leafLight: 0x35504c, earth: 0x211b38,
  water: 0x1d3155, paper: 0xf0ddbc,
};
type Anchor = { position: THREE.Vector3; target: THREE.Vector3; at: number };

function matte(color: number, roughness = 0.84, emissive = 0, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity });
}
function softSphere(radius: number, color: number, roughness = 0.84) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 18), matte(color, roughness));
}
function lantern(color = C.coral) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.66, 12), matte(color, 0.78));
  body.scale.z = 0.78; group.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.1, 10), matte(C.moon, 0.72));
  cap.position.y = 0.38; group.add(cap);
  const base = cap.clone(); base.position.y = -0.38; group.add(base);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 6, 16), matte(C.moon, 0.74));
  band.rotation.x = Math.PI / 2; group.add(band);
  const glow = new THREE.PointLight(color, 0.38, 2.4, 2); glow.position.y = 0.02; group.add(glow);
  return group;
}
function tree() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.38, 2.5, 9), matte(0x3a2b2e, 0.9));
  trunk.position.y = 1.25; trunk.rotation.z = -0.08; group.add(trunk);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.35, 8), matte(0x3a2b2e, 0.9));
  branch.position.set(0.32, 2.08, 0); branch.rotation.z = -0.7; group.add(branch);
  for (let i = 0; i < 11; i += 1) {
    const leaf = softSphere(0.6 + (i % 3) * 0.08, i % 3 === 0 ? C.leafLight : C.leaf, 0.95);
    leaf.position.set(Math.sin(i * 2.2) * 0.72, 2.18 + (i % 4) * 0.2, Math.cos(i * 1.6) * 0.46);
    leaf.scale.y = 0.62; group.add(leaf);
  }
  return group;
}
function character(color: number, isHang = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(isHang ? new THREE.ConeGeometry(0.52, 1.35, 12) : new THREE.CylinderGeometry(0.24, 0.34, 0.88, 10), matte(color, 0.9));
  body.position.y = isHang ? 0.72 : 0.54; group.add(body);
  const head = softSphere(0.25, isHang ? 0xd6ad9c : 0x75624a, 0.88); head.position.y = 1.25; group.add(head);
  if (isHang) {
    const hair = softSphere(0.29, 0x2d2232, 0.95); hair.position.set(0, 1.33, -0.04); hair.scale.set(1, 1.18, 0.62); group.add(hair);
    const sleeve = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 6, 16), matte(0xd6ad9c, 0.9));
    sleeve.rotation.x = Math.PI / 2; sleeve.position.y = 0.78; group.add(sleeve);
  } else {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.32, 8), matte(0x5f4e4a, 0.96)); hat.position.y = 1.56; group.add(hat);
  }
  return group;
}
function stars() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xf6d88b, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 110; i += 1) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(i % 7 === 0 ? 0.032 : 0.014, 6, 4), material);
    const angle = (i * 2.399) % (Math.PI * 2); const radius = 10 + (i % 13) * 0.72;
    star.position.set(Math.cos(angle) * radius, -1 + (i % 17) * 0.72, -7 - (i % 11) * 0.9); group.add(star);
  }
  return group;
}
function memoryCard(index: number) {
  const group = new THREE.Group(); const colors = [0xc88269, 0x8a78b5, 0xd3a95f];
  const card = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.42, 0.08), matte(colors[index], 0.92)); group.add(card);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.88, 0.03), matte(index === 1 ? 0x4d496c : 0x92776c, 0.95));
  inset.position.set(0, 0.13, 0.065); group.add(inset);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matte(C.moon, 0.7)); pin.position.set(0, 0.62, 0.12); group.add(pin);
  return group;
}

export type SceneRuntimeOptions = { canvas: HTMLCanvasElement; reducedMotion?: boolean };
export class MoonlitSceneRuntime {
  readonly scene = new THREE.Scene(); readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); readonly renderer: THREE.WebGLRenderer;
  private root = new THREE.Group(); private anchors: Anchor[] = []; private reduced = false; private raf = 0; private current = 0; private target = 0;
  private sceneLayers: Array<{ group: THREE.Group; start: number; end: number }> = [];
  constructor(options: SceneRuntimeOptions) {
    this.reduced = Boolean(options.reducedMotion); this.scene.background = new THREE.Color(C.night); this.scene.fog = new THREE.FogExp2(C.night, 0.018);
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.add(new THREE.HemisphereLight(0x6675b4, 0x20152c, 1.25));
    const moonKey = new THREE.DirectionalLight(0xffe7b2, 2.2); moonKey.position.set(-5, 9, 7); moonKey.castShadow = true; moonKey.shadow.mapSize.set(1024, 1024); moonKey.shadow.bias = -0.0004; this.scene.add(moonKey);
    const warmFill = new THREE.PointLight(0xd9795c, 0.7, 9, 2); warmFill.position.set(3, 2, 3); this.scene.add(warmFill);
    this.build(); this.resize(); window.addEventListener('resize', this.resize); this.render();
  }
  private build() {
    this.scene.add(stars());
    const moonLayer = new THREE.Group();
    const moon = new THREE.Group();
    const disk = new THREE.Mesh(new THREE.SphereGeometry(2.62, 64, 40), matte(C.moon, 0.68, 0x6a4f27, 0.08)); disk.position.set(0, 4.25, -5.7); moon.add(disk);
    const craterSpecs = [[-0.95, 0.7, 0.08], [0.72, 0.65, 0.14], [-0.28, -0.72, 0.1], [1.02, -0.45, 0.07], [-1.2, -0.3, 0.12], [0.15, 1.1, 0.06]];
    craterSpecs.forEach(([x, y, r], index) => { const crater = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), matte(index % 2 ? C.moonShadow : 0xc1a975, 0.98)); crater.position.set(x, 4.25 + y, -3.22); crater.scale.z = 0.12; moon.add(crater); });
    moonLayer.add(moon);
    const cloud = new THREE.Group(); for (let i = 0; i < 8; i += 1) { const puff = softSphere(0.56, C.violet, 0.98); puff.position.set(-5.2 + i * 1.35, 1.1 + Math.sin(i) * 0.2, -3.1); puff.scale.set(1.55, 0.38, 0.7); cloud.add(puff); } moonLayer.add(cloud); this.root.add(moonLayer);
    const gate = new THREE.Group();
    for (const x of [-1.5, 1.5]) { const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 2.7, 10), matte(C.coral, 0.9)); pillar.position.set(x, 1.35, -2); gate.add(pillar); }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 8, 32, Math.PI), matte(C.coral, 0.88)); arch.position.set(0, 2.7, -2); arch.rotation.z = Math.PI; gate.add(arch);
    const gateLamp = lantern(C.moon); gateLamp.position.set(0, 2.1, -1.7); gateLamp.scale.setScalar(0.72); gate.add(gateLamp); this.root.add(gate);
    const castLayer = new THREE.Group();
    const island = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.3, 0.45, 48), matte(C.earth, 0.98)); island.position.set(0, -0.24, -0.6); island.receiveShadow = true; castLayer.add(island);
    const lake = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), matte(C.water, 0.92)); lake.rotation.x = -Math.PI / 2; lake.position.set(2, 0.03, -1); lake.receiveShadow = true; castLayer.add(lake);
    const oldTree = tree(); oldTree.position.set(-2, 0, -1); oldTree.traverse((object) => { if (object instanceof THREE.Mesh) object.castShadow = true; }); castLayer.add(oldTree);
    const cuoi = character(0x75624a); cuoi.position.set(-1.1, 0, -1.1); castLayer.add(cuoi);
    const hang = character(0xd8b6a3, true); hang.position.set(2.65, 0, -1.05); hang.scale.set(0.84, 1.1, 0.84); castLayer.add(hang); this.root.add(castLayer);
    const lanternLayer = new THREE.Group();
    for (let i = 0; i < 12; i += 1) { const light = lantern(i % 2 ? C.coral : C.moon); light.position.set(-5.5 + i * 1.05, 0.7 + Math.sin(i) * 0.18, 1.1 + Math.cos(i * 1.3) * 0.55); light.rotation.y = (i % 3) * 0.12; lanternLayer.add(light); } this.root.add(lanternLayer);
    const memories = new THREE.Group(); [-1.5, 0, 1.5].forEach((x, index) => { const card = memoryCard(index); card.position.set(x, 1.25 + (index % 2) * 0.18, 0.2); card.rotation.y = (index - 1) * 0.13; memories.add(card); }); this.root.add(memories);
    const letterStage = new THREE.Group();
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.42, 24), matte(0x4e3d61, 0.94)); pedestal.position.set(0, 0.18, -1.8); letterStage.add(pedestal);
    const envelope = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.95, 0.12), matte(C.paper, 0.96)); envelope.position.set(0, 0.82, -1.8); envelope.rotation.z = -0.08; letterStage.add(envelope);
    const seal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), matte(C.coral, 0.84)); seal.position.set(0.1, 0.82, -1.92); letterStage.add(seal); this.root.add(letterStage); this.scene.add(this.root);
    this.anchors = [
      { at: 0, position: new THREE.Vector3(0, 2.8, 12), target: new THREE.Vector3(0, 3.8, -5.7) },
      { at: 0.12, position: new THREE.Vector3(0.05, 3.35, 5.1), target: new THREE.Vector3(0, 4.1, -5.7) },
      { at: 0.24, position: new THREE.Vector3(0, 4.02, 0.05), target: new THREE.Vector3(0, 4.25, -5.7) },
      { at: 0.36, position: new THREE.Vector3(0.65, 2.1, 1.05), target: new THREE.Vector3(0, 1.35, -2) },
      { at: 0.52, position: new THREE.Vector3(-2.4, 2.05, 1.15), target: new THREE.Vector3(0.6, 1.2, -1) },
      { at: 0.68, position: new THREE.Vector3(0.25, 1.95, 4.45), target: new THREE.Vector3(0, 1.0, 1.4) },
      { at: 0.84, position: new THREE.Vector3(0, 2.4, 3.0), target: new THREE.Vector3(0, 1.25, 0.2) },
      { at: 1, position: new THREE.Vector3(0, 2.5, 1.05), target: new THREE.Vector3(0, 0.9, -1.8) },
    ];
    this.camera.position.copy(this.anchors[0].position); this.camera.lookAt(this.anchors[0].target);
    this.sceneLayers = [
      { group: moonLayer, start: 0, end: 0.32 }, { group: gate, start: 0.18, end: 0.48 },
      { group: castLayer, start: 0.32, end: 0.67 }, { group: lanternLayer, start: 0.5, end: 0.84 },
      { group: memories, start: 0.68, end: 0.96 }, { group: letterStage, start: 0.82, end: 1 },
    ];
    this.updateLayerVisibility(0);
  }
  resize = () => { const width = this.renderer.domElement.clientWidth || window.innerWidth; const height = this.renderer.domElement.clientHeight || window.innerHeight; this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false); };
  setProgress(progress: number) {
    const value = THREE.MathUtils.clamp(progress, 0, 1); this.target = value; if (this.reduced) this.current = value; else this.current += (this.target - this.current) * 0.13;
    const p = this.current; if (this.reduced) { this.camera.position.copy(this.anchors[0].position); this.camera.lookAt(this.anchors[0].target); this.updateLayerVisibility(p); return; }
    let left = this.anchors[0]; let right = this.anchors[this.anchors.length - 1];
    for (let index = 0; index < this.anchors.length - 1; index += 1) { if (p >= this.anchors[index].at && p <= this.anchors[index + 1].at) { left = this.anchors[index]; right = this.anchors[index + 1]; break; } }
    const raw = THREE.MathUtils.clamp((p - left.at) / Math.max(0.001, right.at - left.at), 0, 1); const eased = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
    this.camera.position.lerpVectors(left.position, right.position, eased); this.camera.lookAt(new THREE.Vector3().lerpVectors(left.target, right.target, eased));
    this.updateLayerVisibility(p);
    this.root.rotation.y = THREE.MathUtils.lerp(-0.035, 0.035, p); this.root.position.x = Math.sin(p * Math.PI) * 0.16;
  }
  private updateLayerVisibility(progress: number) {
    this.sceneLayers.forEach(({ group, start, end }) => {
      const enter = start === 0 ? 1 : THREE.MathUtils.clamp((progress - start) / 0.055, 0, 1);
      const leave = end === 1 ? 1 : THREE.MathUtils.clamp((end - progress) / 0.055, 0, 1);
      const amount = Math.min(enter, leave);
      group.visible = amount > 0.02;
      group.scale.setScalar(0.88 + amount * 0.12);
      group.position.y = (1 - amount) * 0.22;
    });
  }
  private render = () => { this.renderer.render(this.scene, this.camera); this.raf = requestAnimationFrame(this.render); };
  dispose() { cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.resize); this.renderer.dispose(); this.scene.clear(); }
}
