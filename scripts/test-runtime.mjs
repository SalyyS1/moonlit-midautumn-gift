import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import * as THREE from 'three';

const root = resolve(import.meta.dirname, '..');
const vite = await createServer({ root, base: '/moonlit-midautumn-gift/', server: { middlewareMode: true }, appType: 'custom' });
after(() => vite.close());
const [{ CameraRail }, { Timeline }, { AnimationDirector }, { MotionMixer }, { AssetLoader, isOptionalCulturalClip }, { worldManifest, worldBeats, assetUrl }, { SceneRegistry }, { disposeResources }, { ScrollController }, { shouldResetLetterReveal, LETTER_REVEAL_RESET_PROGRESS }] = await Promise.all([
  ...['CameraRail', 'Timeline', 'AnimationDirector', 'MotionMixer', 'AssetLoader', 'manifest', 'SceneRegistry', 'dispose-resources', 'ScrollController'].map((name) => vite.ssrLoadModule(`/src/scene/${name}.ts`)),
  vite.ssrLoadModule('/src/ui/story-overlay.ts'),
]);
const knots = [
  { at: 0, position: new THREE.Vector3(0, 2, 20), target: new THREE.Vector3(0, 1, 10), fov: 40, roll: 0 },
  { at: .15, position: new THREE.Vector3(-2, 3, 5), target: new THREE.Vector3(1, 2, -5), fov: 35, roll: .1 },
  { at: .65, position: new THREE.Vector3(3, 2, -20), target: new THREE.Vector3(-1, 1, -30), fov: 45, roll: -.1 },
  { at: 1, position: new THREE.Vector3(0, 2, -50), target: new THREE.Vector3(0, 1, -60), fov: 38, roll: 0 },
];
const rail = new CameraRail(knots);
const { optimizeStaticGeometry } = await vite.ssrLoadModule('/src/scene/optimize-static-geometry.ts');
const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected} (tolerance ${tolerance})`);

test('CameraRail passes authored knots and clamps out-of-range progress', () => {
  for (const knot of knots) {
    const pose = rail.sample(knot.at);
    close(pose.position.distanceTo(knot.position), 0);
    close(pose.target.distanceTo(knot.target), 0);
    close(pose.fov, knot.fov); close(pose.roll, knot.roll);
  }
  close(rail.sample(-1).position.distanceTo(knots[0].position), 0);
  close(rail.sample(2).position.distanceTo(knots.at(-1).position), 0);
});

test('CameraRail has matching one-sided derivatives at unequal story-time seams', () => {
  const epsilon = 1e-6;
  for (const knot of knots.slice(1, -1)) {
    const before = rail.sample(knot.at - epsilon), at = rail.sample(knot.at), after = rail.sample(knot.at + epsilon);
    for (const key of ['position', 'target']) {
      const left = at[key].clone().sub(before[key]).divideScalar(epsilon);
      const right = after[key].clone().sub(at[key]).divideScalar(epsilon);
      assert.ok(left.distanceTo(right) / Math.max(1, left.length()) < .001, `${key} velocity discontinuity at ${knot.at}: ${left.distanceTo(right)}`);
    }
    for (const key of ['fov', 'roll']) close((at[key] - before[key]) / epsilon, (after[key] - at[key]) / epsilon, .01);
  }
});

test('CameraRail samples remain finite and deterministic in both scroll directions', () => {
  const forward = Array.from({ length: 101 }, (_, i) => rail.sample(i / 100));
  for (let index = 100; index >= 0; index--) {
    const pose = rail.sample(index / 100);
    assert.ok([...pose.position.toArray(), ...pose.target.toArray(), pose.fov, pose.roll].every(Number.isFinite));
    close(pose.position.distanceTo(forward[index].position), 0);
  }
});

test('CameraRail rejects invalid knots and handles nonfinite progress safely', () => {
  assert.throws(() => new CameraRail([]), /at least two/);
  assert.throws(() => new CameraRail([knots[0], { ...knots[1], at: 0 }, knots.at(-1)]), /ordered/);
  assert.throws(() => new CameraRail([knots[0], { ...knots.at(-1), position: new THREE.Vector3(NaN, 0, 0) }]), /finite/);
  assert.throws(() => new CameraRail([knots[0], { ...knots.at(-1), target: knots.at(-1).position }]), /distinct/);
  close(rail.sample(NaN).position.distanceTo(knots[0].position), 0);
  close(rail.sample(Infinity).position.distanceTo(knots.at(-1).position), 0);
  assert.equal(rail.validate().ok, true);
});

test('Timeline respects chapter thresholds, endpoints, reverse traversal and empty fallback', () => {
  const timeline = new Timeline(worldManifest.timeline, worldBeats);
  for (const [index, marker] of worldManifest.timeline.entries()) {
    assert.equal(timeline.id(marker.at), marker.id);
    if (index) assert.equal(timeline.active(marker.at - 1e-8), index - 1);
  }
  assert.equal(timeline.active(-2), 0);
  assert.equal(timeline.active(2), worldManifest.timeline.length - 1);
  assert.equal(new Timeline([]).id(.7), 'moon');
});

test('Cinematic beat contract is ordered, chapter-linked and deterministic in both directions', () => {
  assert.ok(worldBeats.length >= 12 && worldBeats.length <= 16, `Expected 12–16 beats, got ${worldBeats.length}`);
  const chapterIds = new Set(worldManifest.timeline.map(marker => marker.id));
  const ids = new Set(); let previous = -1;
  const timeline = new Timeline(worldManifest.timeline, worldBeats);
  for (const beat of worldBeats) {
    assert.equal(typeof beat.id, 'string'); assert.ok(beat.id.length > 0); assert.equal(ids.has(beat.id), false, `Duplicate beat ${beat.id}`); ids.add(beat.id);
    assert.ok(Number.isFinite(beat.at) && beat.at >= 0 && beat.at <= 1, `Invalid beat progress ${beat.id}`);
    assert.ok(beat.at >= previous, `Beat order regressed at ${beat.id}`); previous = beat.at;
    assert.ok(chapterIds.has(beat.chapterId), `Unknown chapter ${beat.chapterId}`);
    assert.ok(typeof beat.caption === 'string' && beat.caption.length > 0, `Missing caption ${beat.id}`);
    if (beat.pod) assert.ok(worldManifest.world.pods.includes(beat.pod), `Unknown pod ${beat.pod}`);
    assert.equal(timeline.beat(beat.at).id, beat.id);
  }
  assert.equal(timeline.beat(-1).id, worldBeats[0].id);
  assert.equal(timeline.beat(2).id, worldBeats.at(-1).id);
  for (let index = 0; index <= 100; index++) {
    const progress = index / 100; const beat = timeline.beat(progress);
    assert.equal(timeline.beatId(progress), beat.id);
    assert.ok(timeline.beatProgress(progress) >= 0 && timeline.beatProgress(progress) <= 1);
  }
  const forward = Array.from({ length: 101 }, (_, index) => timeline.beatId(index / 100));
  for (let index = 100; index >= 0; index--) assert.equal(timeline.beatId(index / 100), forward[index]);
});

test('LetterOpen applies an actual pose, reverses, resets and holds exact end pose', () => {
  const scene = new THREE.Group(); const seal = new THREE.Object3D(); seal.name = 'LETTER_Seal'; scene.add(seal);
  const clip = new THREE.AnimationClip('LetterOpen', 2, [new THREE.NumberKeyframeTrack('LETTER_Seal.position[x]', [0, 2], [0, 2])]);
  const director = new AnimationDirector(scene, [clip]);
  const seek = (progress) => { director.setProgress(progress); director.update(0); return seal.position.x; };
  close(seek(.95), 1); close(seek(1), 2); close(seek(.925), .3125); close(seek(.5), 0);
  close(seek(1), 2); director.update(.5); close(seal.position.x, 2);
  director.dispose();
});

test('Letter overlay reveal state resets below the reverse-scroll threshold', () => {
  assert.equal(LETTER_REVEAL_RESET_PROGRESS, .82);
  assert.equal(shouldResetLetterReveal(.819999), true);
  assert.equal(shouldResetLetterReveal(.82), false);
  assert.equal(shouldResetLetterReveal(1), false);
  assert.equal(shouldResetLetterReveal(-1), true);
});

test('Optional cultural gesture clips use absolute windows and remain safe when clips are absent', () => {
  const scene = new THREE.Group();
  for (const name of ['CUOI_SEATED_Root', 'HANG_Root', 'THO_RabbitA_Root', 'LAN_Root']) { const node = new THREE.Object3D(); node.name = name; scene.add(node); }
  const clips = [
    ['CUOI_SEATED_SeatIdle', 'CUOI_SEATED_Root.position[y]'],
    ['HANG_Dance', 'HANG_Root.rotation[z]'],
    ['THO_RabbitA_Pound', 'THO_RabbitA_Root.position[y]'],
    ['LAN_Dance', 'LAN_Root.rotation[y]'],
  ].map(([name, path], index) => new THREE.AnimationClip(name, 1, [new THREE.NumberKeyframeTrack(path, [0, 1], [0, index + 1])]));
  const director = new AnimationDirector(scene, clips);
  const sample = progress => { director.setProgress(progress); director.update(0); return clips.map(clip => director.mixer.clipAction(clip).getEffectiveWeight()); };
  assert.ok(sample(.38)[0] > 0, 'Cuội seated clip should be active in its beat window');
  assert.ok(sample(.48)[1] > 0, 'Hằng dance clip should be active in its beat window');
  assert.ok(sample(.60)[2] > 0, 'Rabbit pounding clip should be active in its beat window');
  assert.ok(sample(.70)[3] > 0, 'Lân dance clip should be active in its beat window');
  const forward = sample(.62); sample(.2); const reverse = sample(.62);
  assert.deepEqual(reverse, forward, 'Gesture weights must not depend on traversal history');
  director.dispose();
  const noOptional = new AnimationDirector(new THREE.Group(), []); noOptional.setProgress(.95); noOptional.update(0); noOptional.dispose();
});

test('Authored idle animation continues without progress updates; reduced mode stays still', () => {
  const make = () => { const scene = new THREE.Group(); const node = new THREE.Object3D(); node.name = 'CUOI_Root'; scene.add(node); return { scene, node }; };
  const clip = new THREE.AnimationClip('CUOI_Idle', 2, [new THREE.NumberKeyframeTrack('CUOI_Root.position[y]', [0, 1, 2], [0, .2, 0])]);
  const { scene, node } = make(); const director = new AnimationDirector(scene, [clip]);
  director.update(.5); const first = node.position.y; director.update(.5);
  assert.notEqual(node.position.y, first); director.dispose();
  const reduced = make(); const quiet = new AnimationDirector(reduced.scene, [clip], true); quiet.update(.5);
  close(reduced.node.position.y, 0); quiet.dispose();
});

test('MotionMixer preserves authored base rotation and evaluates absolute time reversibly', () => {
  const scene = new THREE.Group(); const leaf = new THREE.Object3D(); leaf.name = 'Banyan_Crown_test'; leaf.rotation.z = .7; leaf.position.y = 3; scene.add(leaf);
  const motion = new MotionMixer(scene); motion.update(0); close(leaf.rotation.z, .7);
  motion.update(1.25); const first = { y: leaf.position.y, z: leaf.rotation.z };
  assert.notEqual(first.y, 3); assert.notEqual(first.z, .7);
  motion.update(6); motion.update(1.25); close(leaf.position.y, first.y); close(leaf.rotation.z, first.z);
  assert.ok(Math.abs(leaf.rotation.z - .7) < .02);
  const quiet = new MotionMixer(scene, true); const before = leaf.position.clone(); quiet.update(100);
  close(leaf.position.distanceTo(before), 0);
});

test('Production GLB parses and AssetLoader validates local base path + manifest', async () => {
  const bytes = await readFile(resolve(root, 'public', worldManifest.world.url));
  const loader = new AssetLoader(); let requested; const nativeFetch = globalThis.fetch; const progress = [];
  // Node has no image decoder. Parse real hierarchy/geometry/animation here;
  // the Chromium matrix verifies embedded image decoding and rendered materials.
  loader.loader.register(parser => ({ name: 'NODE_GEOMETRY_VALIDATION', beforeRoot() {
    for (const mesh of parser.json.meshes || []) for (const primitive of mesh.primitives) delete primitive.material;
  } }));
  try {
    globalThis.fetch = async (url) => { requested = url; return new Response(bytes, { headers: { 'content-length': String(bytes.length) } }); };
    const world = await loader.loadWorld((loaded, total) => progress.push([loaded, total]));
    assert.equal(requested, '/moonlit-midautumn-gift/assets/models/moonlit-world.glb');
    assert.equal(assetUrl('/assets/models/moonlit-world.glb'), requested);
    assert.ok(world.scene.children.length > 0);
    for (const name of worldManifest.world.clips) assert.ok(world.animations.some((clip) => clip.name === name), `Missing clip ${name}`);
    assert.deepEqual(progress.at(-1), [bytes.length, bytes.length]);
  } finally { globalThis.fetch = nativeFetch; loader.dispose(); }
});

test('AssetLoader rejects missing pods/clips and propagates network errors', async () => {
  const loader = new AssetLoader(); const nativeFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(new Uint8Array([0]));
    loader.loader.parseAsync = async () => ({ scene: new THREE.Group(), animations: [] });
    await assert.rejects(loader.loadWorld(), /World contract missing/);
    globalThis.fetch = async () => new Response('missing', { status: 404 });
    await assert.rejects(loader.loadWorld(), /HTTP 404/);
    globalThis.fetch = async () => { throw new Error('Network offline'); };
    await assert.rejects(loader.loadWorld(), /Network offline/);
    globalThis.fetch = async () => new Response(new Uint8Array([0]));
    loader.dispose(); await assert.rejects(loader.loadWorld(), /abort/i);
  } finally { globalThis.fetch = nativeFetch; loader.dispose(); }
});

test('AssetLoader accepts an older world when only optional cultural clips are absent', async () => {
  const loader = new AssetLoader(); const nativeFetch = globalThis.fetch;
  const scene = new THREE.Group();
  worldManifest.world.pods.forEach((name) => { const pod = new THREE.Group(); pod.name = name; scene.add(pod); });
  const required = worldManifest.world.clips.filter((name) => !isOptionalCulturalClip(name));
  const animations = required.map((name) => new THREE.AnimationClip(name, 1, []));
  try {
    globalThis.fetch = async () => new Response(new Uint8Array([0]));
    loader.loader.parseAsync = async () => ({ scene, animations });
    const world = await loader.loadWorld();
    assert.deepEqual(world.animations.map((clip) => clip.name), required);
    assert.equal(isOptionalCulturalClip('HANG_Dance'), true);
    assert.equal(isOptionalCulturalClip('THO_RabbitA_Pound'), true);
    assert.equal(isOptionalCulturalClip('CUOI_Idle'), false);
    assert.equal(isOptionalCulturalClip('HANG_Wave'), false);
    assert.equal(isOptionalCulturalClip('LetterOpen'), false);
    disposeResources(world.scene);
  } finally { globalThis.fetch = nativeFetch; loader.dispose(); }
});

test('Asset URLs reject traversal and external resources', () => {
  for (const input of ['https://example.test/a.glb', '//example.test/a.glb', '../a.glb', 'assets/../a.glb']) assert.throws(() => assetUrl(input), /local/);
});

test('SceneRegistry enforces finite, distinct, non-overlapping named pod bounds', () => {
  const make = () => {
    const scene = new THREE.Group();
    worldManifest.world.pods.forEach((name, index) => { const pod = new THREE.Group(); pod.name = name; pod.position.x = index * 10; pod.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())); scene.add(pod); });
    return { scene, animations: [] };
  };
  const valid = make(); const registry = new SceneRegistry(valid);
  assert.equal(registry.bounds.size, worldManifest.world.pods.length);
  assert.throws(() => registry.get('missing-node'), /not found/);
  disposeResources(valid.scene);
  const overlap = make(); overlap.scene.children[1].position.x = 0;
  assert.throws(() => new SceneRegistry(overlap), /Overlapping/); disposeResources(overlap.scene);
  const missing = make(); const detached = missing.scene.children.at(-1); missing.scene.remove(detached);
  assert.throws(() => new SceneRegistry(missing), /missing pod bounds/); disposeResources(missing.scene); disposeResources(detached);
  const duplicate = make(); const node = duplicate.scene.children[0].clone(); duplicate.scene.add(node);
  assert.throws(() => new SceneRegistry(duplicate), /Duplicate pod/); disposeResources(duplicate.scene);
});

test('Resource disposal includes Points/Lines and releases shared GPU resources once', () => {
  const scene = new THREE.Group(), geometry = new THREE.BufferGeometry(), texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const disposed = { geometry: 0, texture: 0, material: 0 };
  geometry.addEventListener('dispose', () => disposed.geometry++); texture.addEventListener('dispose', () => disposed.texture++); material.addEventListener('dispose', () => disposed.material++);
  scene.add(new THREE.Mesh(geometry, material), new THREE.Points(geometry, material), new THREE.Line(geometry, material));
  disposeResources(scene);
  assert.deepEqual(disposed, { geometry: 1, texture: 1, material: 1 });
  assert.equal(scene.children.length, 0);
});

test('Shared skinned meshes release their skeleton bone texture exactly once', () => {
  const scene = new THREE.Group(), bone = new THREE.Bone(), skeleton = new THREE.Skeleton([bone]);
  skeleton.computeBoneTexture(); let disposed = 0;
  skeleton.boneTexture.addEventListener('dispose', () => disposed++);
  const geometry = new THREE.BufferGeometry(), material = new THREE.MeshBasicMaterial();
  for (let index = 0; index < 2; index++) { const mesh = new THREE.SkinnedMesh(geometry, material); mesh.bind(skeleton); scene.add(mesh); }
  disposeResources(scene);
  assert.equal(disposed, 1); assert.equal(skeleton.boneTexture, null);
});

test('ScrollController resamples resize and removes both event subscriptions', () => {
  const handlers = new Map(), values = [];
  const source = { scrollY: 100, innerHeight: 500, document: { documentElement: { scrollHeight: 1000 } },
    addEventListener: (name, callback) => handlers.set(name, callback),
    removeEventListener: (name, callback) => { assert.equal(handlers.get(name), callback); handlers.delete(name); },
  };
  const controller = new ScrollController(source, value => values.push(value)); controller.start();
  close(values.at(-1), .2); source.innerHeight = 600; handlers.get('resize')(); close(values.at(-1), .25);
  source.scrollY = 10000; handlers.get('scroll')(); close(values.at(-1), 1);
  controller.dispose(); assert.equal(handlers.size, 0);
});

test('Static batching preserves world bounds, animated parents, FX/skin nodes and shared geometry', () => {
  const scene = new THREE.Group(), pod = new THREE.Group(), lamp = new THREE.Group();
  scene.position.set(2, 1, -3); scene.rotation.y = .3; pod.name = 'pod_test'; pod.position.set(1, 0, 4); pod.rotation.z = .1;
  lamp.name = 'LANTERN_Test'; lamp.position.set(0, 3, 0); scene.add(pod); pod.add(lamp);
  const shared = new THREE.BoxGeometry(), removable = new THREE.BoxGeometry(), material = new THREE.MeshBasicMaterial();
  let sharedDisposals = 0, removedDisposals = 0;
  shared.addEventListener('dispose', () => sharedDisposals++); removable.addEventListener('dispose', () => removedDisposals++);
  for (let index = 0; index < 4; index++) {
    const cube = new THREE.Mesh(index < 2 ? shared : removable, material); cube.position.set(index - 2, 0, 0); pod.add(cube);
    const child = new THREE.Mesh(shared, material); child.position.set(index, index * .2, 0); lamp.add(child);
  }
  const fx = new THREE.Mesh(shared, material); fx.name = 'star_protected'; pod.add(fx);
  const skinGeometry = shared.clone(), vertexCount = skinGeometry.attributes.position.count, weights = new Float32Array(vertexCount * 4);
  for (let vertex = 0; vertex < vertexCount; vertex++) weights[vertex * 4] = 1;
  skinGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(vertexCount * 4), 4)); skinGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const skin = new THREE.SkinnedMesh(skinGeometry, material); skin.name = 'hero_skin'; skin.bind(new THREE.Skeleton([new THREE.Bone()])); pod.add(skin);
  const clip = new THREE.AnimationClip('LANTERN_Sway', 1, [new THREE.NumberKeyframeTrack('LANTERN_Test.rotation[y]', [0, 1], [0, .6])]);
  // Compare static vertices exactly: merged local AABBs can conservatively grow
  // under rotated parents. Skinning is excluded and verified as retained above.
  const staticBounds = root => { root.updateWorldMatrix(true, true); const box = new THREE.Box3(); root.traverse(node => {
    if (node instanceof THREE.Mesh && !(node instanceof THREE.SkinnedMesh)) for (let index = 0; index < node.geometry.attributes.position.count; index++) box.expandByPoint(new THREE.Vector3().fromBufferAttribute(node.geometry.attributes.position, index).applyMatrix4(node.matrixWorld));
  }); return box; };
  const reference = scene.clone(true), before = staticBounds(scene);
  const result = optimizeStaticGeometry(scene, [clip]), after = staticBounds(scene);
  assert.ok(result.savedDrawCalls >= 6); close(before.min.distanceTo(after.min), 0, 1e-5); close(before.max.distanceTo(after.max), 0, 1e-5);
  assert.equal(scene.getObjectByName('star_protected'), fx); assert.equal(scene.getObjectByName('hero_skin'), skin);
  assert.equal(sharedDisposals, 0); assert.equal(removedDisposals, 1);
  const active = new THREE.AnimationMixer(scene), expected = new THREE.AnimationMixer(reference);
  active.clipAction(clip).play(); expected.clipAction(clip).play(); active.update(.5); expected.update(.5);
  const moved = staticBounds(lamp), target = staticBounds(reference.getObjectByName('LANTERN_Test'));
  close(moved.min.distanceTo(target.min), 0, 1e-5); close(moved.max.distanceTo(target.max), 0, 1e-5);
  active.stopAllAction(); expected.stopAllAction(); disposeResources(scene);
  assert.equal(sharedDisposals, 1); assert.equal(removedDisposals, 1);
});
