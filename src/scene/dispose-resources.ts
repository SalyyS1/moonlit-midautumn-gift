import { BufferGeometry, Light, Material, Object3D, Skeleton, SkinnedMesh, Texture } from 'three';

export function disposeResources(root: Object3D): void {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>();
  const skeletons = new Set<Skeleton>();
  root.traverse(object => {
    if (object instanceof SkinnedMesh) skeletons.add(object.skeleton);
    const renderable = object as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
    if (renderable.geometry) geometries.add(renderable.geometry);
    if (renderable.material) {
      const list = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      list.forEach(material => {
        materials.add(material);
        Object.values(material).forEach(value => { if (value instanceof Texture) textures.add(value); });
      });
    }
    if (object instanceof Light && 'shadow' in object) (object.shadow as { dispose(): void }).dispose();
  });
  textures.forEach(texture => { texture.dispose(); if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close(); });
  skeletons.forEach(skeleton => skeleton.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
  root.clear();
}
