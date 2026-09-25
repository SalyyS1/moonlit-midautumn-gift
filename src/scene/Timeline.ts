import * as THREE from 'three';
import type { BeatMarker, TimelineMarker } from './types';

export class Timeline {
  readonly markers: readonly TimelineMarker[];
  readonly beats: readonly BeatMarker[];

  constructor(markers: readonly TimelineMarker[], beats: readonly BeatMarker[] = []) {
    this.markers = markers;
    // A manifest produced before the beat schema is deployed still works. In
    // that case each chapter marker is a valid, named beat by itself.
    this.beats = beats.length ? [...beats].sort((a, b) => a.at - b.at) : markers.map(marker => ({
      ...marker, chapterId: marker.id,
    }));
  }

  active(progress: number): number {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    let index = 0;
    this.markers.forEach((marker, markerIndex) => { if (value >= marker.at) index = markerIndex; });
    return index;
  }

  id(progress: number): string { return this.markers[this.active(progress)]?.id ?? this.markers[0]?.id ?? 'moon'; }

  beatIndex(progress: number): number {
    const value = THREE.MathUtils.clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
    let index = 0;
    this.beats.forEach((beat, beatIndex) => { if (value >= beat.at) index = beatIndex; });
    return index;
  }

  beat(progress: number): BeatMarker {
    return this.beats[this.beatIndex(progress)] ?? { id: 'moon', at: 0, chapterId: 'moon' };
  }

  beatId(progress: number): string { return this.beat(progress).id; }

  beatProgress(progress: number): number {
    const index = this.beatIndex(progress);
    const start = this.beats[index]?.at ?? 0;
    const end = this.beats[index + 1]?.at ?? 1;
    return THREE.MathUtils.clamp((progress - start) / Math.max(.0001, end - start), 0, 1);
  }
}
