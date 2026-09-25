export type QualityTier = 'high' | 'balanced' | 'reduced';

export type PerformanceBudget = {
  maxDpr: number;
  shadows: boolean;
  bloom: boolean;
  timeMotion: boolean;
};

export function getPerformanceBudget(reducedMotion: boolean, devicePixelRatio = 1): PerformanceBudget {
  if (reducedMotion) return { maxDpr: 1, shadows: false, bloom: false, timeMotion: false };
  const tier: QualityTier = devicePixelRatio >= 2 ? 'balanced' : 'high';
  return tier === 'high'
    ? { maxDpr: 1.6, shadows: true, bloom: false, timeMotion: true }
    : { maxDpr: 1.35, shadows: true, bloom: false, timeMotion: true };
}
