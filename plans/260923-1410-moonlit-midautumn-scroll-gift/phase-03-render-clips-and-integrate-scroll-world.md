---
phase: 3
title: "Scroll timeline and six scenes"
status: pending
priority: P1
effort: "7h"
dependencies: [1, 2]
---

# Phase 3: Scroll timeline and six scenes

## Overview

Implement a scroll-scrubbed Three.js story timeline from the full moon to the final letter reveal, with deterministic scene boundaries and graceful rendering fallback.

## Requirements

- Functional: six ordered scenes: (1) named moon opening, (2) lunar gate, (3) Cuội and Hằng, (4) lantern procession, (5) memories, (6) final letter.
- Non-functional: progress reversible and seekable, no blank transition intervals, one RAF loop, robust resize/tab/context-loss behavior, static/reduced-motion fallback.

## Architecture

`scroll-progress` maps document scroll range to normalized progress. A scene timeline maps progress segments to camera path and object transforms; at each frame runtime updates the active scene and emits chapter progress to semantic HTML. Define explicit overlapping transition intervals and easing; clamp values and handle zero-height documents. Assets load asynchronously with timeout/error states; first chapter has a poster before WebGL readiness. Scene rendering owns cancellation and WebGL context recovery. Do not rely on fixed scroll event frequency.

## Related Code Files

- Create: `src/scene/timeline.ts`, `src/scene/scenes/moon.ts`, `src/scene/scenes/lunar-gate.ts`, `src/scene/scenes/cuoi-hang.ts`, `src/scene/scenes/lantern-procession.ts`, `src/scene/scenes/memories.ts`, `src/scene/scenes/final-letter.ts`.
- Modify: `src/scene/scene-runtime.ts`, `src/scene/scroll-progress.ts`, `src/main.ts`.

## Implementation Steps

1. Define timeline boundaries in one data table with named entry/exit progress and shared transitions.
2. Build six scene composition modules from Phase 2 assets; separate scene setup, progress update, and dispose hooks.
3. Animate camera/scene transforms from absolute progress, not accumulated deltas, so backward scrolling and seeking are deterministic.
4. Synchronize active chapter IDs and text reveal thresholds with the same timeline source.
5. Add handling for WebGL failure, context loss, failed asset load, page hidden/visible, and resize.
6. Check scroll-world upstream behavior against this design; reuse only if Phase 1 decision approved it.

## Success Criteria

- At progress 0, each scene midpoint, every boundary ± epsilon, and progress 1, visible scene/camera state is finite and expected.
- Forward/reverse scroll revisits the same state; no cumulative drift.
- No blank frame during transitions; load failure presents chapter poster/content.
- Six chapters remain reachable by keyboard and non-WebGL content.

## Risk Assessment

- High likelihood / high impact: scroll scrubbing with runtime 3D exceeds GPU budgets. Mitigate with capped pixel ratio, low-poly assets, throttled quality on slow frames, and poster/reduced-motion fallback.
- Medium likelihood / high impact: boundary math produces scene gaps or flicker. Mitigate with explicit overlap intervals and boundary tests.
- Medium likelihood / medium impact: browser suspends RAF or loses WebGL context. Mitigate with visibility lifecycle and poster recovery; never assume RAF runs continuously.

## Rollback

Disable 3D timeline and render six semantic chapter sections with static illustrations; retain content and navigation.
