import * as THREE from 'three';

const C = {
  night: 0x080b24,
  moon: 0xf4d99a,
  moonShadow: 0xb39a6b,
  violet: 0x6c648f,
  coral: 0xc86f5c,
  leaf: 0x1b3035,
  leafLight: 0x35504c,
  earth: 0x211b38,
  water: 0x1d3155,
  paper: 0xf0ddbc,
};

type Anchor = { position: THREE.Vector3; target: THREE.Vector3; at: number };
type Motion = {
  object: THREE.Object3D;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  amplitude: number;
  driftX: number;
  spin: number;
  speed: number;
  phase: number;
};

function matte(color: number, roughness = 0.84, emissive = 0, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity });
}

function softSphere(radius: number, color: number, roughness = 0.84) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 18), matte(color, roughness));
}

function lantern(color = C.coral) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.66, 16), matte(color, 0.88, color, 0.035));
  body.scale.z = 0.78;
  group.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.1, 12), matte(C.moon, 0.78));
  cap.position.y = 0.38;
  group.add(cap);
  const base = cap.clone();
  base.position.y = -0.38;
  group.add(base);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 6, 20), matte(C.moon, 0.82));
  band.rotation.x = Math.PI / 2;
  group.add(band);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 16, 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  group.add(glow);
  const point = new THREE.PointLight(color, 0.28, 2.6, 2);
  point.position.y = 0.02;
  group.add(point);
  return group;
}

function tree() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.38, 2.5, 12), matte(0x3a2b2e, 0.95));
  trunk.position.y = 1.25;
  trunk.rotation.z = -0.08;
  group.add(trunk);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.35, 10), matte(0x3a2b2e, 0.95));
  branch.position.set(0.32, 2.08, 0);
  branch.rotation.z = -0.7;
  group.add(branch);
  for (let index = 0; index < 13; index += 1) {
    const leaf = softSphere(0.58 + (index % 3) * 0.08, index % 3 === 0 ? C.leafLight : C.leaf, 0.98);
    leaf.position.set(Math.sin(index * 2.2) * 0.72, 2.18 + (index % 4) * 0.2, Math.cos(index * 1.6) * 0.46);
    leaf.scale.y = 0.62;
    group.add(leaf);
  }
  return group;
}

function character(color: number, isHang = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    isHang ? new THREE.ConeGeometry(0.52, 1.35, 16) : new THREE.CylinderGeometry(0.24, 0.34, 0.88, 14),
    matte(color, 0.94),
  );
  body.position.y = isHang ? 0.72 : 0.54;
  group.add(body);
  const head = softSphere(0.27, isHang ? 0xd6ad9c : 0x8c6a52, 0.94);
  head.position.y = 1.25;
  group.add(head);
  const hair = softSphere(isHang ? 0.31 : 0.28, isHang ? 0x2d2232 : 0x2a2028, 0.98);
  hair.position.set(0, 1.34, -0.05);
  hair.scale.set(1, 1.16, 0.65);
  group.add(hair);
  const eyeMaterial = matte(0x171522, 0.7);
  for (const x of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), eyeMaterial);
    eye.position.set(x, 1.27, 0.235);
    group.add(eye);
  }
  const armMaterial = matte(isHang ? 0xd6ad9c : color, 0.95);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.28, 5, 10), armMaterial);
    arm.position.set(side * 0.32, 0.78, 0);
    arm.rotation.z = side * -0.5;
    group.add(arm);
  }
  if (isHang) {
    const sleeve = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 8, 20), matte(0xd6ad9c, 0.95));
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.y = 0.78;
    group.add(sleeve);
    const hairRibbon = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 18), matte(C.coral, 0.9));
    hairRibbon.rotation.x = Math.PI / 2;
    hairRibbon.position.set(0, 1.42, -0.03);
    group.add(hairRibbon);
  } else {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.32, 12), matte(0x5f4e4a, 0.98));
    hat.position.y = 1.56;
    group.add(hat);
    const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 16), matte(C.moon, 0.86));
    hatBand.rotation.x = Math.PI / 2;
    hatBand.position.y = 1.48;
    group.add(hatBand);
  }
  return group;
}

function stars() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xf6d88b, transparent: true, opacity: 0.78 });
  for (let index = 0; index < 150; index += 1) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(index % 7 === 0 ? 0.032 : 0.014, 6, 4), material);
    const angle = (index * 2.399) % (Math.PI * 2);
    const radius = 10 + (index % 13) * 0.72;
    star.position.set(Math.cos(angle) * radius, -1 + (index % 17) * 0.72, -7 - (index % 11) * 0.9);
    group.add(star);
  }
  return { group, material };
}

function memoryCard(index: number) {
  const group = new THREE.Group();
  const colors = [0xc88269, 0x8a78b5, 0xd3a95f];
  const card = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.42, 0.08), matte(colors[index], 0.96));
  group.add(card);
  const inset = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.88, 0.03), matte(index === 1 ? 0x4d496c : 0x92776c, 0.98));
  inset.position.set(0, 0.13, 0.065);
  group.add(inset);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matte(C.moon, 0.76));
  pin.position.set(0, 0.62, 0.12);
  group.add(pin);
  return group;
}

export type SceneRuntimeOptions = { canvas: HTMLCanvasElement; reducedMotion?: boolean };

export class MoonlitSceneRuntime {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  readonly renderer: THREE.WebGLRenderer;
  private readonly root = new THREE.Group();
  private readonly anchors: Anchor[] = [];
  private readonly motions: Motion[] = [];
  private readonly lookTarget = new THREE.Vector3();
  private readonly clock = new THREE.Clock();
  private readonly reduced: boolean;
  private starMaterial: THREE.MeshBasicMaterial | null = null;
  private moonGlow: THREE.Mesh | null = null;
  private raf = 0;
  private current = 0;
  private target = 0;
  private lastTime = 0;

  constructor(options: SceneRuntimeOptions) {
    this.reduced = Boolean(options.reducedMotion);
    this.scene.background = new THREE.Color(C.night);
    this.scene.fog = new THREE.FogExp2(C.night, 0.024);
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.add(new THREE.HemisphereLight(0x6675b4, 0x20152c, 1.25));
    const moonKey = new THREE.DirectionalLight(0xffe7b2, 2.2);
    moonKey.position.set(-5, 9, 7);
    moonKey.castShadow = true;
    moonKey.shadow.mapSize.set(1024, 1024);
    moonKey.shadow.bias = -0.0004;
    this.scene.add(moonKey);
    const warmFill = new THREE.PointLight(0xd9795c, 0.62, 12, 2);
    warmFill.position.set(3, 2, 5);
    this.scene.add(warmFill);
    this.build();
    this.resize();
    window.addEventListener('resize', this.resize);
    this.lastTime = performance.now();
    this.render();
  }

  private registerMotion(object: THREE.Object3D, options: Partial<Omit<Motion, 'object' | 'basePosition' | 'baseRotation'>> = {}) {
    this.motions.push({
      object,
      basePosition: object.position.clone(),
      baseRotation: object.rotation.clone(),
      amplitude: options.amplitude ?? 0.04,
      driftX: options.driftX ?? 0,
      spin: options.spin ?? 0.03,
      speed: options.speed ?? 1,
      phase: options.phase ?? this.motions.length * 0.73,
    });
  }

  private build() {
    const starField = stars();
    this.starMaterial = starField.material;
    this.scene.add(starField.group);
    const moonLayer = new THREE.Group();
    const moon = new THREE.Group();
    const disk = new THREE.Mesh(new THREE.SphereGeometry(2.62, 64, 40), matte(C.moon, 0.74, 0x6a4f27, 0.055));
    disk.position.set(0, 4.25, -5.7);
    moon.add(disk);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xf4d99a, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false });
    this.moonGlow = new THREE.Mesh(new THREE.SphereGeometry(3.05, 32, 20), glowMaterial);
    this.moonGlow.position.copy(disk.position);
    moon.add(this.moonGlow);
    const craterSpecs = [[-0.95, 0.7, 0.08], [0.72, 0.65, 0.14], [-0.28, -0.72, 0.1], [1.02, -0.45, 0.07], [-1.2, -0.3, 0.12], [0.15, 1.1, 0.06]];
    craterSpecs.forEach(([x, y, radius], index) => {
      const crater = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), matte(index % 2 ? C.moonShadow : 0xc1a975, 0.99));
      crater.position.set(x, 4.25 + y, -3.22);
      crater.scale.z = 0.12;
      moon.add(crater);
    });
    moonLayer.add(moon);
    const cloud = new THREE.Group();
    for (let index = 0; index < 8; index += 1) {
      const puff = softSphere(0.56, C.violet, 0.99);
      puff.position.set(-5.2 + index * 1.35, 1.1 + Math.sin(index) * 0.2, -3.1);
      puff.scale.set(1.55, 0.38, 0.7);
      cloud.add(puff);
    }
    moonLayer.add(cloud);
    this.registerMotion(cloud, { amplitude: 0.025, driftX: 0.26, speed: 0.16, phase: 1.1 });
    this.root.add(moonLayer);

    const gate = new THREE.Group();
    gate.position.z = 2;
    for (const x of [-1.5, 1.5]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 2.7, 12), matte(C.coral, 0.94));
      pillar.position.set(x, 1.35, -2);
      gate.add(pillar);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 10, 36, Math.PI), matte(C.coral, 0.92));
    arch.position.set(0, 2.7, -2);
    arch.rotation.z = Math.PI;
    gate.add(arch);
    const gateLamp = lantern(C.moon);
    gateLamp.position.set(0, 2.1, -1.7);
    gateLamp.scale.setScalar(0.72);
    gate.add(gateLamp);
    this.registerMotion(gateLamp, { amplitude: 0.05, spin: 0.08, speed: 1.1, phase: 0.4 });
    this.root.add(gate);

    const castLayer = new THREE.Group();
    castLayer.position.z = 4.3;
    const island = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.3, 0.45, 48), matte(C.earth, 0.99));
    island.position.set(0, -0.24, -0.6);
    island.receiveShadow = true;
    castLayer.add(island);
    const lake = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), matte(C.water, 0.94));
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(2, 0.03, -1);
    lake.receiveShadow = true;
    castLayer.add(lake);
    const oldTree = tree();
    oldTree.position.set(-2, 0, -1);
    oldTree.traverse((object) => { if (object instanceof THREE.Mesh) object.castShadow = true; });
    castLayer.add(oldTree);
    this.registerMotion(oldTree, { amplitude: 0.018, spin: 0.025, speed: 0.72, phase: 0.8 });
    const cuoi = character(0x75624a);
    cuoi.position.set(-1.1, 0, -1.1);
    castLayer.add(cuoi);
    this.registerMotion(cuoi, { amplitude: 0.045, spin: 0.018, speed: 1.25, phase: 1.6 });
    const hang = character(0xd8b6a3, true);
    hang.position.set(2.65, 0, -1.05);
    hang.scale.set(0.84, 1.1, 0.84);
    castLayer.add(hang);
    this.registerMotion(hang, { amplitude: 0.055, spin: -0.022, speed: 1.05, phase: 2.2 });
    this.root.add(castLayer);

    const lanternLayer = new THREE.Group();
    lanternLayer.position.z = 6.6;
    for (let index = 0; index < 14; index += 1) {
      const light = lantern(index % 2 ? C.coral : C.moon);
      light.position.set(-5.5 + index * 0.86, 0.7 + Math.sin(index) * 0.18, 1.1 + Math.cos(index * 1.3) * 0.55);
      light.rotation.y = (index % 3) * 0.12;
      lanternLayer.add(light);
      this.registerMotion(light, { amplitude: 0.055 + (index % 3) * 0.01, spin: 0.1, speed: 0.75 + (index % 3) * 0.12, phase: index * 0.48 });
    }
    this.root.add(lanternLayer);

    const memories = new THREE.Group();
    memories.position.z = 8.9;
    [-1.5, 0, 1.5].forEach((x, index) => {
      const card = memoryCard(index);
      card.position.set(x, 1.25 + (index % 2) * 0.18, 0.2);
      card.rotation.y = (index - 1) * 0.13;
      memories.add(card);
      this.registerMotion(card, { amplitude: 0.045, spin: 0.028, speed: 0.58 + index * 0.08, phase: index * 0.9 });
    });
    this.root.add(memories);

    const letterStage = new THREE.Group();
    letterStage.position.z = 12.3;
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.25, 0.42, 24), matte(0x4e3d61, 0.96));
    pedestal.position.set(0, 0.18, -1.8);
    letterStage.add(pedestal);
    const envelope = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.95, 0.12), matte(C.paper, 0.99));
    envelope.position.set(0, 0.82, -1.8);
    envelope.rotation.z = -0.08;
    letterStage.add(envelope);
    const seal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), matte(C.coral, 0.88));
    seal.position.set(0.1, 0.82, -1.92);
    letterStage.add(seal);
    this.registerMotion(envelope, { amplitude: 0.035, spin: 0.018, speed: 0.66, phase: 2.8 });
    this.root.add(letterStage);
    this.scene.add(this.root);

    this.anchors.push(
      { at: 0, position: new THREE.Vector3(0, 3.1, 13.5), target: new THREE.Vector3(0, 3.8, -5.7) },
      { at: 0.12, position: new THREE.Vector3(0.05, 3.55, 4.5), target: new THREE.Vector3(0, 4.1, -5.7) },
      { at: 0.24, position: new THREE.Vector3(0, 4.15, -0.3), target: new THREE.Vector3(0, 4.25, -5.7) },
      { at: 0.36, position: new THREE.Vector3(0.65, 2.35, 3.1), target: new THREE.Vector3(0, 1.35, 0) },
      { at: 0.52, position: new THREE.Vector3(-2.4, 2.2, 5.7), target: new THREE.Vector3(0.6, 1.2, 3.3) },
      { at: 0.68, position: new THREE.Vector3(0.25, 2.25, 9.9), target: new THREE.Vector3(0, 1.0, 7.7) },
      { at: 0.84, position: new THREE.Vector3(0, 2.6, 12), target: new THREE.Vector3(0, 1.25, 9.1) },
      { at: 1, position: new THREE.Vector3(0, 2.9, 13.2), target: new THREE.Vector3(0, 0.9, 10.5) },
    );
    this.camera.position.copy(this.anchors[0].position);
    this.camera.lookAt(this.anchors[0].target);
  }

  resize = () => {
    const width = this.renderer.domElement.clientWidth || window.innerWidth;
    const height = this.renderer.domElement.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  setProgress(progress: number) {
    this.target = THREE.MathUtils.clamp(progress, 0, 1);
    if (this.reduced) {
      this.current = this.target;
      this.applyCamera(this.current);
    }
  }

  private applyCamera(progress: number) {
    let left = this.anchors[0];
    let right = this.anchors[this.anchors.length - 1];
    for (let index = 0; index < this.anchors.length - 1; index += 1) {
      if (progress >= this.anchors[index].at && progress <= this.anchors[index + 1].at) {
        left = this.anchors[index];
        right = this.anchors[index + 1];
        break;
      }
    }
    const raw = THREE.MathUtils.clamp((progress - left.at) / Math.max(0.001, right.at - left.at), 0, 1);
    const eased = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
    this.camera.position.lerpVectors(left.position, right.position, eased);
    this.lookTarget.lerpVectors(left.target, right.target, eased);
    this.camera.lookAt(this.lookTarget);
    this.root.rotation.y = THREE.MathUtils.lerp(-0.035, 0.035, progress);
    this.root.position.x = Math.sin(progress * Math.PI) * 0.16;
  }

  private animateWorld(time: number) {
    if (this.reduced) return;
    for (const motion of this.motions) {
      const wave = Math.sin(time * motion.speed + motion.phase);
      motion.object.position.set(motion.basePosition.x + wave * motion.driftX, motion.basePosition.y + wave * motion.amplitude, motion.basePosition.z);
      motion.object.rotation.set(motion.baseRotation.x + wave * motion.amplitude * 0.22, motion.baseRotation.y + wave * motion.spin, motion.baseRotation.z + wave * motion.amplitude * 0.35);
    }
    if (this.starMaterial) this.starMaterial.opacity = 0.72 + Math.sin(time * 1.55) * 0.1;
    if (this.moonGlow) this.moonGlow.scale.setScalar(1 + Math.sin(time * 0.42) * 0.018);
  }

  private render = () => {
    const now = performance.now();
    const delta = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    if (!this.reduced) this.current += (this.target - this.current) * (1 - Math.exp(-delta * 8));
    this.applyCamera(this.current);
    this.animateWorld(this.clock.getElapsedTime());
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.render);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.scene.clear();
  }
}
