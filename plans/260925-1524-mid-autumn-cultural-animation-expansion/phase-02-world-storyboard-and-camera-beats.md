---
phase: 2
title: "World storyboard and camera beats"
status: in-progress
priority: P1
effort: "1-2 days"
dependencies: [1]
---

# Phase 2: World storyboard and camera beats

## Execution checkpoint — 2026-09-26

`src/scene/camera-sheet.ts` and `public/assets/manifest.json` now expose
fourteen ordered beats while retaining the six chapter IDs. Runtime tests
cover ordering, chapter/pod references, clamping and reverse traversal, and
the browser diagnostic set covers exact-progress navigation. A capture that
visually reviews every beat and its copy-safe framing remains open; this is
why the phase is still in progress.

## Overview

Replace the sparse six-stop journey with a continuous rail containing authored entrance, hold and exit beats. Preserve one world coordinate system and readable safe zones for copy.

## Requirements

- Functional: timeline IDs map to camera ranges without visible or opacity swaps; forward and reverse land on identical poses.
- Non-functional: no camera seam, no collapsed target, readable 3D copy and enough hold time to see each action.

## Beat proposal

| Progress | Beat | Camera hold |
|---:|---|---|
| 0.00 | Moon, stars and distant lanterns | Opening reveal |
| 0.08 | Enter banyan canopy | Slow crane |
| 0.16 | Cuội seated at banyan root | 2–3s visual hold |
| 0.25 | Rabbit children pound bánh giầy | Side orbit |
| 0.35 | Hằng enters the lake clearing | Lateral glide |
| 0.43 | Hằng ribbon/fan dance | 2–3s visual hold |
| 0.52 | Lantern row flicker and campfire | Forward tracking |
| 0.62 | Lân/sư drum dance | Near-field hold |
| 0.70 | Optional dragon tail procession | Only if budget passes |
| 0.78 | Ensemble farewell | Pull back |
| 0.86 | Envelope lifts from the letter table | Dolly in |
| 0.92 | Letter flap opens automatically | 2–3s hold |
| 0.97 | Paper settles, text is readable | Final composition |
| 1.00 | End state | Stable reading frame |

## Related Code Files

- Modify: src/scene/camera-sheet.ts, src/scene/Timeline.ts, src/content.ts, public/assets/manifest.json
- Test: scripts/test-runtime.mjs, scripts/capture-progress.mjs

## Implementation Steps

1. Add world.beats metadata with semantic IDs, chapterId and ranges, keeping the six chapter IDs stable where UI links depend on them.
2. Place new pods or extend existing separated pods; validate bounds/gaps before animation work.
3. Author rail knots around each beat, then test 1001 samples and ten forward/reverse wheel runs.
4. Capture wide/mid/close frames for every hold and review copy-safe framing.

## Success Criteria

- [ ] Every beat can be paused and identified from a browser capture.
- [ ] Reverse traversal reproduces the same camera and target values within tolerance.
- [ ] No beat relies on hiding a pod or crossfading opaque geometry.

## Risk Assessment

Too many markers can make scrolling feel like a slideshow. Use only entrance/hold/exit knots and preserve continuous velocity through each transition.
