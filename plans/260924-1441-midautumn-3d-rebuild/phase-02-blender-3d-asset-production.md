---
phase: 2
title: "Blender 3D asset production"
status: pending
priority: P1
effort: "4-6 days"
dependencies: [1]
---

# Phase 2: Blender 3D asset production

## Overview

Build the actual 3D world instead of extending procedural primitives. The first deliverable is a polished moon + Cuội/Hằng vertical slice; after that gate, complete the remaining pods in the same scene file and style.

## Requirements

- Functional: six connected pods, moon/craters/clouds, lunar gate, banyan island and lake, Cuội, Hằng, lantern street, memory frames and letter terrace.
- Character quality: authored silhouette, face planes, hair, sleeves/arms, UVs, rig bones and at least two usable actions per character; no sphere-head/cylinder-body replacement in the final path.
- Non-functional: Blender meters, origins at logical pivots, named nodes, baked AO/normal/roughness where useful, no hidden cameras/lights, no unlicensed copied character art.

## Architecture

Use `art/blender/midautumn_world.blend` as source of truth and `art/blender/build_world.py` for repeatable blockout/material/node naming. Export one coherent `public/assets/models/midautumn-world.glb` first so pod coordinates and rail are guaranteed to match. If the optimized payload breaches the budget, split by pod only after the single-file visual review. Keep source `.blend` outside `dist` but tracked if size permits; otherwise document its local archive path and keep the export manifest public.

Suggested asset targets:

| Asset | Target |
|---|---|
| Cuội/Hằng | 20–60k triangles each, 1–2K textures, rigged |
| Repeated lanterns | one authored mesh + instances/duplicates, not 14 unique high-poly meshes |
| Moon/terrain | bevels and smooth normals, subtle crater normal/AO |
| World | <=25MB initial, <=8MB per split GLB, no 4K textures |

## Related Code Files

- Create: `art/blender/midautumn_world.blend`, `art/blender/build_world.py`, `art/blender/export_world.py`, `public/assets/models/midautumn-world.glb`, `public/assets/posters/scene-00.webp` through `scene-06.webp`, `public/assets/manifest.json`.
- Create/modify: `docs/asset-license-manifest.md`, `docs/true-3d-art-contract.md`.
- Do not modify: runtime camera/loader until the vertical slice exports successfully.

## Implementation Steps

1. Block out the seven pods along the Z rail with 2–4m gaps and place `cam_*` markers at entry/hero/exit positions.
2. Model and shade the moon, gate, island, lake, tree, lantern street, frames, envelope and environment shells with bevels and consistent scale.
3. Author Cuội and Hằng as separate rigged meshes with neutral bind pose, facial planes, hair/sleeve controls and lantern/prop attachment bones.
4. Animate clips at 24/30fps with root motion disabled: `Idle`, `Look`, `Wave`/`HoldLantern`, `Walk` where the camera passes them; keep first/last pose neutral for clean reverse scrubbing.
5. Add pod-level animation clips for cloud drift, lantern sway, leaf wind, water shimmer and letter open.
6. Export GLB with embedded or locally resolvable textures, inspect in Blender and Three.js, and write manifest metadata (bounds, bytes, clip names, preload priority).

## Success Criteria

- [ ] Moon + Cuội/Hằng vertical slice looks coherent at wide, mid and close camera distances.
- [ ] All final characters are authored GLB meshes with rig/animation clips, not runtime primitive replacements.
- [ ] Node names and clip names match the manifest exactly; no missing texture or T-pose.
- [ ] The full world has no coplanar pod roots or unexplained opaque overlap.
- [ ] Source/license for every external texture/model is recorded; original models are marked as such.

## Risk Assessment

Modeling quality is the schedule bottleneck. Gate the work after moon + characters; if that slice is still plastic, revise topology/material/lighting before duplicating effort across six scenes. Do not claim photorealism without a real authored asset and reference review.
