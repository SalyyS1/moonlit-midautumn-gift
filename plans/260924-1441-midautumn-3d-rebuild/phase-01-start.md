---
phase: 1
title: "Scope freeze and visual contract"
status: in-progress
priority: P1
effort: "1 day"
dependencies: []
---

# Phase 1: Scope freeze and visual contract

## Execution checkpoint — 2026-09-25

Scope and target art remain those of this plan. [Camera sheet](../../src/scene/camera-sheet.ts), [manifest](../../public/assets/manifest.json), [typed manifest boundary](../../src/scene/manifest.ts) and [mode switch](../../src/scene/index.ts) exist on `rebuild/true-3d-rail`.

The full world already existed in the incoming working tree before the required slice approval. That ordering gate was bypassed; this update does not retroactively approve it. A complete camera/storyboard annotation, coordinate diagram, committed acceptance record and an explicit procedural-mode browser check remain open. Mechanical bounds checks are evidence of separation, not the missing diagram or human review.

See the [execution report](reports/pm-260925-1440-rebuild-progress.md) for the evidence boundary.

## Overview

Freeze the art and motion contract before any new code or modeling. Preserve the current public site as rollback, create a rebuild branch, and approve one vertical slice target so another cosmetic patch cannot ship without evidence.

## Requirements

- Functional: define six pod IDs, camera markers, progress ranges, animation clip names and typed asset manifest shape.
- Visual: choose cinematic semi-realistic storybook 3D as the default; matte PBR, warm moon key, deep violet night, restrained bloom, real spatial depth.
- Non-functional: desktop-first, no paid runtime service, all public assets licensed/original, initial payload <=25MB and each main GLB <=8MB where possible.

## Architecture (target)

Keep `main` at the last working Pages release. Work on `rebuild/true-3d-rail` behind `VITE_SCENE_MODE=procedural|glb` until Phase 4 is proven. Define `timeline.json`-like data in TypeScript with progress markers for six pods and seven storyboard stops and camera knots. The scene contract must say which objects are authored in Blender versus decorative runtime particles. The current primitive runtime is fallback only; it is not the target art.

## Related Code Files

- [Art contract](../../docs/true-3d-art-contract.md) and [Blender source route](../../art/blender/README.md).
- [Camera sheet](../../src/scene/camera-sheet.ts), [manifest](../../public/assets/manifest.json) and [types](../../src/scene/types.ts).
- [Scene facade](../../src/scene/index.ts) and [procedural rollback](../../src/scene/ProceduralSceneRuntime.ts).

## Implementation Steps

1. Capture baseline screenshots and record the current commit/Pages URL for rollback.
2. Write a camera sheet with 14–18 knots: position, look target, FOV, roll, pod ID and intended velocity direction.
3. Define pod bounds and a minimum 2–4m gap so opaque geometry cannot occupy the same depth.
4. Define the material/lighting contract: moon roughness, lantern emission ceiling, AO/normal usage, no default glossy plastic.
5. Define the manifest schema and animation names: `Idle`, `Walk`, `Wave`, `Look`, `HoldLantern`, `CloudDrift`, `LanternSway`, `LetterOpen`.
6. Create a `VITE_SCENE_MODE` rollback switch and a vertical-slice checklist; no full six-scene modeling starts until the checklist is accepted.

## Success Criteria

- [ ] Plan sheet names every pod, camera knot and animation clip.
- [ ] A coordinate/bounds diagram shows no pod intersection.
- [ ] The vertical slice acceptance checklist is committed and measurable.
- [ ] Running with `VITE_SCENE_MODE=procedural` still gives the previous site while the GLB path is incomplete.

## Risk Assessment

The largest risk is ambiguous “realistic”. Default to authored semi-realistic storybook characters. Photorealistic likeness requires supplied references and explicit asset rights; do not invent the recipient’s face. If the vertical slice fails visual review, stop and revise the model/material contract before expanding scope.
