import source from '../../public/assets/manifest.json';
import { CAMERA_BEATS } from './camera-sheet';
import type { BeatMarker, TimelineMarker } from './types';

type Bounds = { min: number[]; max: number[] };
export type WorldManifest = {
  version: number;
  world: { id: string; url: string; bytes: number; preload: boolean; pods: string[]; clips: string[]; bounds?: Record<string, Bounds>; beats?: BeatMarker[] };
  timeline: TimelineMarker[];
  beats?: BeatMarker[];
};

// The same generated JSON drives the UI, loader, registry, and CI validator.
export const worldManifest: WorldManifest = source;
export const worldBeats: readonly BeatMarker[] = Array.isArray(worldManifest.world.beats) && worldManifest.world.beats.length
  ? worldManifest.world.beats
  : Array.isArray(worldManifest.beats) && worldManifest.beats.length
    ? worldManifest.beats
  : CAMERA_BEATS.map(({ id, chapterId, at, pod, caption, clip }) => ({ id, chapterId, at, pod, caption, clip }));
export function assetUrl(relative: string): string {
  if (/^(?:[a-z]+:|\/\/)/i.test(relative) || relative.split('/').includes('..')) throw new Error('Asset path must be local.');
  return `${import.meta.env.BASE_URL}${relative.replace(/^\//, '')}`;
}
