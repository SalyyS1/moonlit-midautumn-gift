---
title: "True 3D rebuild: evidence before release"
date: 2026-09-25
status: in-progress
scope: "Local rebuild repair; not a release record"
---

# True 3D rebuild: evidence before release

## Context

The [rebuild plan](../../plans/260924-1441-midautumn-3d-rebuild/plan.md) calls for a semi-realistic authored world and a visual slice gate. The incoming working tree had already expanded the world before that gate was accepted.

## What happened

The team repaired real rig deformation and source actions, camera continuity, asset validation, reversible envelope animation, resource cleanup and readable fallback paths. A test-valid export exposed another limit: the first desktop performance sample missed the plan's loading and frame-time targets. Static batching and an isolated browser measurement improved steady FPS, but first-render time and the strict frame-time limit still failed.

A browser glyph check also exposed split Vietnamese headings. The font correction was verified with refreshed screenshots, while the performance record retained its original measurement scope.

The [execution report](../../plans/260924-1441-midautumn-3d-rebuild/reports/pm-260925-1440-rebuild-progress.md) owns measurements and unresolved acceptance. No public deployment is recorded here.

## Reflection and decisions

The expensive mistake was treating artifact existence as progress toward visual acceptance. Rigging, animation and budgets can be verified mechanically; character style still needs its own review. Recording the bypassed gate is more useful than retroactively marking it passed.

Keep the original source and procedural rollback available. Keep bloom disabled until there is measured headroom. Keep incomplete storyboard actions explicit rather than renaming secondary motion to imply they exist.

## Next

Close the loading/frame-time, storyboard and visual gates before considering release. AgentWiki publishing was skipped because no AgentWiki tool was available; this entry remains local.
