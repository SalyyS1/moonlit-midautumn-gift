// Canonical metadata is measured from the Blender export, never hand copied.
import { readFile, writeFile } from 'node:fs/promises';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

globalThis.ProgressEvent ??= class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } };
const bytes = await readFile('public/assets/models/moonlit-world.glb');
const jsonLength = bytes.readUInt32LE(12);
const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
const loader = new GLTFLoader();
// Bounds/skins/animations need no image decoder in Node. Omit materials only
// from this in-memory metadata parse; the exported GLB keeps embedded textures.
loader.register(parser => ({
  name: 'WORLD_MANIFEST_GEOMETRY_ONLY',
  beforeRoot() {
    for (const mesh of parser.json.meshes || []) {
      for (const primitive of mesh.primitives) delete primitive.material;
    }
  },
}));
const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
gltf.scene.updateMatrixWorld(true);
const pods = ['pod_moon_approach', 'pod_lunar_gate', 'pod_cuoi_hang', 'pod_lantern_street', 'pod_memories', 'pod_letter_stage'];
const bounds = {};
for (const id of pods) {
  const pod = gltf.scene.getObjectByName(id);
  if (!pod) throw new Error(`Blender export is missing ${id}`);
  const box = new Box3().setFromObject(pod);
  bounds[id] = { min: box.min.toArray(), max: box.max.toArray() };
}
const manifest = {
  version: 1,
  generatedBy: 'art/blender/build-environment.py + scripts/write-world-manifest.mjs',
  world: {
    id: 'moonlit-world', url: 'assets/models/moonlit-world.glb', preload: true,
    bytes: bytes.byteLength, clips: gltf.animations.map(clip => clip.name), pods, bounds,
    license: { type: 'original', source: 'art/blender/moonlit-world.blend' },
    textures: (document.images || []).map(image => ({ name: image.name, mimeType: image.mimeType, embedded: image.bufferView !== undefined })),
    posters: Array.from({ length: 7 }, (_, index) => `assets/posters/scene-${String(index).padStart(2, '0')}.webp`),
    // Fine-grained cultural beats sit beside the six chapter markers so the
    // existing UI contract remains stable while the cinematic rail can grow.
    beats: [
      { id: 'moon-arrival', chapterId: 'moon', at: 0.00, phase: 'entrance', caption: 'Trăng rằm mở lối' },
      { id: 'gate-glow', chapterId: 'gate', at: 0.14, phase: 'hold', caption: 'Cổng trời đón bước chân' },
      { id: 'cuoi-seat', chapterId: 'cuoi-hang', at: 0.28, phase: 'entrance', caption: 'Chú Cuội ngồi bên gốc đa', clip: 'CUOI_SeatIdle' },
      { id: 'rabbit-pounding', chapterId: 'cuoi-hang', at: 0.34, phase: 'hold', caption: 'Thỏ con giã bánh giầy', clip: 'THO_RabbitA_Pound' },
      { id: 'hang-dance', chapterId: 'cuoi-hang', at: 0.43, phase: 'exit', caption: 'Chị Hằng múa dưới trăng', clip: 'HANG_Dance' },
      { id: 'lantern-entrance', chapterId: 'lanterns', at: 0.50, phase: 'entrance', caption: 'Phố đèn lồng rực rỡ' },
      { id: 'fire-hold', chapterId: 'lanterns', at: 0.56, phase: 'hold', caption: 'Bếp lửa reo vui', clip: 'FIRE_Flame_0_Flicker' },
      { id: 'lan-dance', chapterId: 'lanterns', at: 0.63, phase: 'hold', caption: 'Lân sư tử nhảy nhịp trống', clip: 'LAN_Dance' },
      { id: 'lantern-exit', chapterId: 'lanterns', at: 0.68, phase: 'exit', caption: 'Đèn đưa ta qua cầu' },
      { id: 'memory-approach', chapterId: 'memories', at: 0.72, phase: 'entrance', caption: 'Khung ký ức thân thương' },
      { id: 'memory-hold', chapterId: 'memories', at: 0.78, phase: 'hold', caption: 'Những mùa trăng ở lại' },
      { id: 'letter-rise', chapterId: 'letter', at: 0.86, phase: 'entrance', caption: 'Phong thư trồi lên từ đài sen', clip: 'LetterRise' },
      { id: 'letter-open', chapterId: 'letter', at: 0.93, phase: 'hold', caption: 'Lời thương tự mở ra', clip: 'LetterOpen' },
      { id: 'letter-rest', chapterId: 'letter', at: 1.00, phase: 'exit', caption: 'Chúc một mùa đoàn viên' },
    ],
  },
  timeline: ['moon', 'gate', 'cuoi-hang', 'lanterns', 'memories', 'letter']
    .map((id, index) => ({ id, at: [0, .17, .34, .52, .72, .9][index] })),
};
await writeFile('public/assets/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Manifest measured from Blender export: ${bytes.byteLength} bytes, ${manifest.world.clips.length} clips, ${pods.length} pods.`);
