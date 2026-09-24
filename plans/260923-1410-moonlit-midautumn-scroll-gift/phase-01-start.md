---
phase: 1
title: "Foundation and engine decision"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Foundation and engine decision

## Overview

Establish a minimal static Vite + TypeScript + Three.js application and decide whether to adopt any scroll-world code after a current source/license/API review. Keep the architecture compatible with a GitHub Pages project path.

## Requirements

- Functional: initialize renderer/canvas, local scene root, normalized scroll progress, chapter data contract, and local dev/build commands.
- Non-functional: no runtime server, no paid asset services, deterministic lockfile, static hosting compatibility, explicit license review before copying upstream code.

## Architecture

Browser scroll events (passive) or an animation-frame sampler produce clamped progress `[0,1]`; resize and visibility changes are owned by one scene runtime. No personal content or telemetry is sent. Use one rendering loop, not per-component loops. Compare: (A) small custom timeline using Three.js (recommended: least external coupling); (B) upstream scroll-world engine if compatible, maintained, licensed for redistribution, and smaller/simpler. Do not copy code before license verification.

## Related Code Files

- Create: `package.json`, lockfile, `index.html`, `src/main.ts`, `src/styles.css`, `src/scene/scene-runtime.ts`, `src/scene/scroll-progress.ts`, `vite.config.ts`, `tsconfig.json`, `.gitignore`.
- Modify: none (greenfield).

## Implementation Steps

1. Confirm workspace output directory is the repo root; inspect git state and any remote before initialization.
2. Review scroll-world README/source/package metadata/license and map its actual scroll/video pipeline; record adopt-or-inspire decision.
3. Initialize Vite + TypeScript + Three.js, lock dependencies, set Node version and configurable Vite `base` for Pages.
4. Build empty scene runtime with clamped timeline input, resize/visibility lifecycle, and WebGL unavailable fallback.
5. Add static build and lint/typecheck commands; do not add unneeded frameworks or services.

## Success Criteria

- Clean install and production build succeed from lockfile.
- Build can target `/` locally and `/<repo>/` in production.
- Progress maps finite inputs into `[0,1]`; resize/hidden-tab recovery does not create duplicate animation loops.
- Decision note records upstream license and compatibility evidence.

## Risk Assessment

- Medium likelihood / high impact: upstream dependency is incompatible or license unclear. Mitigate by using only a custom minimal progress-to-transform controller and cite inspiration.
- Medium likelihood / medium impact: WebGL unavailable or context creation fails. Mitigate with semantic HTML poster/story fallback and caught renderer initialization errors.
- Low likelihood / medium impact: repo name unknown breaks base URL. Keep base configurable by environment and cover preview/root and Pages path in build checks.

## Rollback

Remove the experimental upstream dependency or scene runtime and return to the minimal static scaffold; no user data or migrations exist.

