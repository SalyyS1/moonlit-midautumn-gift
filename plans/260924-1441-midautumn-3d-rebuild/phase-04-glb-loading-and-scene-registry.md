---
phase: 4
title: "GLB loading and scene registry"
status: pending
priority: P1
effort: "1.5 days"
dependencies: [2, 3]
---

# Phase 4: GLB loading and scene registry

## Overview

Load the authored world safely and make its pod/animation contract observable. The first frame must remain meaningful while the GLB is downloading; a single missing asset must not blank the story.

## Requirements

- Functional: manifest-driven GLB load, progress/error events, pod lookup, bounds validation, animation clip discovery and cleanup.
- Performance: preload moon + nearby pod, lazy-load later assets if the single world is split, cap concurrent fetch/decode work, self-host decoder files.
- Reliability: all URLs use `BASE_URL`; no runtime external URLs; poster and semantic HTML remain available on errors.

## Architecture

`AssetLoader` owns `LoadingManager`, `GLTFLoader`, `DRACOLoader` and optional Meshopt/KTX2. `SceneRegistry` mounts roots by `pod_*`, computes world-space bounding boxes and returns named objects to the animation director. The manifest declares `url`, `bytes`, `bounds`, `preload`, `clips`, `textures` and `license`. Cloned instances use `SkeletonUtils.clone` only when a separate character file is required.

Start with one `midautumn-world.glb` to preserve coordinates. Add split files only when the measured payload or decode time breaches the budget; never split by chapter visibility as a cosmetic shortcut.

## Related Code Files

- Create: `src/scene/AssetLoader.ts`, `src/scene/SceneRegistry.ts`, `src/scene/manifest.ts`, `scripts/validate-assets.mjs`, `public/assets/manifest.json`, `public/vendor/` decoder files if needed.
- Modify: `src/scene/ScrollWorldRuntime.ts`, `src/scene/index.ts`, `.github/workflows/deploy-pages.yml`, `package.json`.
- Preserve: `public/assets/posters/scene-*.webp` as no-blank fallback.

## Implementation Steps

1. Add a typed manifest schema and validator for file existence, byte budgets, animation names, node names and external URL rejection.
2. Configure GLTFLoader with local decoders only after an uncompressed export is visually correct.
3. Load the moon pod first, emit progress to the UI and mount later pods without changing camera coordinates.
4. Validate bounds and required nodes at runtime; log a clear error and leave the poster/fallback active if a check fails.
5. Dispose textures, geometries, materials, mixers and object URLs on runtime teardown.

## Success Criteria

- [ ] Production build loads the GLB from GitHub Pages base path with no 404 or CDN dependency.
- [ ] Manifest validator catches missing pod, clip, texture, oversized file and external URL before deploy.
- [ ] Moon poster/HTML appears before GLB is ready and stays visible until a rendered frame is available.
- [ ] Every pod root has a measured non-overlapping bound and required node IDs.
- [ ] One asset failure leaves the rest of the story usable.

## Risk Assessment

Draco/KTX2 setup can introduce decoder/version failures. Ship an uncompressed GLB first, then add compression behind a validator and compare screenshots. GitHub Pages is case-sensitive, so all manifest paths must be lower-case and tested in the built `dist` tree.
