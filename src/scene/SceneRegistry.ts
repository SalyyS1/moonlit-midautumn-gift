import * as THREE from 'three';
import type { LoadedWorld } from './types';
import { worldManifest } from './manifest';

export class SceneRegistry {
  readonly root: THREE.Group;
  readonly bounds = new Map<string, THREE.Box3>();

  constructor(world: LoadedWorld) {
    this.root = world.scene;
    this.root.updateMatrixWorld(true);
    this.root.traverse(object => {
      if (object.name.startsWith('pod_')) {
        if (this.bounds.has(object.name)) throw new Error(`Duplicate pod: ${object.name}`);
        this.bounds.set(object.name, new THREE.Box3().setFromObject(object));
      }
      if (object instanceof THREE.Mesh) {
        const name = object.name.toLowerCase();
        object.castShadow = !/star|glow|dust|water|pond|ground|path_slab/.test(name);
        object.receiveShadow = !/star|glow|dust/.test(name);
      }
    });
    for (const id of worldManifest.world.pods) {
      const bound = this.bounds.get(id);
      if (!bound || bound.isEmpty() || ![...bound.min.toArray(), ...bound.max.toArray()].every(Number.isFinite)) throw new Error(`Invalid or missing pod bounds: ${id}`);
    }
    const pods = [...this.bounds];
    for (let a = 0; a < pods.length; a++) for (let b = a + 1; b < pods.length; b++) {
      if (pods[a][1].intersectsBox(pods[b][1])) throw new Error(`Overlapping pods: ${pods[a][0]} / ${pods[b][0]}`);
    }
  }

  get(name: string): THREE.Object3D {
    const object = this.root.getObjectByName(name);
    if (!object) throw new Error(`World object not found: ${name}`);
    return object;
  }
}
