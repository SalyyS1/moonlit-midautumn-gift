---
phase: 3
title: "Continuous camera rail and runtime rewrite"
status: pending
priority: P1
effort: "2 days"
dependencies: [1]
---

# Phase 3: Continuous camera rail and runtime rewrite

## Overview

Replace the current anchor-segment runtime with a proper camera rail. The camera must keep moving through one world; progress only changes where it is on the rail and never swaps a scene root.

## Requirements

- Functional: deterministic seekable progress from scroll, forward/reverse safe, camera position/look/FOV/roll evaluated from absolute progress.
- Motion: C1-continuous position and target curves, tangent look-ahead, quaternion slerp and delta-time damping.
- Non-functional: one RAF loop, no duplicate render loops, no `group.visible`/chapter opacity transition, reduced-motion can freeze at a stable camera state.

## Architecture

`ScrollController` samples `scrollY` into `targetProgress`. `ScrollWorldRuntime` applies exponential damping to `currentProgress`, then `Timeline.evaluate(currentProgress)` returns camera pose, active marker IDs and animation phase. `CameraRail` stores position knots, look-at knots, FOV and roll. Use `CatmullRomCurve3` or cubic Hermite with clamped end tangents; do not chain independent `lerpVectors` segments. Build a quaternion from the forward vector and up/roll, then slerp the camera quaternion with a time-based factor.

The world is always mounted. Distance, fog, occlusion and authored geometry provide separation. A scene marker can update HTML chapter state, but it cannot hide or scale an opaque pod.

## Related Code Files

- Create: `src/scene/ScrollController.ts`, `src/scene/CameraRail.ts`, `src/scene/Timeline.ts`, `src/scene/ScrollWorldRuntime.ts`, `src/scene/PerformanceBudget.ts`.
- Modify: `src/scene/index.ts`, `src/main.ts`, `src/styles.css` only where loading/fallback hooks require it.
- Archive/replace: `src/scene/MoonlitSceneRuntime.ts` after the GLB path is proven; keep the old implementation reachable through `VITE_SCENE_MODE=procedural` during the migration.

## Implementation Steps

1. Add pure timeline types and unit-test progress clamp, marker selection and rail sampling at every knot ± epsilon.
2. Implement position/look curves, tangent look-ahead, FOV/roll interpolation and orientation slerp.
3. Implement one RAF that updates damping, timeline, mixers and renderer; pause work when the document is hidden and resume without a jump.
4. Add a debug rail mode that draws knot markers, current progress, tangent and pod bounds in development only.
5. Add a reference camera capture script that records screenshots at `0,.1,...,1` for visual review before GLB integration.

## Success Criteria

- [ ] Camera position, look direction and FOV are finite and continuous across all knots.
- [ ] Repeated top-to-bottom and bottom-to-top scroll produces identical poses at the same progress.
- [ ] No scene root is hidden or scaled based on chapter threshold.
- [ ] Empty-pod runtime holds 55+ FPS on the target desktop and has only one RAF.
- [ ] Reduced-motion renders a stable poster/scene state without time-based motion.

## Risk Assessment

Catmull-Rom overshoot can send the camera through geometry. Clamp rail control points, inspect tangent direction and validate minimum distance from pod bounds. A fast scroll must not queue state transitions; only the latest target progress matters.
