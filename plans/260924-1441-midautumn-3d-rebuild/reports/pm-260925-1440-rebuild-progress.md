---
title: "True 3D rebuild execution checkpoint"
date: 2026-09-25
status: in-progress
scope: "Local uncommitted rebuild; no public release"
---

# True 3D rebuild execution checkpoint

## Outcome and evidence boundary

The [plan](../plan.md) remains in progress. The desired semi-realistic storybook presentation is an intent contract, not an approved description of the current characters. No rebuild commit, remote CI run or Pages deployment is claimed.

Documentation serves maintainers and future agents: locate the authoritative source, preserve the intended experience, and distinguish implementation from release proof. Evergreen guidance is limited to those decisions and source routes. This report and the [journal](../../../docs/journals/260925-1440-true-3d-rebuild.md) are stateful local records.

## Verified implementation

| Area | Current evidence |
|---|---|
| Blender artifact | [Source route](../../../art/blender/README.md), [generated metadata](../../../public/assets/manifest.json), and successful [asset validator](../../../scripts/validate-assets.mjs): 6,457,124-byte GLB, original embedded textures, separated bounds, real skins and authored actions. |
| Camera and lifecycle | [Runtime tests](../../../scripts/test-runtime.mjs), local production captures and real scroll round trips. The rail uses shared Hermite derivatives in authored time because intervals have unequal duration. |
| Loading and cleanup | Actual GLB parsing, local base-path requests, failure/abort checks, pod/clip contracts, unique geometry/material/texture and skeleton cleanup in the runtime suite. |
| Animation | Actual idle/look/wave and lantern actions; reversible authored envelope flap; bounded secondary motion. The manifest is the complete current clip inventory. |
| UI and fallback | Earlier production matrix verified modal focus, no-JavaScript text/CSS, reduced motion, GLB failure, WebGL failure/context loss and narrow layouts. Candidate checks passed navigation, resize, keyboard memory captions and modal/reduced-motion transitions. The targeted synthetic persisted-lifecycle rerun also passed. |
| Static optimization | Parent reported 16 passing runtime tests after the batching regression, including vertex positions, animated parents and shared geometry retention. The candidate browser run reduced opening draw calls from 710 to 318; the release frame-time and loading gates still fail. |

The full world was present in the incoming working tree before the moon/character slice was approved. Continuing repairs does not satisfy that earlier ordering gate. Approval cannot be inferred from a valid GLB or successful test.

## Validation snapshot

The final candidate GLB is 6,457,124 bytes, SHA-256 `f8ed960d1c755a04b5e52ed8768acaf6f56a963fea45564839415e7196639765`. Local runtime tests passed (16/16), asset validation passed, typecheck passed and the repository-base production build passed. Vite reported its large-JavaScript-chunk warning; the build did not fail.

The [candidate browser report](../../../work/browser-validation/evidence-final/browser-report.json) records Chromium 153 on hardware-accelerated Intel Iris Xe, 1440×900, DPR 1. First meaningful 3D was **3,152.9 ms**; the warm sample was **59.81 FPS**, p95 **16.8 ms**, maximum **33.4 ms**, with **two frames above 33 ms**. The FPS gate passes; loading and strict frame-time gates fail. `releasePass` is false.

An earlier run with Blender rendering measured 4,004.9 ms to first 3D and 50.62 FPS. It is superseded for candidate performance by the isolated run above. The earlier navigation harness timeout is fixed. Candidate navigation, resize, memory captions, letter and fallback checks pass. The full candidate matrix recorded 22/23 passing checks and no page exceptions. Its remaining persisted-lifecycle assertion ran before the asynchronous audio button update; the [corrected targeted run](../../../work/browser-validation/evidence-lifecycle/browser-report.json) passed both selected checks, with the same JavaScript bundle and GLB. Actual Back navigation reloaded the page (`persisted=false`), so synthetic persisted-event checks must not be described as browser BFCache proof.

These performance measurements precede a typography-only CSS correction for Vietnamese glyph fallback. The [font capture followup](../../../work/browser-validation/evidence-fonts/browser-report.json) passed both selected checks and refreshed all eleven progress screenshots. Browser font inspection confirmed a single heading font; split Vietnamese glyph rendering was corrected. JavaScript bytes stayed identical (SHA-256 `8c62747a743492b1022bee6d34f33493cfb47cd69f087d02e10e47c1052bd1fe`) despite Vite's output filename changing. Typecheck and the production build passed again. The ten-second performance sample was not repeated after the CSS change.

The [runner](../../../scripts/capture-progress.mjs) enforces functional and performance gates with `--release`; default mode remains diagnostic. A transient disk-full attempt preceded the successful candidate capture and is not an application failure.

## Remaining acceptance

- Human visual acceptance of moon, characters, materials and framing at wide/mid/close distances; current stylization must be assessed against the semi-realistic target.
- Storyboard gaps: walking pair, authored cloud drift, hold-lantern action, memory-frame unfolding/transition and the remaining planned pod effects. Existing idle or scale motion does not substitute for these.
- Annotated camera/coordinate review, missing visual debug overlay and explicit procedural rollback browser evidence.
- Loading/frame-time fixes and a new strict production run. Edge, 1920×1080 and document hide/show evidence are not established by the current report.
- Public-artifact review, remote CI, Pages deployment and direct live refresh after all prior gates pass.

Uncompressed GLB remains a deliberate baseline. Bloom stays off while visual/performance approval is open. Neither a decoder nor bloom is claimed as implemented.

## Next

Resolve failed performance gates and incomplete storyboard scope, then obtain the plan's visual acceptance before any release. Update this scoped record from the final artifact and report; do not rewrite the target to match incomplete code.
