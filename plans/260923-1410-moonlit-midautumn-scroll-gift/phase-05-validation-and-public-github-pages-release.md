---
phase: 5
title: "Validation and public GitHub Pages release"
status: completed
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 5: Validation and public GitHub Pages release

## Overview

Validate the completed site and publish source to a public GitHub repository with a successful GitHub Actions Pages deployment.

## Requirements

- Functional: public source repository, Pages enabled through Actions, working public URL with correct asset paths.
- Non-functional: CI fails safely, no secrets/private content, reproducible build, documented rollback.

## Architecture

GitHub Actions triggers on pushes to main and manual dispatch. Job uses pinned Node major, `npm ci`, quality checks, build with repo base path, uploads `dist/`, then deploys via official Pages actions and least-privilege `pages: write` / `id-token: write` permissions. Require successful build before deploy. Build artifacts are immutable per run; failure never runs deployment. Repository source stays public by explicit user request; use placeholders until user assets are intentionally committed.

## Related Code Files

- Create: `.github/workflows/deploy-pages.yml`, `docs/release-and-rollback.md`.
- Modify: `package.json`, `vite.config.ts`, `README.md`, repository Pages settings.
- Delete: no files expected.

## Implementation Steps

1. Add unit/integration tests for timeline/progress and browser flow for six chapters, letter, reduced motion, errors, and base path.
2. Run clean install, typecheck/lint, production build, test suite, and inspect built paths/file-size budget.
3. Validate desktop Chromium flow and a narrow viewport fallback; keyboard-check chapter flow and letter.
4. Confirm current authenticated GitHub identity and inspect available repo names/remote. Reuse a matching user-owned repo if appropriate; otherwise create the requested public repo with a clear project name and no preexisting-history overwrite.
5. Push reviewed source to `main`, configure Pages source as GitHub Actions, and monitor workflow to terminal success.
6. Open public Pages URL, verify all assets, refresh/base path, scroll scenes, letter and audio interaction; record the URL.
7. Document commit SHA, Actions run, release URL, and rollback steps.

## Success Criteria

- CI quality/test/build job passes on pushed `main` commit.
- Pages deployment job succeeds and exposes a public URL.
- Live site loads with no broken local assets on direct open/refresh; all six scenes and final letter work.
- Repository is public and contains no credentials, private media, or unintended metadata.
- Rollback to prior commit is documented and deployable.

## Risk Assessment

- High likelihood / high impact: wrong Vite base path causes 404 for assets. Mitigate with explicit repo-name base and a built-output assertion plus live smoke check.
- Medium likelihood / high impact: GitHub authentication/permissions or Pages setting blocks release. Mitigate by checking identity and repo access before push; diagnose Actions/Pages permission errors without exposing tokens.
- Medium likelihood / medium impact: public repository reveals accidental private assets. Mitigate by checking staged file list and secret scan before first public push; keep placeholders.
- Low likelihood / high impact: deployment action breaks after successful build. Mitigate by pinning reviewed major versions, only deploying successful artifact, and retaining reversible commit-based rollback.

## Rollback

Revert `main` to previous known-good commit and let Actions redeploy. For workflow-level outage, restore prior workflow from Git history and rerun deployment; previous Pages artifact remains current until a new successful deploy.

