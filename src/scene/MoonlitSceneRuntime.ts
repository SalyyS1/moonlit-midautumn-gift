import * as THREE from 'three';

const C = { night: 0x080b24, moon: 0xf6d88b, violet: 0x8a78b4, coral: 0xd9795c, leaf: 0x243e4a };

function mat(color: number, emissive = 0) { return new THREE.MeshStandardMaterial({ color, roughness: 0.82, emissive, emissiveIntensity: emissive ? 0.22 : 0 }); }
function sphere(r: number, color: number) { return new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(color)); }
function lantern(color = C.coral) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.36, 12, 8), mat(color, color)); body.scale.set(.72, 1, .72); g.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, .1, 10), mat(C.moon)); cap.position.y = .38; g.add(cap);
  const glow = new THREE.PointLight(color, 0.65, 3); glow.position.y = .1; g.add(glow); return g;
}
function character(color: number) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,.8,8), mat(color)); body.position.y=.55; g.add(body); const head=sphere(.24,color); head.position.y=1.15; g.add(head); return g; }
function tree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .32, 2.2, 8), mat(0x40302d)); trunk.position.y = 1.1; g.add(trunk);
  for (let i = 0; i < 8; i++) { const l = sphere(.65, C.leaf); l.position.set(Math.sin(i * 2.3) * .65, 2.1 + (i % 3) * .22, Math.cos(i * 1.7) * .5); l.scale.y = .7; g.add(l); } return g;
}
function starField() { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: C.moon }); for (let i=0;i<90;i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(i%5===0?.025:.012, 6, 4), m); const a=Math.random()*Math.PI*2, r=9+Math.random()*9; s.position.set(Math.cos(a)*r, -1+Math.random()*12, Math.sin(a)*r-5); g.add(s); } return g; }

export type SceneRuntimeOptions = { canvas: HTMLCanvasElement; reducedMotion?: boolean };
export class MoonlitSceneRuntime {
  readonly scene = new THREE.Scene(); readonly camera = new THREE.PerspectiveCamera(38, 1, .1, 100); readonly renderer: THREE.WebGLRenderer;
  private root = new THREE.Group(); private anchors: THREE.Vector3[] = []; private lookAt = new THREE.Vector3(0, 1, 0); private reduced = false; private raf = 0;
  constructor(opts: SceneRuntimeOptions) {
    this.reduced = !!opts.reducedMotion; this.scene.background = new THREE.Color(C.night);
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: false }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true;
    this.scene.add(new THREE.AmbientLight(0x7f8bc9, 1.4)); const moonLight = new THREE.DirectionalLight(C.moon, 2.2); moonLight.position.set(-4, 8, 5); moonLight.castShadow = true; this.scene.add(moonLight);
    this.build(); this.resize(); addEventListener('resize', this.resize); this.render();
  }
  private build() {
    this.scene.add(starField());
    const moon = sphere(2.6, C.moon); moon.position.set(0, 4.5, -6); this.root.add(moon);
    const cloud = new THREE.Group(); for(let i=0;i<7;i++){const c=sphere(.55,C.violet); c.position.set(-5+i*1.4, 1+Math.sin(i)*.25, -2); c.scale.set(1.4,.45,.65); cloud.add(c);} this.root.add(cloud);
    const gate = new THREE.Group(); for (const x of [-1.5,1.5]) { const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,2.6,8),mat(C.coral)); p.position.set(x,1.3,-2); gate.add(p); } const arch=new THREE.Mesh(new THREE.TorusGeometry(1.5,.12,8,24,Math.PI),mat(C.coral)); arch.position.set(0,2.6,-2); arch.rotation.z=Math.PI; gate.add(arch); this.root.add(gate);
    const t=tree(); t.position.set(-2,0,-1); this.root.add(t); const cuoi=character(0x75624a); cuoi.position.set(-1.2,0,-1); this.root.add(cuoi); const hang=character(0xd8b6a3); hang.position.set(2.8,0,-1); hang.scale.set(.8,1.15,.8); this.root.add(hang); const lake=new THREE.Mesh(new THREE.CircleGeometry(2.2,32),new THREE.MeshStandardMaterial({color:0x273b69,roughness:.25,metalness:.2})); lake.rotation.x=-Math.PI/2; lake.position.set(2,.03,-1); this.root.add(lake);
    for(let i=0;i<10;i++){const l=lantern(i%2?C.coral:C.moon); l.position.set(-5+i*1.1,.8+Math.sin(i)*.18,1.5+Math.cos(i)*.4); this.root.add(l);}
    for(let i=0;i<3;i++){const l=lantern(C.coral); l.position.set(-1.8+i*1.8,1.1,2); this.root.add(l);}
    this.scene.add(this.root);
    this.anchors=[new THREE.Vector3(0,2.6,9),new THREE.Vector3(0,2.2,6),new THREE.Vector3(-2,2.1,4),new THREE.Vector3(0,1.9,2),new THREE.Vector3(0,2.4,.2),new THREE.Vector3(0,2.8,-1.8)];
    this.camera.position.copy(this.anchors[0]);
  }
  resize = () => { const w=this.renderer.domElement.clientWidth||innerWidth,h=this.renderer.domElement.clientHeight||innerHeight; this.camera.aspect=w/h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w,h,false); };
  setProgress(progress: number, _sceneIndex?: number, _localProgress?: number) { const p=Math.max(0,Math.min(1,progress)); if (this.reduced) { this.camera.position.copy(this.anchors[0]); this.camera.lookAt(this.lookAt); return; } const scaled=p*(this.anchors.length-1), i=Math.min(this.anchors.length-2,Math.floor(scaled)), t=scaled-i; this.camera.position.lerpVectors(this.anchors[i],this.anchors[i+1],t); this.camera.lookAt(this.lookAt); this.root.rotation.y = (p-.5)*.08; }
  private render = () => { this.renderer.render(this.scene,this.camera); this.raf=requestAnimationFrame(this.render); };
  dispose() { cancelAnimationFrame(this.raf); removeEventListener('resize',this.resize); this.renderer.dispose(); this.scene.clear(); }
}


