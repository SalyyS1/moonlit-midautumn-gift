---
phase: 4
title: "Gift UI, content, and accessibility"
status: completed
priority: P2
effort: "4h"
dependencies: [3]
---

# Phase 4: Gift UI, content, and accessibility

## Overview

Complete the recipient-facing Vietnamese copy, editable placeholders, chapter overlays, end letter interaction, and responsive/reduced-motion experience.

## Requirements

- Functional: approved romantic fairytale tone, six scene captions, memory placeholders, final letter overlay, optional user-triggered music.
- Non-functional: readable text over animation, keyboard navigation, reduced-motion support, no surprise audio, usable narrow-screen fallback.

## Architecture

Keep names, chapter copy, memory dates/captions/images in one typed local content module. Render readable text and buttons as HTML overlay with contrast scrims. Respect `prefers-reduced-motion`; provide a skip/continue story path. User gesture enables audio; audio failure silently leaves story functional. No tracking, form collection, or personal-data network calls.

## Related Code Files

- Create: `src/content/story.ts`, `src/ui/chapter-overlay.ts`, `src/ui/letter-dialog.ts`, `src/ui/audio-control.ts`, `docs/personalization.md`.
- Modify: `src/styles.css`, `src/main.ts`, `index.html`.

## Implementation Steps

1. Write and centralize Vietnamese chapter copy and placeholder names/dates/photo labels.
2. Add chapter indicator/progress hint and overlay layout that remains legible over brightest frames.
3. Add final letter modal with close/escape/focus management and optional second action link.
4. Add explicit sound control with a muted default and local optional audio asset.
5. Build reduced-motion and WebGL-disabled paths; ensure no horizontal overflow at small viewport.
6. Verify semantic headings, alt text for posters, keyboard operation, contrast, and focus visibility.

## Success Criteria

- All copy and placeholder fields are changed from one documented content file.
- Letter opens/closes by keyboard and focus is restored to trigger.
- Audio is silent until clicked; audio failure does not block story.
- Reduced-motion mode exposes all six scenes without scroll-controlled camera movement.
- Story and letter remain available when WebGL or asset loading fails.

## Risk Assessment

- Medium likelihood / medium impact: text overlaps high-contrast scene content. Mitigate using fixed safe text zones, dark backing, and viewport screenshot checks.
- Medium likelihood / high impact: hidden WebGL-only text makes experience inaccessible. Keep all meaningful text in DOM and test with keyboard/reduced motion.
- Low likelihood / medium impact: autoplay restrictions reject sound. Start muted and handle rejected playback promise without visible failure.

## Rollback

Turn off optional sound and motion effects while keeping semantic HTML scenes and letter. Content remains independent of the renderer.

