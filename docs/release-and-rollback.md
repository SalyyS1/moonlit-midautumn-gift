# Release and rollback

The `main` branch is the source of truth. A successful push runs `.github/workflows/deploy-pages.yml`, builds with the repository base path, and deploys `dist/` to GitHub Pages.

## Verify a release

- Check the Actions run is green.
- Open `https://<owner>.github.io/<repository>/` directly and refresh once.
- Scroll through all six chapters, open the letter, and test the sound button after a click.
- Check the page with `prefers-reduced-motion` enabled and with a narrow viewport.

## Roll back

Revert the bad commit on `main` and push. GitHub Pages will retain the last successful artifact until the new workflow finishes. If a workflow change caused the failure, restore the previous workflow from Git history and rerun it.
