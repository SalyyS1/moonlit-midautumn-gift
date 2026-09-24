---
phase: 1
title: "Scope freeze and visual contract"
status: pending
priority: P1
effort: "1 day"
dependencies: []
---

# Phase 1: Scope freeze and visual contract

## Overview

Freeze the art and motion contract before any new code or modeling. Preserve the current public site as rollback, create a rebuild branch, and approve one vertical slice target so another cosmetic patch cannot ship without evidence.

## Requirements

- Functional: define six pod IDs, camera markers, progress ranges, animation clip names and typed asset manifest shape.
- Visual: choose cinematic semi-realistic storybook 3D as the default; matte PBR, warm moon key, deep violet night, restrained bloom, real spatial depth.
- Non-functional: desktop-first, no paid runtime service, all public assets licensed/original, initial payload <=25MB and each main GLB <=8MB where possible.

## Architecture

Keep `main` at the last working Pages release. Work on `rebuild/true-3d-rail` behind `VITE_SCENE_MODE=procedural|glb` until Phase 4 is proven. Define `timeline.json`-like data in TypeScript with progress markers for the seven pods and camera knots. The scene contract must say which objects are authored in Blender versus decorative runtime particles. The current primitive runtime is fallback only; it is not the target art.

## Related Code Files

- Create: `art/blender/README.md`, `art/blender/build_world.py`, `src/scene/manifest.ts`, `src/scene/types.ts`, `docs/true-3d-art-contract.md`.
- Modify: `README.md`, `vite.config.ts`, `src/scene/index.ts` only for the feature flag scaffold.
- Preserve: `src/scene/MoonlitSceneRuntime.ts` as rollback implementation until the GLB gate passes.

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
