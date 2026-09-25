---
phase: 5
title: "Animation, lighting and post effects"
status: in-progress
priority: P1
effort: "1.5 days"
dependencies: [4]
---

# Phase 5: Animation, lighting and post effects

## Execution checkpoint — 2026-09-25

The actual authored action set is owned by the [generated manifest](../../public/assets/manifest.json), not the broader proposed list below. [Animation tests](../../scripts/test-runtime.mjs) establish real skeletal idle poses and reversible `LetterOpen`; the browser sample observed independent secondary-node motion while scrolling stopped.

[AnimationDirector](../../src/scene/AnimationDirector.ts) and [MotionMixer](../../src/scene/MotionMixer.ts) are the current owners. Idle/look/wave, lantern sway, leaf/lotus offsets and star/glow pulses do not establish the missing walk, cloud drift, memory-frame opening or full storyboard transition.

Bloom remains off while quality and performance are unapproved. No `postfx.ts` is claimed. Static geometry batching reduced opening draw calls to 318 in the candidate run. The ten-second sample still had two frames above 33 ms; material/gesture review and strict frame-budget acceptance remain open. See the [execution report](reports/pm-260925-1440-rebuild-progress.md).

## Overview

Make the world feel alive while scroll is paused and make the models read as matte authored assets instead of glossy primitives. Scroll controls the camera and broad phase; `AnimationMixer` and a deterministic motion layer keep secondary movement continuous.

## Requirements

- Functional: discover and blend GLB clips with `AnimationMixer`, update by delta time, and scrub/seek deterministic scene-level actions when needed.
- Visual: PBR roughness/normal/AO, moon key + cool fill + warm lantern rim, restrained fog and desktop-only bloom; no plastic specular wash.
- Accessibility/performance: reduced-motion disables time motion and bloom; repeated lanterns use instancing or shared geometry; DPR is capped.

## Architecture (target)

`AnimationDirector` owns mixer/actions, clip names and crossfade durations. `MotionMixer` applies small wind/sway/twinkle offsets to named FX nodes without overwriting authored bones or accumulating transforms. Character actions start/end in neutral pose and crossfade rather than toggling. `lighting.ts` defines quality tiers: high (bloom/soft shadows), balanced (no bloom), reduced (static key/fill and no time animation).

## Related Code Files

- [Animation director](../../src/scene/AnimationDirector.ts), [motion mixer](../../src/scene/MotionMixer.ts).
- [Lighting](../../src/scene/lighting.ts), [performance budget](../../src/scene/PerformanceBudget.ts), [static geometry optimization](../../src/scene/optimize-static-geometry.ts).
- [Runtime integration](../../src/scene/ScrollWorldRuntime.ts), [authored clip metadata](../../public/assets/manifest.json) and [browser evidence runner](../../scripts/capture-progress.mjs).

## Implementation Steps

1. Verify `Idle`, `Look`, `Wave`/`HoldLantern`, `Walk`, `CloudDrift`, `LanternSway` and `LetterOpen` are present or mark intentional procedural FX.
2. Create mixer actions with crossfade and reverse-safe time handling; keep animation running after scroll stops.
3. Add wind, water, cloud, star and emission oscillation using stable phases and bounded amplitudes.
4. Configure ACES/sRGB, moon key, hemisphere fill, warm lantern point lights, fog and contact shadows.
5. Add bloom only to a tagged emissive layer and disable it on reduced/mobile/slow-frame quality tiers.
6. Record a 10-second idle capture at each pod; the scene must visibly move without scroll.

## Success Criteria

- [x] At least six independent subtrees animate while scroll is idle.
- [ ] Characters crossfade between clips without a T-pose, snap or root-motion drift.
- [ ] Materials show rough matte response and grounded AO; lantern glow does not wash the whole frame.
- [x] Reduced motion produces a stable render with no continuous mixer updates.
- [ ] A 10-second warm desktop run stays within the 33ms frame budget.

## Risk Assessment

Bloom and dynamic shadows can dominate GPU time. Start without bloom, capture a quality baseline, then add it only if the tagged lanterns improve the story. Never solve “plastic” by globally increasing emissive intensity.
