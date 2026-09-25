---
phase: 7
title: "Visual review and rollout"
status: in-progress
priority: P1
effort: "1-2 days"
dependencies: [5, 6]
---

# Phase 7: Visual review and rollout

## Execution checkpoint — 2026-09-26

The diagnostic browser matrix is green, but the new character/prop slice has
not received human wide/mid/close approval yet. Capture the requested beats,
review cultural tone and readability, then rerun the release performance gate;
do not deploy the current diagnostic build.

## Overview

Review the expanded slice as a recipient would see it, then decide whether to continue the next culture beat or prepare a release. This phase is a gate, not an automatic deploy.

## Requirements

- Functional: wide/mid/close captures, real-wheel video, readable fallback, final letter and reverse traversal are inspectable.
- Non-functional: human approval of cute character quality and cultural tone; release only after performance and asset gates pass.

## Related Code Files

- Modify: plans/260925-1524-mid-autumn-cultural-animation-expansion/reports/
- Verify: scripts/capture-progress.mjs, scripts/test-view-mode.mjs, .github/workflows/deploy-pages.yml

## Implementation Steps

1. Capture one vertical slice at a time: Cuội/rabbits first, Hằng/fire/lanterns second, lân/sư/rồng third, letter final.
2. Review silhouette, facial appeal, culturally recognizable props, camera safe zones, text readability and motion at normal/reduced preference.
3. Record unresolved art/performance issues in the plan; do not quietly lower the semi-realistic/cute target.
4. Only after human approval, merge the next slice and consider Pages deployment through the existing workflow.

## Success Criteria

- [ ] User approves the wide/mid/close visual slice and cultural tone.
- [ ] Performance, license, fallback and direct-refresh gates pass on the target browsers.
- [ ] Release notes identify source files, asset credits and rollback switch.

## Risk Assessment

The requested richness can become visual noise. Keep holds calm, limit concurrent hero actions, and let the letter reveal be the quiet final beat.
