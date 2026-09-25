import { MathUtils, Vector3 } from 'three';
import type { CameraKnot, CameraPose } from './types';

// Shape-preserving cubic Hermite interpolation in authored story time. Shared
// derivatives make unequal-duration segments C1 without stopping at every knot.
export class CameraRail {
  private readonly knots: CameraKnot[];
  private readonly values: number[][];
  private readonly slopes: number[][];

  constructor(knots: CameraKnot[]) {
    if (knots.length < 2 || knots[0].at !== 0 || knots.at(-1)?.at !== 1) {
      throw new Error('Camera rail needs at least two knots spanning [0, 1].');
    }
    this.knots = knots.map(k => ({ ...k, position: k.position.clone(), target: k.target.clone() }));
    this.values = knots.map(k => [...k.position.toArray(), ...k.target.toArray(), k.fov ?? 40, k.roll ?? 0]);
    knots.forEach((k, i) => {
      if (!Number.isFinite(k.at) || (i > 0 && k.at <= knots[i - 1].at) || !this.values[i].every(Number.isFinite)) {
        throw new Error('Camera rail knots must be finite and ordered.');
      }
      if (k.position.distanceToSquared(k.target) < 0.01) throw new Error('Camera target must be distinct from position.');
    });
    this.slopes = knots.map((_, i) => this.values[i].map((_, axis) => this.slope(i, axis)));
  }

  sample(progress: number): CameraPose {
    const p = MathUtils.clamp(Number.isNaN(progress) ? 0 : progress, 0, 1);
    let i = 0;
    while (i < this.knots.length - 2 && p > this.knots[i + 1].at) i++;
    const width = this.knots[i + 1].at - this.knots[i].at;
    const t = (p - this.knots[i].at) / width;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    const h11 = t ** 3 - t ** 2;
    const v = this.values[i].map((a, axis) => h00 * a + h10 * width * this.slopes[i][axis]
      + h01 * this.values[i + 1][axis] + h11 * width * this.slopes[i + 1][axis]);
    return { position: new Vector3(...v.slice(0, 3)), target: new Vector3(...v.slice(3, 6)), fov: v[6], roll: v[7] };
  }

  validate(samples = 1001) {
    const issues: string[] = [];
    let minimumStep = Infinity;
    let previous = this.sample(0).position;
    for (let i = 1; i < samples; i++) {
      const pose = this.sample(i / (samples - 1));
      const step = pose.position.distanceTo(previous);
      minimumStep = Math.min(minimumStep, step);
      if (![...pose.position.toArray(), ...pose.target.toArray(), pose.fov, pose.roll].every(Number.isFinite)) issues.push(`Nonfinite pose at ${i}`);
      if (pose.position.distanceToSquared(pose.target) < 0.01) issues.push(`Collapsed view at ${i}`);
      previous = pose.position;
    }
    return { ok: issues.length === 0, minimumStep, issues };
  }

  private slope(i: number, axis: number): number {
    const last = this.knots.length - 1;
    const secant = (left: number, right: number) => (this.values[right][axis] - this.values[left][axis]) / (this.knots[right].at - this.knots[left].at);
    if (i === 0) return secant(0, 1);
    if (i === last) return secant(last - 1, last);
    const before = secant(i - 1, i), after = secant(i, i + 1);
    if (before * after <= 0) return 0;
    const h0 = this.knots[i].at - this.knots[i - 1].at, h1 = this.knots[i + 1].at - this.knots[i].at;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / before + w1 / after);
  }
}
