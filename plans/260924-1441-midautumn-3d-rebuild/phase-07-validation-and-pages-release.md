---
phase: 7
title: "Validation and Pages release"
status: in-progress
priority: P1
effort: "1.5 days"
dependencies: [4, 5, 6]
---

# Phase 7: Validation and Pages release

## Execution checkpoint — 2026-09-25

Final local typecheck, repository-base build, asset validation and runtime tests passed. The candidate browser run measured 3,152.9 ms to first meaningful 3D and 59.81 FPS; two frames exceeded 33 ms. Loading and strict frame-time acceptance still fail. The targeted lifecycle harness rerun passed. A typography-only followup refreshed all progress screenshots and verified Vietnamese heading glyphs; typecheck and the production build passed again. These checks do not change the failed performance gates or establish release acceptance.

[Browser verification](../../scripts/capture-progress.mjs) now has a strict `--release` option. Its default mode records failed performance gates without treating them as a functional-check failure. The [Pages workflow](../../.github/workflows/deploy-pages.yml) includes asset validation, but this rebuild has not been pushed, run in remote CI or deployed. No live-site claim is made here.

Human visual approval is also outstanding. The [execution report](reports/pm-260925-1440-rebuild-progress.md) records exact evidence scope and remaining gates.

## Overview

Prove that the rebuilt scene is smooth, visually continuous and deployable before pushing it public. Capture evidence at exact progress positions and test the failure paths that a cosmetic demo usually ignores.

## Requirements

- Functional: asset validation, typecheck, unit/smoke/build, desktop Chromium scroll, letter and Pages refresh.
- Performance: 1440x900 and 1920x1080 desktop captures, 55+ FPS target after warm-up, no frame >33ms in a 10s idle sample, initial payload <=25MB.
- Release: public repo contains no secrets/private photos, all asset URLs local, workflow deploys only successful builds, rollback is one revert.

## Architecture (target)

Add `scripts/validate-assets.mjs` to CI before Vite build. Use a production preview or Chromium runner to sample progress at `0,.05,.1,...,1`, forward/reverse ten times, pause-scroll at every pod and assert no camera NaN, console errors, missing GLB or unexpected external request. Keep the last known-good Pages artifact available until the new workflow succeeds.

## Related Code Files

- [Asset validator](../../scripts/validate-assets.mjs), [runtime tests](../../scripts/test-runtime.mjs), [browser captures](../../scripts/capture-progress.mjs).
- [Pages workflow](../../.github/workflows/deploy-pages.yml), [release guide](../../docs/release-and-rollback.md).
- [Scoped execution report](reports/pm-260925-1440-rebuild-progress.md); generated captures remain under the runner's ignored work directory.

## Implementation Steps

1. Run manifest/GLB validator, typecheck, smoke test and production build from a clean install.
2. Preview the build under the repository base path and verify every GLB/texture/decoder request returns 200.
3. Capture each camera marker and seam; compare continuity visually and check no pod overlap or layer pop.
4. Test Chrome/Edge desktop, WebGL disabled, reduced motion, resize, tab hide/show, keyboard letter and direct Pages refresh.
5. Scan staged files for private media/secrets and record asset licenses.
6. Push only after all gates pass; monitor Actions and verify the public URL, then document commit and rollback.

## Success Criteria

- [ ] All automated checks and asset budgets pass in CI.
- [ ] No camera jump, chapter snap, blank frame or opaque layer overlap in the progress capture matrix.
- [ ] Characters animate while scroll is idle and retain authored materials at close distance.
- [ ] GitHub Pages returns HTTP 200 with no broken asset paths and the previous commit remains a reversible rollback.

## Risk Assessment

If the GLB path still fails the visual gate, do not publish a half-polished rebuild. Keep the current main release live, fix the model/rail, or enable the documented Blender-rendered video hybrid from the same world asset. A green build alone is not visual acceptance.
