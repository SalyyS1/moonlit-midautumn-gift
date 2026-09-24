---
phase: 2
title: "Art direction and 3D diorama source"
status: pending
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: Art direction and 3D diorama source

## Overview

Create a coherent, lightweight moonlit Mid-Autumn diorama kit used across all six scenes, with an explicit visual contract and optimized local assets.

## Requirements

- Functional: reusable moon, cloud, lunar gate, tree, Cuội/Hằng silhouettes, rabbit, lantern, path, memory frame, and letter-stage assets.
- Non-functional: compressed textures/models, consistent scale/light direction, no unlicensed borrowed character art, placeholders replaceable without rebuilding scene logic.

## Architecture

Art source files are authoring inputs; exported GLB/optimized textures or procedural Three.js geometry are local runtime assets. Materials share a restrained palette: night `#080B24`, moon gold `#F6D88B`, cloud violet `#8A78B4`, lantern coral `#D9795C`. HTML handles all text. Camera and scene authoring use shared coordinates so adjacent shots match visually.

## Related Code Files

- Create: `public/assets/scenes/`, `public/assets/textures/`, `src/scene/assets.ts`, `docs/asset-guide.md`.
- Modify: `src/scene/scene-runtime.ts` only to register asset loading interfaces.
- Delete: temporary authoring exports and unused oversized assets before commit.

## Implementation Steps

1. Produce a scene asset inventory with dimensions, formats, source/license, and ownership.
2. Build procedural low-poly forms or create original locally generated models for lunar terrain, tree, lanterns, and figures.
3. Establish camera staging and key lights for scene 1 moon, scenes 2-4 travel, scene 5 memory reveal, and scene 6 letter.
4. Optimize textures and geometry; lazy-load non-initial scene assets while retaining poster fallbacks.
5. Add concise replacement instructions for eventual user photos and names.

## Success Criteria

- Every required scene has a visual asset or intentional procedural placeholder.
- Runtime asset bundle stays below 12 MB compressed; initial scene assets below 3 MB compressed.
- Asset source/license is recorded; no opaque external URL is required at runtime.
- Memory photos can be replaced via documented content/asset mapping.

## Risk Assessment

- High likelihood / medium impact: visual quality asset scope expands. Mitigate with reusable low-poly kit, shared materials, and scene-specific composition rather than unique models per frame.
- Medium likelihood / high impact: asset size causes slow start. Mitigate with mesh/texture budgets, lazy loading, and initial poster until scene is ready.
- Low likelihood / high impact: unlicensed copied art enters public repo. Mitigate with original assets, source/license manifest, and review before public push.

## Rollback

Revert to procedural geometry and static poster scenes; preserve the asset mapping interface so story flow remains intact.
