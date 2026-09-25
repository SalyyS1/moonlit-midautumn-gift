---
phase: 4
title: "GLB loading and scene registry"
status: completed
priority: P1
effort: "1.5 days"
dependencies: [2, 3]
---

# Phase 4: GLB loading and scene registry

## Execution checkpoint — 2026-09-25

Local integration acceptance is met. [Asset validation](../../scripts/validate-assets.mjs), [runtime tests](../../scripts/test-runtime.mjs) and the local production browser matrix establish canonical loading under the repository base path, bounds/clip contracts, cancellation, cleanup and readable failure paths. This is not a claim that the rebuild is deployed on GitHub Pages.

The asset remains a single uncompressed world. Separate pod loading and decoder setup are conditional options, not implemented features; the current payload is below the asset budget. Skin-owned bone textures are included in resource teardown.

Evidence scope and release gaps remain in the [execution report](reports/pm-260925-1440-rebuild-progress.md).

## Overview

Load the authored world safely and make its pod/animation contract observable. The first frame must remain meaningful while the GLB is downloading; a single missing asset must not blank the story.

## Requirements

- Functional: manifest-driven GLB load, progress/error events, pod lookup, bounds validation, animation clip discovery and cleanup.
- Performance: preload moon + nearby pod, lazy-load later assets if the single world is split, cap concurrent fetch/decode work, self-host decoder files.
- Reliability: all URLs use `BASE_URL`; no runtime external URLs; poster and semantic HTML remain available on errors.

## Architecture (target)

`AssetLoader` owns `LoadingManager`, `GLTFLoader`, `DRACOLoader` and optional Meshopt/KTX2. `SceneRegistry` mounts roots by `pod_*`, computes world-space bounding boxes and returns named objects to the animation director. The manifest declares `url`, `bytes`, `bounds`, `preload`, `clips`, `textures` and `license`. Cloned instances use `SkeletonUtils.clone` only when a separate character file is required.

Start with one `moonlit-world.glb` to preserve coordinates. Add split files only when the measured payload or decode time breaches the budget; never split by chapter visibility as a cosmetic shortcut.

## Related Code Files

- [Asset loader](../../src/scene/AssetLoader.ts), [scene registry](../../src/scene/SceneRegistry.ts), [resource teardown](../../src/scene/dispose-resources.ts).
- [Typed manifest boundary](../../src/scene/manifest.ts), [canonical metadata](../../public/assets/manifest.json) and [validator](../../scripts/validate-assets.mjs).
- [Runtime tests](../../scripts/test-runtime.mjs), [browser checks](../../scripts/capture-progress.mjs) and [Pages workflow](../../.github/workflows/deploy-pages.yml).

## Implementation Steps

1. Add a typed manifest schema and validator for file existence, byte budgets, animation names, node names and external URL rejection.
2. Configure GLTFLoader with local decoders only after an uncompressed export is visually correct.
3. Load the moon pod first, emit progress to the UI and mount later pods without changing camera coordinates.
4. Validate bounds and required nodes at runtime; log a clear error and leave the poster/fallback active if a check fails.
5. Dispose textures, geometries, materials, mixers and object URLs on runtime teardown.

## Success Criteria

- [x] Production build loads the GLB from GitHub Pages base path with no 404 or CDN dependency.
- [x] Manifest validator catches missing pod, clip, texture, oversized file and external URL before deploy.
- [x] Moon poster/HTML appears before GLB is ready and stays visible until a rendered frame is available.
- [x] Every pod root has a measured non-overlapping bound and required node IDs.
- [x] One asset failure leaves the rest of the story usable.

## Risk Assessment

Draco/KTX2 setup can introduce decoder/version failures. Ship an uncompressed GLB first, then add compression behind a validator and compare screenshots. GitHub Pages is case-sensitive, so all manifest paths must be lower-case and tested in the built `dist` tree.
