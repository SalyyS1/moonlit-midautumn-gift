# True 3D art contract

This is the target art and spatial contract, not evidence of visual approval. The [design brief](approved-design-brief.md) owns the recipient experience.

## Decisions and constraints

Choose cinematic semi-realistic storybook 3D: authored silhouettes and facial planes, matte materials, warm moonlight against a deep violet night. Exporting primitive assemblies to GLB alone does not satisfy the character-quality target. Do not invent a real person's likeness without supplied references and rights.

Keep a coherent world in a shared coordinate system. Spatial separation, framing and depth must carry the journey; chapter changes must not hide or fade opaque scene pods. Cuội and Hằng share a garden pod while retaining separate storyboard stops.

Retain the procedural route for rollback while the authored world is under review. Favor a simple uncompressed export until measured loading or payload costs justify a decoder or split assets. Bloom is optional and requires both visual benefit and performance headroom.

The acceptance budgets are an initial payload no larger than 25 MB, a main GLB no larger than 8 MB, first meaningful 3D below 1.5 seconds on the reference local production build, at least 55 FPS after warm-up, and no frame above 33 ms in the ten-second warm sample. A green build does not waive visual or performance acceptance.

## Executable owners

| Concern | Owner |
|---|---|
| Authored geometry, rig and export | [Blender source route](../art/blender/README.md) |
| Asset metadata and mechanical validation | [Manifest](../public/assets/manifest.json), [validator](../scripts/validate-assets.mjs) |
| Camera framing and spatial boundaries | [Camera sheet](../src/scene/camera-sheet.ts), [scene registry](../src/scene/SceneRegistry.ts) |
| Authored actions and secondary motion | [Animation director](../src/scene/AnimationDirector.ts), [motion mixer](../src/scene/MotionMixer.ts) |
| Lighting and quality trade-offs | [Lighting](../src/scene/lighting.ts), [performance budget](../src/scene/PerformanceBudget.ts) |
