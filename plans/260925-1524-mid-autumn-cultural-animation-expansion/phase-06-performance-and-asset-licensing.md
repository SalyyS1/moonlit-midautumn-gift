---
phase: 6
title: "Performance and asset licensing"
status: in-progress
priority: P1
effort: "2 days"
dependencies: [3, 4, 5]
---

# Phase 6: Performance and asset licensing

## Execution checkpoint — 2026-09-26

The [asset ledger](../../art/THIRD_PARTY_ASSETS.md), manifest validator and
browser/runtime checks pass. The latest QA snapshot is a 6.7 MB generated GLB
with embedded textures, six pods and seven local posters. Warm average is 60.01 FPS with a
17 ms maximum frame and no frame over 33 ms, but first meaningful 3D is
2,169.8 ms against the `<1,500 ms` target. Reduce first-load work and rerun
the release capture before closing this phase.

## Overview

Make the larger world shippable as a local, self-contained static asset and prove that added culture does not make the existing performance gap worse.

## Requirements

- Functional: validator reports source/license/hash, embedded/local textures, clip inventory, bounds and payload totals.
- Non-functional: GLB ≤8MB, initial payload ≤25MB, 55+ FPS warm, no frame >33ms for 10s, no external runtime requests.

## Related Code Files

- Modify: scripts/validate-assets.mjs, scripts/write-world-manifest.mjs, src/scene/PerformanceBudget.ts, .github/workflows/deploy-pages.yml
- Create/maintain: art/THIRD_PARTY_ASSETS.md, docs/asset-guide.md, browser evidence under work/
- Test: npm run validate:assets, npm test, npm run test:view-mode, production Chromium/Edge captures

## Implementation Steps

1. Batch/instance repeated lanterns, rabbits and embers; preserve pod culling and animation targets.
2. Measure first meaningful 3D, draw calls, triangles, warm FPS, p95/max frame and memory before/after each asset slice.
3. Use original assets by default. For support assets, prefer Poly Haven CC0; verify Quaternius/Sketchfab per item and bundle attribution/license text where required.
4. Reject CC-BY-NC, unclear provenance, hotlinked files, ripped game/anime models and files whose license forbids public redistribution.
5. Run static build with base path, direct refresh, no-JS and WebGL failure checks.

## Success Criteria

- [ ] Validator and license ledger pass with reproducible hashes.
- [ ] Added slice does not regress current 59.8 FPS baseline or payload budgets; failed targets are documented instead of hidden.
- [ ] No third-party runtime URL and no unlicensed model appears in the public GLB.

## Risk Assessment

Even legally usable models can make the world visually inconsistent or expose hidden texture URLs. Prefer original Blender work and treat external assets as a last-mile support option.
