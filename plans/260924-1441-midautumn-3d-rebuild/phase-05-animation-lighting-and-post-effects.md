---
phase: 5
title: "Animation, lighting and post effects"
status: pending
priority: P1
effort: "1.5 days"
dependencies: [4]
---

# Phase 5: Animation, lighting and post effects

## Overview

Make the world feel alive while scroll is paused and make the models read as matte authored assets instead of glossy primitives. Scroll controls the camera and broad phase; `AnimationMixer` and a deterministic motion layer keep secondary movement continuous.

## Requirements

- Functional: discover and blend GLB clips with `AnimationMixer`, update by delta time, and scrub/seek deterministic scene-level actions when needed.
- Visual: PBR roughness/normal/AO, moon key + cool fill + warm lantern rim, restrained fog and desktop-only bloom; no plastic specular wash.
- Accessibility/performance: reduced-motion disables time motion and bloom; repeated lanterns use instancing or shared geometry; DPR is capped.

## Architecture

`AnimationDirector` owns mixer/actions, clip names and crossfade durations. `MotionMixer` applies small wind/sway/twinkle offsets to named FX nodes without overwriting authored bones or accumulating transforms. Character actions start/end in neutral pose and crossfade rather than toggling. `lighting.ts` defines quality tiers: high (bloom/soft shadows), balanced (no bloom), reduced (static key/fill and no time animation).

## Related Code Files

- Create: `src/scene/AnimationDirector.ts`, `src/scene/MotionMixer.ts`, `src/scene/lighting.ts`, `src/scene/postfx.ts`.
- Modify: `src/scene/ScrollWorldRuntime.ts`, `src/scene/SceneRegistry.ts`, `src/styles.css` for loading quality state.
- Assets: update `public/assets/manifest.json` with clip names and node channels.

## Implementation Steps

1. Verify `Idle`, `Look`, `Wave`/`HoldLantern`, `Walk`, `CloudDrift`, `LanternSway` and `LetterOpen` are present or mark intentional procedural FX.
2. Create mixer actions with crossfade and reverse-safe time handling; keep animation running after scroll stops.
3. Add wind, water, cloud, star and emission oscillation using stable phases and bounded amplitudes.
4. Configure ACES/sRGB, moon key, hemisphere fill, warm lantern point lights, fog and contact shadows.
5. Add bloom only to a tagged emissive layer and disable it on reduced/mobile/slow-frame quality tiers.
6. Record a 10-second idle capture at each pod; the scene must visibly move without scroll.

## Success Criteria

- [ ] At least six independent subtrees animate while scroll is idle.
- [ ] Characters crossfade between clips without a T-pose, snap or root-motion drift.
- [ ] Materials show rough matte response and grounded AO; lantern glow does not wash the whole frame.
- [ ] Reduced motion produces a stable render with no continuous mixer updates.
- [ ] A 10-second warm desktop run stays within the 33ms frame budget.

## Risk Assessment

Bloom and dynamic shadows can dominate GPU time. Start without bloom, capture a quality baseline, then add it only if the tagged lanterns improve the story. Never solve “plastic” by globally increasing emissive intensity.
