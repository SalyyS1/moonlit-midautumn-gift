import * as THREE from 'three';
import { AssetLoader } from './AssetLoader';
import { AnimationDirector } from './AnimationDirector';
import { CameraRail } from './CameraRail';
import { CAMERA_KNOTS } from './camera-sheet';
import { installMoonlitLighting } from './lighting';
import { MotionMixer } from './MotionMixer';
import { getPerformanceBudget } from './PerformanceBudget';
import { disposeResources } from './dispose-resources';
import { SceneRegistry } from './SceneRegistry';
import { Timeline } from './Timeline';
import { worldBeats, worldManifest } from './manifest';
import { optimizeStaticGeometry } from './optimize-static-geometry';

export type SceneRuntimeOptions = { canvas: HTMLCanvasElement; reducedMotion?: boolean };
type DebugCanvas = HTMLCanvasElement & { __moonlitRuntime?: ScrollWorldRuntime };

export class ScrollWorldRuntime {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 1, .1, 180);
  readonly renderer: THREE.WebGLRenderer;
  private readonly rail = new CameraRail(CAMERA_KNOTS);
  private readonly timeline = new Timeline(worldManifest.timeline, worldBeats);
  private readonly loader = new AssetLoader();
  private readonly lookMatrix = new THREE.Matrix4();
  private readonly orientation = new THREE.Quaternion();
  private readonly anticipated = new THREE.Quaternion();
  private readonly rollRotation = new THREE.Quaternion();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly zAxis = new THREE.Vector3(0, 0, 1);
  private readonly reduced: boolean;
  private readonly canvas: DebugCanvas;
  private registry: SceneRegistry | null = null;
  private animations: AnimationDirector | null = null;
  private motion: MotionMixer | null = null;
  private targetProgress = 0;
  private currentProgress = 0;
  private raf = 0;
  private disposed = false;
  private ready = false;
  private frameCount = 0;
  private lastTime = 0;
  private elapsed = 0;
  private gpu = 'unknown';
  private letterRevealed = false;
  private readonly updateLighting: (target: THREE.Vector3) => void;

  constructor(options: SceneRuntimeOptions) {
    this.canvas = options.canvas;
    this.reduced = Boolean(options.reducedMotion);
    delete this.canvas.dataset.sceneReady; delete this.canvas.dataset.sceneError;
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    const budget = getPerformanceBudget(this.reduced, window.devicePixelRatio);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, budget.maxDpr));
    this.renderer.shadowMap.enabled = budget.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.updateLighting = installMoonlitLighting(this.scene);
    this.resize();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.addEventListener('webglcontextlost', this.onContextLost);
    if (import.meta.env.DEV || import.meta.env.VITE_SCENE_DEBUG === '1') {
      this.canvas.__moonlitRuntime = this;
      const gl = this.renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
      this.gpu = String(gl.getParameter(info?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
    }
    this.draw(0);
    void this.loadWorld();
  }

  setTargetProgress(progress: number) {
    this.targetProgress = THREE.MathUtils.clamp(Number.isNaN(progress) ? 0 : progress, 0, 1);
    if (this.reduced) { this.currentProgress = this.targetProgress; this.draw(0); }
  }
  setProgress(progress: number) { this.setTargetProgress(progress); }

  // Used by capture tooling only; production users drive targetProgress via scroll.
  seek(progress: number) {
    this.setTargetProgress(progress); this.currentProgress = this.targetProgress; this.draw(0);
  }

  private async loadWorld() {
    try {
      const world = await this.loader.loadWorld((loaded, total) => {
        if (!this.disposed) this.canvas.dispatchEvent(new CustomEvent('world-loading', { detail: { loaded, total } }));
      });
      if (this.disposed) { disposeResources(world.scene); return; }
      try { this.registry = new SceneRegistry(world); }
      catch (error) { disposeResources(world.scene); throw error; }
      this.scene.add(this.registry.root);
      optimizeStaticGeometry(this.registry.root, world.animations);
      this.animations = new AnimationDirector(this.registry.root, world.animations, this.reduced);
      this.motion = new MotionMixer(this.registry.root, this.reduced);
      this.currentProgress = this.targetProgress;
      this.draw(0);
      this.ready = true;
      this.canvas.dataset.sceneReady = 'true';
      this.canvas.dispatchEvent(new CustomEvent('world-ready'));
      this.schedule();
    } catch (error) {
      if (this.disposed) return;
      this.fail(error instanceof Error ? error.message : 'Không tải được mô hình 3D.');
    }
  }

  private draw(delta: number) {
    if (this.disposed) return;
    const pose = this.rail.sample(this.currentProgress);
    const ahead = this.rail.sample(Math.min(1, this.currentProgress + .002));
    this.camera.position.copy(pose.position);
    this.orientation.setFromRotationMatrix(this.lookMatrix.lookAt(pose.position, pose.target, this.up));
    this.anticipated.setFromRotationMatrix(this.lookMatrix.lookAt(ahead.position, ahead.target, this.up));
    // Anticipation is a pure function of progress, so reverse/seek gives exactly
    // the same orientation. Progress damping handles temporal smoothing once.
    this.camera.quaternion.slerpQuaternions(this.orientation, this.anticipated, .25)
      .multiply(this.rollRotation.setFromAxisAngle(this.zAxis, pose.roll));
    this.camera.fov = pose.fov; this.camera.updateProjectionMatrix();
    this.updateLighting(pose.target);
    this.animations?.setProgress(this.currentProgress);
    this.animations?.update(delta);
    this.motion?.update(this.elapsed);
    this.renderer.render(this.scene, this.camera);
    this.frameCount++;
    this.canvas.dispatchEvent(new CustomEvent('world-progress', { detail: {
      progress: this.currentProgress,
      chapterIndex: this.timeline.active(this.currentProgress),
      chapterId: this.timeline.id(this.currentProgress),
      beatId: this.timeline.beatId(this.currentProgress),
      beatProgress: this.timeline.beatProgress(this.currentProgress),
      ready: this.ready,
    } }));
    // The physical envelope is driven by authored LetterRise/LetterOpen clips
    // when present. Emit the semantic reveal after world-progress so the
    // overlay has rendered the final chapter before the dialog opens.
    if (this.currentProgress >= .94 && !this.letterRevealed) {
      this.letterRevealed = true;
      this.canvas.dispatchEvent(new CustomEvent('letter-reveal', { detail: { progress: this.currentProgress, automatic: true } }));
    } else if (this.currentProgress < .82) {
      this.letterRevealed = false;
    }
  }

  resize = () => {
    if (this.disposed) return;
    const width = this.canvas.clientWidth || window.innerWidth, height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (this.ready && this.reduced) this.draw(0);
  };

  private schedule() {
    if (!this.disposed && !this.reduced && !this.raf && document.visibilityState !== 'hidden') this.raf = requestAnimationFrame(this.render);
  }

  private render = (now: number) => {
    this.raf = 0;
    if (this.disposed || document.visibilityState === 'hidden') return;
    const delta = this.lastTime ? Math.min(.05, Math.max(0, (now - this.lastTime) / 1000)) : 0;
    this.lastTime = now; this.elapsed += delta;
    this.currentProgress = THREE.MathUtils.damp(this.currentProgress, this.targetProgress, 8, delta);
    if (Math.abs(this.currentProgress - this.targetProgress) < .000001) this.currentProgress = this.targetProgress;
    this.draw(delta); this.schedule();
  };

  private onVisibilityChange = () => {
    cancelAnimationFrame(this.raf); this.raf = 0; this.lastTime = 0; this.schedule();
  };
  private onContextLost = (event: Event) => { event.preventDefault(); this.fail('WebGL context was lost.'); };
  private fail(message: string) {
    this.canvas.dataset.sceneError = message;
    this.canvas.dispatchEvent(new CustomEvent('world-error', { detail: { message } }));
    this.dispose();
  }

  get chapterId() { return this.timeline.id(this.currentProgress); }
  get railValidation() { return this.rail.validate(); }
  get debugSnapshot() {
    return { progress: this.currentProgress, target: this.targetProgress, ready: this.ready, disposed: this.disposed,
      camera: { position: this.camera.position.toArray(), quaternion: this.camera.quaternion.toArray(), fov: this.camera.fov },
      frameCount: this.frameCount, rafActive: Boolean(this.raf), drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles, animationTime: this.animations?.time ?? 0,
      animatedNodes: this.motion?.debugNodes ?? [], gpu: this.gpu,
      beatId: this.timeline.beatId(this.currentProgress), letterRevealed: this.letterRevealed };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; cancelAnimationFrame(this.raf); this.raf = 0;
    this.loader.dispose();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.animations?.dispose(); disposeResources(this.scene); this.renderer.dispose();
    if (this.canvas.__moonlitRuntime === this) delete this.canvas.__moonlitRuntime;
  }
}
