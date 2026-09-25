# Asset guide

Use original, locally hosted assets so this personal gift remains reproducible without a paid service or a runtime CDN. Public deployment is deliberate publication: leave placeholders until the owner supplies photos and names intended for that audience.

## Where to edit

[Typed content](../src/content.ts) owns the editable story, letter and memory captions. Keep the [semantic HTML fallback](../index.html) aligned when personalizing, including its no-JavaScript letter.

[Blender authoring guidance](../art/blender/README.md) points to the scene source and export command. Memory-frame artwork belongs to that authoring source; the content schema is not an image-upload interface. Adding personal photos requires an authored asset change and a new export.

The [generated manifest](../public/assets/manifest.json) owns asset paths, source/license metadata, bounds and clip names. Change its [generator](../scripts/write-world-manifest.mjs) rather than hand-maintaining a second inventory.

## Before sharing

Use the [asset validator](../scripts/validate-assets.mjs) and [release guide](release-and-rollback.md). A valid export proves its mechanical contract; it does not approve the characters' art direction.
