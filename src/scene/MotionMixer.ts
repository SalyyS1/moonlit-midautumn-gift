import * as THREE from 'three';

type Motion = { object: THREE.Object3D; position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Quaternion; phase: number; kind: 'pulse' | 'leaf' | 'water' };
export class MotionMixer {
  private readonly motions: Motion[] = [];
  private readonly offset = new THREE.Quaternion();
  private readonly axis = new THREE.Vector3(0, 0, 1);

  constructor(root: THREE.Object3D, reduced = false) {
    if (reduced) return;
    root.traverse(object => {
      const name = object.name.toLowerCase().replaceAll('_', ' ');
      // Lantern glow and festival fire are authored GLTF actions. Leaving
      // them to AnimationDirector avoids fighting their keyed scales every
      // frame and keeps reverse/progress sampling deterministic.
      const kind = /^star /.test(name) ? 'pulse'
        : /^banyan crown/.test(name) ? 'leaf' : /^pond lotus/.test(name) ? 'water' : undefined;
      if (kind) this.motions.push({ object, position: object.position.clone(), scale: object.scale.clone(), rotation: object.quaternion.clone(), phase: this.motions.length * .731, kind });
    });
  }

  update(time: number) {
    this.motions.forEach(({ object, position, scale, rotation, phase, kind }) => {
      const wave = Math.sin(time * (kind === 'pulse' ? 1.35 : .7) + phase);
      if (kind === 'pulse') object.scale.copy(scale).multiplyScalar(1 + wave * .1);
      else {
        object.position.copy(position); object.position.y += wave * .025;
        this.offset.setFromAxisAngle(this.axis, wave * .015);
        object.quaternion.copy(rotation).multiply(this.offset);
      }
    });
  }

  get debugNodes() {
    return this.motions.filter((_, i) => i % Math.max(1, Math.floor(this.motions.length / 8)) === 0).slice(0, 8).map(({ object }) => ({
      name: object.name, position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
    }));
  }
}
