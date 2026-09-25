---
phase: 5
title: "Automatic letter reveal and story UI"
status: completed
priority: P1
effort: "1-2 days"
dependencies: [2, 4]
---

# Phase 5: Automatic letter reveal and story UI

## Execution checkpoint — 2026-09-26

The cinematic path now raises and opens the physical envelope from scroll
progress without a click. The browser diagnostic confirms auto-open at `.95`,
reverse re-arm below `.82`, focus restoration and readable mobile/fallback
paths. The HTML letter trigger remains available for reading mode and
accessibility.

## Overview

Make the physical envelope reveal the emotional payoff automatically while keeping the HTML letter available for keyboard, reduced-motion and WebGL-failure users.

## Requirements

- Functional: envelope rises, flap opens, paper settles and letter text appears as progress reaches the end; no cinematic click required.
- Non-functional: readable mode exposes the complete letter; focus, reduced motion, no-JavaScript and screen-reader paths remain usable.

## Related Code Files

- Modify: src/scene/AnimationDirector.ts, src/scene/Timeline.ts, src/ui/story-overlay.ts, src/ui/letter-dialog.ts, src/content.ts, index.html, src/styles.css
- Verify: scripts/capture-progress.mjs, scripts/test-view-mode.mjs

## Implementation Steps

1. Replace the cinematic Mở lá thư call-to-action with a state hint or optional replay control after the automatic reveal.
2. Keep a semantic static letter and dialog trigger for users who choose reading mode.
3. Update chapter copy for the expanded beats without rewriting on every frame.
4. Add a visible final hold so the opened letter remains readable before progress ends.

## Success Criteria

- [ ] A real wheel capture reaches the final opened letter without a button click.
- [ ] Reverse scroll closes/retracts the letter deterministically.
- [ ] Keyboard and reduced-motion users can read the same letter without needing the 3D animation.

## Risk Assessment

An automatic reveal can surprise users who only want to read. Keep the readable fallback and a persistent mode switch; do not autoplay audio.
