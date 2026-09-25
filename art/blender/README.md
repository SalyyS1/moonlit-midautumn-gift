# Mid-Autumn 3D source

The public scene is the Blender-authored `moonlit-world.glb`, exported from
`moonlit-world.blend` with Blender 4.5.10 and glTF 2.0. The Node script in
`scripts/build-world-glb.mjs` is kept only as an explicit
`npm run build:blockout` fallback; it writes `art/blockout/midautumn-world.glb`
and never changes the runtime manifest.

Rebuild with `node scripts/rebuild-world.mjs`. The wrapper accepts
`BLENDER_PATH`, searches PATH, then reuses a Windows portable installation
under `~/Tools` or an installed Blender under Program Files. It never downloads
executables. For example, in PowerShell:

```powershell
$env:BLENDER_PATH='C:/path/to/blender.exe'
node scripts/rebuild-world.mjs
```

`build-environment.py` regenerates and saves the source `.blend`, exports the
world and source actions, then runs `scripts/write-world-manifest.mjs` to
measure exact GLB bytes, names, beat metadata and world-space Y-up bounds.
Cameras and lights stay in the authoring source and are excluded from the GLB.

## Authored cultural slice

The current source is original project work; see
[`art/THIRD_PARTY_ASSETS.md`](../THIRD_PARTY_ASSETS.md) for the provenance
ledger and generated hashes.

- `characters.py` authors Cuội and Hằng with face planes, hair, sleeves,
  hands, clothing trim and skeletal actions. It also adds a seated
  `CUOI_SEATED` silhouette placed at the banyan roots.
- Two compact moon-rabbit mascots (`THO_RabbitA` and `THO_RabbitB`) share the
  low-poly storybook language and each has a separate mortar, pestle, paws and
  looping `THO_Rabbit*_Pound` actions. The scene is a playful fictional
  festival vignette, not a claim about a universal Vietnamese ritual.
- `environment.py` authors the silk lantern row with sway/flicker actions, a
  capped brazier with flame and ember sources, a small drum and a compact
  lân/sư head with a readable `LAN_Dance` bob-and-turn loop.
- The envelope has authored `LetterRise` and `LetterOpen` actions. Runtime
  progress drives the physical rise and flap automatically; the HTML letter
  remains available for reading-mode and accessibility paths.

The requested dragon procession is deliberately deferred. It can be added as
a second authored slice only after the lân beat passes the visual and
performance gates; no untracked model download is used to fill that gap.

The exported manifest currently contains six separated pods, fourteen named
camera beats and the authored cultural clips. Existing clips
`CUOI_Idle`, `CUOI_Look`, `HANG_Idle` and `HANG_Wave` remain for compatibility;
new beat clips are optional at runtime so an older local GLB can still load.

## Authoring and coordinate contract

`character-rig.py` owns the hero armatures and loopable actions. `letter-flap.py`
owns the triangular flap hinge. `moon-surface.py` creates the smooth UV moon
and original 512×256 albedo/normal textures. Images are packed in the `.blend`
and embedded in the GLB; no external images or borrowed assets are required.

Blender uses +Y for the corridor and +Z up while the web runtime maps that
corridor to -Z. Hero roots are authored around x=-2.3/+2.3 for Cuội/Hằng;
the seated Cuội and rabbit roots are local to the garden pod. Do not add a
second world translation when parenting the returned roots to
`pod_cuoi_hang`.

For the seven poster images and visual review views, add `--render` to
`node scripts/rebuild-world.mjs`, or run:

```powershell
blender -b art/blender/moonlit-world.blend --python art/blender/render-vertical-slice.py
```

This writes review PNGs under `work/vertical-slice` and no-text
`public/assets/posters/scene-00.webp` through `scene-06.webp`; Python with
Pillow performs loss-limited format conversion only.

## Validation boundary

Run `npm run validate:assets` after every export. The latest expansion QA pass
validated a 6.7 MB GLB, six pods, 66 authored clips, two embedded textures and
seven local posters. Browser/runtime checks pass, but first meaningful 3D is
still above the expansion target on the current Intel Iris Xe machine and the
new character/prop slice still needs human wide/mid/close visual approval.
A successful export is therefore evidence of asset integrity, not art-quality
or release approval.
