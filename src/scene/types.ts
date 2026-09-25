import * as THREE from 'three';

export type TimelineMarker = { id: string; at: number };
/** A cinematic stop inside one of the six semantic story chapters. */
export type BeatMarker = TimelineMarker & {
  chapterId: string;
  pod?: string;
  caption?: string;
  clip?: string;
  /** Generated manifests may add a phase label; runtime treats it as copy metadata. */
  phase?: string;
};
export type CameraKnot = { at: number; position: THREE.Vector3; target: THREE.Vector3; fov?: number; roll?: number };
export type CameraBeat = BeatMarker & Omit<CameraKnot, 'at'> & { hold?: number };
export type CameraPose = { position: THREE.Vector3; target: THREE.Vector3; fov: number; roll: number };
export type LoadedWorld = { scene: THREE.Group; animations: THREE.AnimationClip[] };
