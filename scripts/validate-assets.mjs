import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { Box3, Texture } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = resolve(import.meta.dirname, '..');
const publicRoot = resolve(root, 'public');
const manifest = JSON.parse(await readFile(resolve(publicRoot, 'assets/manifest.json'), 'utf8'));
const worldPath = resolve(publicRoot, manifest.world.url);
if (!worldPath.startsWith(publicRoot + sep) || manifest.world.url !== 'assets/models/moonlit-world.glb') throw new Error('Canonical GLB path is invalid.');
const bytes = (await stat(worldPath)).size;
if (bytes <= 20 || bytes > 8 * 1024 * 1024) throw new Error(`World GLB violates 8MB budget: ${bytes} bytes.`);
if (manifest.world.bytes !== bytes) throw new Error(`Stale manifest bytes: ${manifest.world.bytes} != ${bytes}.`);
if (manifest.world.id !== 'moonlit-world' || manifest.world.license?.type !== 'original') throw new Error('World identity/license missing.');
if (!Array.isArray(manifest.timeline) || manifest.timeline.length !== 6 || manifest.timeline[0].at !== 0) throw new Error('Six chapter markers required.');
if (manifest.timeline.some((marker, i) => !Number.isFinite(marker.at) || marker.at < 0 || marker.at > 1 || (i > 0 && marker.at <= manifest.timeline[i - 1].at))) throw new Error('Timeline must be ordered within [0,1].');
const beats = manifest.world.beats ?? manifest.beats;
if (!Array.isArray(beats) || beats.length < 12 || beats.length > 16) throw new Error(`Expected 12–16 cinematic beats, got ${beats?.length ?? 0}.`);
const chapterIds = new Set(manifest.timeline.map(marker => marker.id));
const beatIds = new Set();
for (const [index, beat] of beats.entries()) {
  if (typeof beat.id !== 'string' || !beat.id || beatIds.has(beat.id)) throw new Error(`Invalid or duplicate beat id at index ${index}.`);
  if (!Number.isFinite(beat.at) || beat.at < 0 || beat.at > 1 || (index > 0 && beat.at < beats[index - 1].at)) throw new Error(`Beat timeline is not ordered at ${beat.id}.`);
  if (!chapterIds.has(beat.chapterId) || typeof beat.caption !== 'string' || !beat.caption.trim()) throw new Error(`Beat metadata incomplete: ${beat.id}.`);
  if (beat.pod && !manifest.world.pods.includes(beat.pod)) throw new Error(`Beat references unknown pod: ${beat.id}.`);
  if (beat.clip && !manifest.world.clips.includes(beat.clip)) throw new Error(`Beat references unlisted clip: ${beat.id}.`);
  beatIds.add(beat.id);
}
const buffer = await readFile(worldPath);
if (buffer.toString('ascii', 0, 4) !== 'glTF' || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== bytes) throw new Error('Invalid GLB header/length.');
const jsonLength = buffer.readUInt32LE(12);
if (buffer.readUInt32LE(16) !== 0x4e4f534a || 20 + jsonLength > bytes) throw new Error('Invalid JSON chunk.');
const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trim());
if (!gltf.scenes?.length || !gltf.scenes[gltf.scene]) throw new Error('Default scene missing.');
if ((gltf.nodes ?? []).some(node => node.camera !== undefined || node.extensions?.KHR_lights_punctual)) throw new Error('Unexpected authored camera/light.');
for (const resource of [...(gltf.buffers ?? []), ...(gltf.images ?? [])]) {
  if (resource.uri) throw new Error(`Canonical world must embed resources: ${resource.uri}`);
}
for (const image of gltf.images ?? []) {
  if (image.bufferView === undefined || !gltf.bufferViews?.[image.bufferView] || !/^image\/(png|jpeg|webp)$/.test(image.mimeType)) throw new Error('Missing or invalid embedded texture.');
}
const names = new Set((gltf.nodes ?? []).map(node => node.name).filter(Boolean));
const clips = new Set((gltf.animations ?? []).map(animation => animation.name));
for (const clip of ['CUOI_Idle', 'CUOI_Look', 'HANG_Idle', 'HANG_Wave']) if (!clips.has(clip)) throw new Error(`Required character action absent: ${clip}`);
for (const id of manifest.world.pods) if (!names.has(id)) throw new Error(`Missing pod: ${id}`);
for (const clip of manifest.world.clips) if (!clips.has(clip)) throw new Error(`Missing clip: ${clip}`);
if (clips.size !== manifest.world.clips.length) throw new Error('Manifest must describe every exported clip.');
for (const prefix of ['CUOI', 'HANG']) {
  if (!(gltf.nodes ?? []).some(node => node.name?.startsWith(prefix) && node.skin !== undefined)) throw new Error(`No skinned mesh for ${prefix}.`);
}
if (JSON.stringify(manifest).match(/https?:\/\//i)) throw new Error('External runtime URL in manifest.');

// Metadata-only texture objects allow geometry/skin/bounds checks in Node;
// embedded image presence is checked above, decoding is covered by Chromium.
globalThis.ProgressEvent ??= class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } };
const loader = new GLTFLoader().register(() => ({ name: 'METADATA_TEXTURES', loadTexture: () => Promise.resolve(new Texture()) }));
const loaded = await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '');
loaded.scene.updateMatrixWorld(true);
const measured = manifest.world.pods.map(id => {
  const box = new Box3().setFromObject(loaded.scene.getObjectByName(id));
  const declared = manifest.world.bounds?.[id];
  if (!declared || box.isEmpty() || ![...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)) throw new Error(`Missing/invalid bounds for ${id}`);
  for (const side of ['min', 'max']) box[side].toArray().forEach((value, axis) => {
    if (Math.abs(value - declared[side][axis]) > .025) throw new Error(`Stale bounds for ${id}.`);
  });
  return { id, box };
});
for (let i = 1; i < measured.length; i++) {
  const gap = measured[i - 1].box.min.z - measured[i].box.max.z;
  if (gap < 2) throw new Error(`Pod gap ${measured[i - 1].id}/${measured[i].id}: ${gap.toFixed(2)}m < 2m.`);
}
let payload = bytes;
for (let i = 0; i < 7; i++) {
  const poster = resolve(publicRoot, `assets/posters/scene-${String(i).padStart(2, '0')}.webp`);
  const data = await readFile(poster);
  if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`Invalid poster: ${poster}`);
  payload += data.length;
}
if (payload > 25 * 1024 * 1024) throw new Error('Assets exceed 25MB initial payload budget.');
console.log(`asset-validator: ${bytes} bytes, ${measured.length} separated pods, ${clips.size} authored clips, ${gltf.images?.length ?? 0} embedded textures, 7 posters OK`);
