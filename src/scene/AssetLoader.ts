import { LoadingManager } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetUrl, worldManifest } from './manifest';
import { disposeResources } from './dispose-resources';
import type { LoadedWorld } from './types';

// Cultural beats are authored as optional slices so an older local GLB can
// still open the same six-chapter story while the available actions play.
// Keep this allowlist deliberately narrow: baseline idle/look/wave/open clips
// remain part of the world contract, while newly introduced cultural gestures
// may be absent in an older local export without blocking the whole scene.
const OPTIONAL_CULTURAL_CLIP = /(?:Seat|Sit|Dance|Pound|Flicker|Rise|Sway)/i;
export const isOptionalCulturalClip = (name: string): boolean => OPTIONAL_CULTURAL_CLIP.test(name);

export class AssetLoader {
  private readonly manager = new LoadingManager();
  private readonly loader = new GLTFLoader(this.manager);
  private readonly controller = new AbortController();

  async loadWorld(onProgress?: (loaded: number, total: number) => void): Promise<LoadedWorld> {
    const url = assetUrl(worldManifest.world.url);
    const response = await fetch(url, { signal: this.controller.signal });
    if (!response.ok) throw new Error(`World load failed (HTTP ${response.status}).`);
    const total = Number(response.headers.get('content-length')) || worldManifest.world.bytes;
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          chunks.push(value); loaded += value.byteLength; onProgress?.(loaded, total);
        }
      } finally { reader.releaseLock(); }
    } else {
      const bytes = new Uint8Array(await response.arrayBuffer());
      chunks.push(bytes); loaded = bytes.length; onProgress?.(loaded, total);
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
    this.controller.signal.throwIfAborted();
    const gltf = await this.loader.parseAsync(bytes.buffer, assetUrl('assets/models/'));
    try {
      this.controller.signal.throwIfAborted();
      const missingPods = worldManifest.world.pods.filter(id => !gltf.scene.getObjectByName(id));
      const missingClips = worldManifest.world.clips.filter(id => !isOptionalCulturalClip(id) && !gltf.animations.some(clip => clip.name === id));
      if (missingPods.length || missingClips.length) throw new Error(`World contract missing pods: ${missingPods.join(', ')}; clips: ${missingClips.join(', ')}.`);
      return { scene: gltf.scene, animations: gltf.animations };
    } catch (error) { disposeResources(gltf.scene); throw error; }
  }

  dispose() { this.controller.abort(); }
}
