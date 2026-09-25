---
phase: 1
title: "Scope, cultural references and acceptance"
status: in-progress
priority: P1
effort: "1 day"
dependencies: []
---

# Phase 1: Scope, cultural references and acceptance

## Execution checkpoint — 2026-09-26

The requested cultural moments, fourteen-beat vocabulary, performance budgets
and asset sourcing policy are now recorded in the parent plan and the
[third-party ledger](../../art/THIRD_PARTY_ASSETS.md). All current public
geometry and textures are original Blender work. A final style-sheet review
and explicit human cultural-tone approval remain open before treating this
phase as complete.

## Overview

Freeze the expanded Vietnamese Mid-Autumn story before modeling. Convert the requested cultural moments into named beats, reviewable references and measurable budgets.

## Requirements

- Functional: define beat IDs, stop copy, entrance/hold/exit ranges, animation ownership and reverse behavior.
- Non-functional: protect Vietnamese cultural context, original/cleared asset provenance, 55+ FPS and GLB/payload budgets.

## Related Code Files

- Modify: plans/260925-1524-mid-autumn-cultural-animation-expansion/plan.md
- Create: art/THIRD_PARTY_ASSETS.md, docs/cultural-visual-notes.md
- Read: public/assets/manifest.json, src/scene/camera-sheet.ts, art/blender/README.md

## Implementation Steps

1. Annotate current six pods, current seven timeline markers, known visual gaps and existing clip inventory.
2. Write a 14–16 beat storyboard with references for banyan, Cuội, Hằng, rabbits, bánh giầy tools, lanterns, fire, trống and lân/sư/rồng.
3. Set per-beat budgets: hero meshes 8–12k triangles each, repeated props instanced, total GLB ≤8MB and initial payload ≤25MB.
4. Capture an approved style sheet for cute storybook: facial proportions, eye scale, clothing trim, palette, material roughness and camera distances.
5. Run a cultural review pass on captions and naming before authoring.

## Success Criteria

- [ ] Beat table and style sheet are reviewed before Blender expansion.
- [ ] Every external reference is recorded with source/license or marked reference-only.
- [ ] Existing plan remains in-progress; this plan does not claim release approval.

## Risk Assessment

Generic marketplace models can flatten the visual identity or create license risk. Keep them reference-only unless a per-asset license and redistribution path are verified.
