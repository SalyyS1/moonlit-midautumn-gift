---
phase: 4
title: "Authored animation and interaction clips"
status: completed
priority: P1
effort: "3-4 days"
dependencies: [2, 3]
---

# Phase 4: Authored animation and interaction clips

## Execution checkpoint — 2026-09-26

The latest export carries 67 authored clips, including seated Cuội, Hằng
dance, rabbit pounding, fire flicker, lantern sway/flicker, lân dance,
`LetterRise` and `LetterOpen`. The 20/20 runtime suite proves optional clip
windows and absolute forward/reverse weights; visual polish remains covered by
Phase 3/7 rather than being inferred from a passing export.

## Overview

Add visible, reversible actions rather than relying on vague idle motion. Runtime evaluates each clip by absolute beat progress so interruption, reverse scroll and reload are deterministic.

## Requirements

- Functional: seated Cuội idle/gesture, rabbit pound loop, Hằng dance loop, lantern flicker/sway, fire/embers, lân/sư dance and automatic envelope lift/open.
- Non-functional: reduced motion freezes to a stable frame; hidden tabs stop RAF; no imperative one-shot state that gets stuck after reverse scroll.

## Related Code Files

- Modify: art/blender/character-rig.py, art/blender/letter-flap.py, art/blender/build-environment.py, src/scene/AnimationDirector.ts, src/scene/MotionMixer.ts
- Modify: public/assets/manifest.json, scripts/write-world-manifest.mjs
- Test: scripts/test-runtime.mjs

## Implementation Steps

1. Author CUOI_SeatIdle and CUOI_Gesture; keep current look/idle clips as compatibility fallbacks.
2. Author RABBIT_Pound_A/B, HANG_Dance_Loop, LION_Dance_Loop, drum hits and cloth/jaw/bob details.
3. Implement fire flame/embers and lantern flicker with capped instancing/phase offsets; keep authored rotation and material base values intact.
4. Map each action to a beat interval and sample absolute local progress; test forward, interrupt, reverse and return.
5. Map EnvelopeRise and LetterOpen over .84–.96; hold the final flap and paper at the end.

## Success Criteria

- [ ] Browser captures show every requested action at a defined hold.
- [ ] Runtime tests prove exact repeatability from the same progress and clean disposal.
- [ ] Animation inventory in the manifest matches exported clips and all clip names remain unique.

## Risk Assessment

Too many independently animated objects can erase the draw-call budget. Instance repeated lanterns/rabbits where possible and keep only hero rigs skeletal.
