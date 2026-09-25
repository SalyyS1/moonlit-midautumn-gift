---
title: "Expansion QA validation"
date: 2026-09-26
status: "pass with performance blocker"
---

## Scope

Validated the cultural beat contract, authored animation clips, automatic letter reveal, reverse traversal, focus restoration, browser navigation and readable fallback behavior after the beat/runtime and art slices landed.

## Results

- `npm test`: **20/20 passed**. Covers the 14-beat ordering/chapter/pod/caption contract, Timeline clamp/reverse determinism, cultural clip windows, absolute forward/reverse weights, real GLB parsing, loader failures and optional-clip compatibility, registry bounds, disposal, scroll resize, static batching, hidden-tab pause and runtime cleanup.
- `npm run typecheck`: **pass**.
- `npm run validate:assets`: **pass** — 6,705,664-byte GLB, six separated pods, 67 authored clips, two embedded textures and seven local posters.
- `npm run build`: **pass**. Vite still reports the existing single JS chunk warning (625.25 kB minified).
- Browser diagnostic full matrix: **24/24 checks passed**, 0 page exceptions. This includes exact progress captures, automatic letter opening without click at `.95`, reverse re-arm below `.82`, keyboard trap and Escape, responsive cinematic/readable layouts, focus restoration after a live reduced-motion toggle, the photo-placeholder-free memory chapter, idle animation, persisted lifecycle, context loss, WebGL/GLB fallback and no-JS fallback.
- Warm runtime sample: **60.01 FPS**, p95 **16.8 ms**, max **17.2 ms**, **0** frames over 33 ms on the Intel Iris Xe D3D11 hardware path.

Evidence: `work/browser-validation/evidence/browser-report.json` (full matrix), `work/browser-validation/evidence-final/browser-report.json` (selected visual rerun), and their screenshots.

## Performance blocker

First meaningful 3D was **2,169.8 ms** on the current machine, above the plan target of `<1,500 ms`. The warm frame budget passes and the browser is hardware accelerated, but the release gate remains closed until initial loading is reduced and the same matrix is rerun with `--release`.

## Warnings and unresolved questions

- Expected diagnostic warnings appear for the intentional GLB-404, disabled-WebGL and context-loss scenarios; they are covered by fallback checks and no page exceptions occurred.
- Human visual approval of wide, mid and close camera stops is still open for the new character/prop slice.
- The optional dragon procession remains deferred until the lân slice clears the visual and performance gates.
- No Pages deploy or release approval is inferred from this diagnostic run.
