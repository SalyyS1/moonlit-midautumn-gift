import * as THREE from 'three';

export function installMoonlitLighting(scene: THREE.Scene): (target: THREE.Vector3) => void {
  scene.background = new THREE.Color(0x080b24);
  scene.fog = new THREE.FogExp2(0x0c152e, .013);
  scene.add(new THREE.HemisphereLight(0xa1b5db, 0x281b29, 1.6));
  const key = new THREE.DirectionalLight(0xffe1b1, 2.7);
  // A 768px map keeps the banyan and lantern shadows readable while avoiding
  // a full 1024px shadow pass on integrated GPUs during dense cultural beats.
  key.castShadow = true; key.shadow.mapSize.set(768, 768); key.shadow.bias = -.0003;
  key.shadow.normalBias = .03;
  Object.assign(key.shadow.camera, { near: .5, far: 60, left: -14, right: 14, top: 14, bottom: -14 });
  key.shadow.camera.updateProjectionMatrix();
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0x849cda, .8);
  fill.position.set(6, 8, -8); scene.add(fill);
  // The shadow volume follows the continuous look target; a single oversized
  // map across the entire corridor wasted resolution and GPU fill.
  return (target) => {
    key.target.position.copy(target);
    key.position.copy(target).add(new THREE.Vector3(-8, 14, 10));
  };
}
