import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Keep skinning, clip targets and ambient-motion nodes individually addressable. */
export function optimizeStaticGeometry(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const moving = new Set<THREE.Object3D>();
  for (const clip of clips) for (const track of clip.tracks) {
    const target = THREE.PropertyBinding.findNode(root, THREE.PropertyBinding.parseTrackName(track.name).nodeName);
    if (target) moving.add(target);
  }
  root.traverse(object => {
    const name = object.name.toLowerCase().replaceAll('_', ' ');
    if (/^(star |lantern glow|banyan crown|pond lotus)/.test(name)) moving.add(object);
  });
  root.updateMatrixWorld(true);
  type Batch = { parent: THREE.Object3D; meshes: THREE.Mesh<THREE.BufferGeometry, THREE.Material>[] };
  const groups = new Map<string, Batch>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.SkinnedMesh ||
      moving.has(object) || object.children.length || !object.visible ||
      object.morphTargetInfluences?.length || Array.isArray(object.material) ||
      object.material.transparent || object.matrixWorld.determinant() <= 0) return;
    const geometry: THREE.BufferGeometry = object.geometry;
    if (geometry.drawRange.start !== 0 || geometry.drawRange.count !== Infinity) return;
    let parent = object.parent;
    // Animated parent transforms still apply to their merged children.
    while (parent && parent !== root && !parent.name.startsWith('pod_') && !moving.has(parent)) parent = parent.parent;
    if (!parent) return;
    const layout = Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
      .map(([name, attribute]) => [name, attribute.itemSize, attribute.normalized, attribute.array.constructor.name].join(':')).join(',');
    // Global decoration is split spatially so a batch does not span the whole corridor.
    const position = object.getWorldPosition(new THREE.Vector3());
    const cell = parent === root ? [position.x, position.y, position.z].map(value => Math.floor(value / 12)).join(',') : '';
    const key = [parent.uuid, object.material.uuid, object.castShadow, object.receiveShadow,
      object.layers.mask, object.renderOrder, Boolean(geometry.index), layout, cell].join('|');
    const group = groups.get(key) ?? { parent, meshes: [] };
    group.meshes.push(object); groups.set(key, group);
  });
  let removed = 0, batches = 0;
  const removedGeometry = new Set<THREE.BufferGeometry>();
  for (const { parent, meshes } of groups.values()) {
    if (meshes.length < 2) continue;
    const inverse = parent.matrixWorld.clone().invert();
    const inputs = meshes.map(mesh => mesh.geometry.clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld)));
    const geometry = mergeGeometries(inputs, false);
    inputs.forEach(input => input.dispose());
    if (!geometry) continue;
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const first = meshes[0], batch = new THREE.Mesh(geometry, first.material);
    batch.name = 'static_batch_' + batches++;
    batch.castShadow = first.castShadow; batch.receiveShadow = first.receiveShadow;
    batch.layers.mask = first.layers.mask; batch.renderOrder = first.renderOrder;
    parent.add(batch);
    for (const mesh of meshes) {
      removedGeometry.add(mesh.geometry); mesh.removeFromParent(); removed++;
    }
  }
  // Shared geometry may still be used by an excluded animated mesh.
  root.traverse(object => { if (object instanceof THREE.Mesh) removedGeometry.delete(object.geometry); });
  removedGeometry.forEach(geometry => geometry.dispose());
  return { mergedMeshes: removed, batches, savedDrawCalls: removed - batches };
}
