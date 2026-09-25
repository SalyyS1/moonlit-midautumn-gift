# Release and rollback

Publish only after the visual contract, automated checks and target-desktop performance gates pass. The [art contract](true-3d-art-contract.md) defines acceptance; a local build is not proof that the same artifact is live.

## Validation owners

[Package scripts](../package.json) own the local verification commands. The [Pages workflow](../.github/workflows/deploy-pages.yml) owns CI checks, branch triggers, repository base path and deployment configuration.

The [browser runner](../scripts/capture-progress.mjs) uses a production build under the repository base path. Install its isolated dependency with `npm install --prefix work/browser-validation playwright`; provide `CHROME_PATH` for a browser outside the script's default Windows Chrome location. `PLAYWRIGHT_MODULE_PATH` can select an existing Playwright module.

Run `npm run test:browser -- --release` for strict functional and performance gating. The command without `--release` is diagnostic: inspect its report before making a release decision. Local browser artifacts belong under the runner's ignored `work/` output, not evergreen documentation.

## Publish and verify

Review the exact changes and public media before publishing to `main`. Inspect the resulting Actions run and served artifact, then verify the deployed repository URL, direct refresh, asset requests, story navigation and letter. Record the release commit and evidence in a scoped release record; do not infer availability from the workflow file.

## Rollback

The [scene facade](../src/scene/index.ts) owns the build-time `VITE_SCENE_MODE=procedural` option used during migration. For a published regression, revert the release commit on `main` and verify the replacement deployment through the same workflow. Retain a known-good release commit until the new artifact is verified.
