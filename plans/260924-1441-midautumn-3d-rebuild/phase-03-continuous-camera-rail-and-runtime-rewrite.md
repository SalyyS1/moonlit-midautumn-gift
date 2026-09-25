---
phase: 3
title: "Continuous camera rail and runtime rewrite"
status: in-progress
priority: P1
effort: "2 days"
dependencies: [1]
---

# Phase 3: Continuous camera rail and runtime rewrite

## Execution checkpoint — 2026-09-25

[Rail tests](../../scripts/test-runtime.mjs) cover unequal knot spacing, finite poses, clamping and reverse evaluation. The [browser runner](../../scripts/capture-progress.mjs) recorded ten real scroll round trips with negligible positional drift and the reduced-motion fallback. [Runtime lifecycle](../../src/scene/ScrollWorldRuntime.ts) is the owner for mounting, scheduling and teardown.

The chosen rail is shape-preserving cubic Hermite in authored story time, rather than Catmull–Rom: shared derivatives preserve C1 continuity across unequal interval lengths. Orientation is evaluated from progress so reverse seeking remains deterministic; damping applies to progress.

The full-world candidate measured 59.81 FPS, but two warm frames exceeded 33 ms and first meaningful 3D missed 1.5 seconds. Overall performance acceptance remains open. The diagnostic API and progress captures exist; the planned visual debug rail/bounds overlay and the separate empty-world performance proof do not. See the [execution report](reports/pm-260925-1440-rebuild-progress.md).

## Overview

Replace the current anchor-segment runtime with a proper camera rail. The camera must keep moving through one world; progress only changes where it is on the rail and never swaps a scene root.

## Requirements

- Functional: deterministic seekable progress from scroll, forward/reverse safe, camera position/look/FOV/roll evaluated from absolute progress.
- Motion: C1-continuous position and target curves, tangent look-ahead, quaternion slerp and delta-time damping.
- Non-functional: one RAF loop, no duplicate render loops, no `group.visible`/chapter opacity transition, reduced-motion can freeze at a stable camera state.

## Architecture (target)

`ScrollController` samples `scrollY` into `targetProgress`. `ScrollWorldRuntime` applies exponential damping to `currentProgress`, then `Timeline.evaluate(currentProgress)` returns camera pose, active marker IDs and animation phase. `CameraRail` stores position knots, look-at knots, FOV and roll. Use `CatmullRomCurve3` or cubic Hermite with clamped end tangents; do not chain independent `lerpVectors` segments. Build a quaternion from the forward vector and up/roll, then slerp the camera quaternion with a time-based factor.

The world is always mounted. Distance, fog, occlusion and authored geometry provide separation. A scene marker can update HTML chapter state, but it cannot hide or scale an opaque pod.

## Related Code Files

- [Scroll controller](../../src/scene/ScrollController.ts), [camera rail](../../src/scene/CameraRail.ts), [camera sheet](../../src/scene/camera-sheet.ts), [timeline](../../src/scene/Timeline.ts).
- [Runtime lifecycle](../../src/scene/ScrollWorldRuntime.ts), [performance budget](../../src/scene/PerformanceBudget.ts) and [scene facade](../../src/scene/index.ts).
- [Runtime tests](../../scripts/test-runtime.mjs) and [browser captures](../../scripts/capture-progress.mjs).

## Implementation Steps

1. Add pure timeline types and unit-test progress clamp, marker selection and rail sampling at every knot ± epsilon.
2. Implement position/look curves, tangent look-ahead, FOV/roll interpolation and orientation slerp.
3. Implement one RAF that updates damping, timeline, mixers and renderer; pause work when the document is hidden and resume without a jump.
4. Add a debug rail mode that draws knot markers, current progress, tangent and pod bounds in development only.
5. Add a reference camera capture script that records screenshots at `0,.1,...,1` for visual review before GLB integration.

## Success Criteria

- [x] Camera position, look direction and FOV are finite and continuous across all knots.
- [x] Repeated top-to-bottom and bottom-to-top scroll produces identical poses at the same progress.
- [x] No scene root is hidden or scaled based on chapter threshold.
- [ ] Empty-pod runtime holds 55+ FPS on the target desktop and has only one RAF.
- [x] Reduced-motion renders a stable poster/scene state without time-based motion.

## Risk Assessment

Catmull-Rom overshoot can send the camera through geometry. Clamp rail control points, inspect tangent direction and validate minimum distance from pod bounds. A fast scroll must not queue state transitions; only the latest target progress matters.
