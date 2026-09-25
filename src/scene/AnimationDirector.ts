import * as THREE from 'three';

export class AnimationDirector {
  readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private readonly letters: { action: THREE.AnimationAction; start: number; end: number }[] = [];
  private readonly gestures: { action: THREE.AnimationAction; start: number; end: number }[] = [];
  private readonly characters = ['CUOI', 'HANG'];
  private progress = 0;

  constructor(private readonly root: THREE.Object3D, clips: THREE.AnimationClip[], private readonly reduced = false) {
    this.mixer = new THREE.AnimationMixer(root);
    clips.forEach(clip => {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name, action);
      if (/Letter(?:Rise|Open)|LETTER_(?:Rise|Open)/i.test(clip.name)) {
        action.play(); action.paused = true;
        this.letters.push({ action, start: /Rise/i.test(clip.name) ? .84 : .90, end: /Rise/i.test(clip.name) ? .92 : 1 });
      } else if (/CUOI.*(?:Seat|Sit)|(?:Seat|Sit).*CUOI/i.test(clip.name)) {
        action.play(); action.paused = true; this.gestures.push({ action, start: .32, end: .43 });
      } else if (/CUOI.*(?:Look|Gesture)|(?:Look|Gesture).*CUOI/i.test(clip.name)) {
        action.play(); action.paused = true; this.gestures.push({ action, start: .34, end: .46 });
      } else if (/(?:RABBIT|THO).*Pound|Pound.*(?:RABBIT|THO)/i.test(clip.name)) {
        action.play(); action.paused = true; this.gestures.push({ action, start: .52, end: .66 });
      } else if (/HANG.*(?:Dance|Wave)|(?:Dance|Wave).*HANG/i.test(clip.name)) {
        action.play(); action.paused = true; this.gestures.push({ action, start: .40, end: .54 });
      } else if (/(?:LION|LAN|SU).*Dance|Dance.*(?:LION|LAN|SU)|(?:DRAGON|RONG).*Dance|Dance.*(?:DRAGON|RONG)/i.test(clip.name)) {
        action.play(); action.paused = true; this.gestures.push({ action, start: .63, end: .76 });
      } else if (/idle|sway|drift|flicker|pulse/i.test(clip.name)) {
        action.play();
        action.setEffectiveWeight(1);
      }
    });
    this.mixer.update(0);
  }

  play(name: string, fade = .35) {
    if (this.reduced) return;
    this.actions.get(name)?.reset().fadeIn(fade).play();
  }

  setProgress(progress: number) {
    this.progress = THREE.MathUtils.clamp(Number.isNaN(progress) ? 0 : progress, 0, 1);
    // Absolute weights make forward/reverse seeking independent of the previous
    // chapter. Idle/gesture actions run together and share a smooth blend window.
    const weight = THREE.MathUtils.smoothstep(this.progress, .34, .39)
      * (1 - THREE.MathUtils.smoothstep(this.progress, .46, .52));
    this.characters.forEach(prefix => {
      const gesture = this.findAction(prefix === 'CUOI' ? /CUOI.*(?:Look|Gesture)/i : /HANG.*(?:Dance|Wave)/i);
      const idle = this.findAction(new RegExp(`${prefix}.*Idle`, 'i'));
      idle?.setEffectiveWeight(gesture ? 1 - weight * .7 : 1);
      if (gesture && !this.gestures.some(spec => spec.action === gesture)) gesture.setEffectiveWeight(weight * .7);
    });
    this.gestures.forEach(({ action, start, end }) => {
      const local = THREE.MathUtils.smoothstep(this.progress, start, start + .018)
        * (1 - THREE.MathUtils.smoothstep(this.progress, end - .018, end));
      action.setEffectiveWeight(local);
      // Gesture clips are sampled from authored time rather than accumulated
      // delta, so seeking backwards produces the same pose as seeking forwards.
      action.time = THREE.MathUtils.clamp((this.progress - start) / Math.max(.0001, end - start), 0, 1) * action.getClip().duration;
    });
  }

  update(delta: number) {
    if (this.reduced) return;
    this.letters.forEach(({ action, start, end }) => {
      action.time = THREE.MathUtils.smoothstep(this.progress, start, end) * action.getClip().duration;
    });
    this.mixer.update(delta);
  }

  private findAction(pattern: RegExp): THREE.AnimationAction | undefined {
    for (const [name, action] of this.actions) if (pattern.test(name)) return action;
    return undefined;
  }

  get time() { return this.mixer.time; }
  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.root); }
}
