---
phase: 6
title: "Story UI and resilient fallback"
status: completed
priority: P2
effort: "1 day"
dependencies: [3]
---

# Phase 6: Story UI and resilient fallback

## Execution checkpoint — 2026-09-25

[Typed content](../../src/content.ts), [semantic HTML](../../index.html) and the [UI modules](../../src/ui/story-overlay.ts) own the story paths. The production browser matrix passed letter focus/escape, muted-until-action audio, WebGL-disabled, GLB-failure, no-JavaScript and reduced-motion paths, including narrow layouts.

The final candidate passed corrected chapter navigation, memory-caption keyboard interaction and resize without scrolling. The targeted synthetic persisted-lifecycle rerun passed after fixing the harness's asynchronous audio assertion and hash reset. The typography followup also verified Vietnamese heading glyphs after the font correction. Local UI acceptance is met; actual browser BFCache use remains unproven. The no-JavaScript copy is a deliberate HTML mirror and must be personalized with the typed content.

See the [execution report](reports/pm-260925-1440-rebuild-progress.md) for final-run status.

The user's localhost followup exposed a usability defect hidden by forced motion settings in earlier captures: the actual Windows preference disables motion, selecting a static page without a way back to 3D. [View-mode controls](../../src/ui/view-mode-controls.ts) now explain the active reading mode and provide explicit 3D opt-in, reading return and load-error retry. The URL preserves explicit opt-in across reloads while the default still respects reduced motion. [Real-wheel regression](../../scripts/test-view-mode.mjs) verifies actual camera progression, reverse scrolling, mode switching, retry, reload and narrow-screen controls.

## Overview

Keep the romantic Vietnamese story legible and editable while the 3D layer becomes more ambitious. UI chapter state follows timeline markers, not scene visibility, and the letter remains a real accessible dialog.

## Requirements

- Functional: six chapter copy blocks, route nav, progress, final letter, optional gesture-enabled audio, placeholder memory content.
- Non-functional: keyboard operation, focus restoration, reduced motion, WebGL-disabled/asset-error fallback, no surprise audio or personal-data network calls.

## Architecture (target)

DOM owns all meaningful text. `main.ts` receives a lightweight timeline marker from the runtime and updates copy only when the active marker changes. Poster images show while GLB is loading or when WebGL fails. Keep a static chapter list in the document for screen readers; 3D is enhancement, never the only path.

## Related Code Files

- [Content](../../src/content.ts), [HTML fallback](../../index.html), [main lifecycle](../../src/main.ts) and [styles](../../src/styles.css).
- [Story overlay](../../src/ui/story-overlay.ts), [letter dialog](../../src/ui/letter-dialog.ts) and [opt-in audio](../../src/ui/story-audio.ts).
- [Browser verification](../../scripts/capture-progress.mjs).

## Implementation Steps

1. Move all editable names, dates, captions and memory placeholders into typed content.
2. Synchronize chapter copy with timeline marker thresholds while leaving camera transforms continuous.
3. Keep the letter modal focus trap, Escape close and trigger focus restoration.
4. Add loading/error status that does not block scrolling or hide copy; keep poster visible until a real frame is rendered.
5. Verify reduced motion and no-WebGL paths expose all chapters and the final letter without relying on animation.

## Success Criteria

- [x] Copy never flickers or rewrites on every frame.
- [x] Keyboard users can navigate chapters and open/close the letter.
- [x] WebGL disabled, GLB 404 and reduced-motion still expose the complete story.
- [x] Audio remains muted until explicit user action.

## Risk Assessment

The overlay can make a beautiful scene look busy. Reserve a safe copy zone in the camera sheet and use a restrained scrim only where contrast requires it; do not add UI panels over the hero models.
