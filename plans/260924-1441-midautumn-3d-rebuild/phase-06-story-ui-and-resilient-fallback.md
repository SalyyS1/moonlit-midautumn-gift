---
phase: 6
title: "Story UI and resilient fallback"
status: pending
priority: P2
effort: "1 day"
dependencies: [3]
---

# Phase 6: Story UI and resilient fallback

## Overview

Keep the romantic Vietnamese story legible and editable while the 3D layer becomes more ambitious. UI chapter state follows timeline markers, not scene visibility, and the letter remains a real accessible dialog.

## Requirements

- Functional: six chapter copy blocks, route nav, progress, final letter, optional gesture-enabled audio, placeholder memory content.
- Non-functional: keyboard operation, focus restoration, reduced motion, WebGL-disabled/asset-error fallback, no surprise audio or personal-data network calls.

## Architecture

DOM owns all meaningful text. `main.ts` receives a lightweight timeline marker from the runtime and updates copy only when the active marker changes. Poster images show while GLB is loading or when WebGL fails. Keep a static chapter list in the document for screen readers; 3D is enhancement, never the only path.

## Related Code Files

- Modify: `src/main.ts`, `src/styles.css`, `index.html`, `src/content.ts`.
- Create: `src/ui/story-overlay.ts`, `src/ui/letter-dialog.ts`, `public/assets/posters/`.
- Preserve: `scripts/smoke-test.mjs` and extend it for letter/fallback behavior.

## Implementation Steps

1. Move all editable names, dates, captions and memory placeholders into typed content.
2. Synchronize chapter copy with timeline marker thresholds while leaving camera transforms continuous.
3. Keep the letter modal focus trap, Escape close and trigger focus restoration.
4. Add loading/error status that does not block scrolling or hide copy; keep poster visible until a real frame is rendered.
5. Verify reduced motion and no-WebGL paths expose all chapters and the final letter without relying on animation.

## Success Criteria

- [ ] Copy never flickers or rewrites on every frame.
- [ ] Keyboard users can navigate chapters and open/close the letter.
- [ ] WebGL disabled, GLB 404 and reduced-motion still expose the complete story.
- [ ] Audio remains muted until explicit user action.

## Risk Assessment

The overlay can make a beautiful scene look busy. Reserve a safe copy zone in the camera sheet and use a restrained scrim only where contrast requires it; do not add UI panels over the hero models.
