---
title: "True 3D scroll-world rebuild architecture"
description: "Architecture audit and implementation plan for replacing procedural layers with authored GLB scenes and a continuous camera rail."
status: pending
priority: P1
effort: 5 phases
tags: [threejs, blender, glb, scroll-world, github-pages]
created: 2026-09-24
---

# True 3D scroll-world rebuild

## Audit and root cause

The public build is explicitly procedural (`README.md:3,26-28`; `docs/asset-guide.md:3`). The runtime creates the moon, gate, characters, lanterns, memories, and letter as Three.js primitive geometry (`src/scene/MoonlitSceneRuntime.ts:216-340`). Its scroll path interpolates between discrete anchor pairs and calls `lookAt` on each frame (`src/scene/MoonlitSceneRuntime.ts:361-378`), while the motion layer only adds sine-wave transforms to those primitives (`src/scene/MoonlitSceneRuntime.ts:380-389`). This produces a sequence of staged poses, not a continuous flight through a modeled world. The smoke test does not validate model assets or animation clips (`scripts/smoke-test.mjs:1-13`).

The rebuild therefore changes the scene representation and camera path together. Cosmetic material tweaks alone will not address the rigid transitions or weak silhouettes.

## Reference architecture decision

The upstream `scroll-world` reference is a pre-rendered video chain (`dive_*` and `connector_*`) scrubbed by scroll; it is not a realtime Three.js multi-layer engine. This explains why it stays visually smooth even with dense animation. There are three viable choices:

1. **Realtime GLB:** actual interactive 3D, but quality depends on authored assets and GPU budget.
2. **Rendered video scrub:** closest visual parity and smoothest cinematic dive, but the scene is not live 3D.
3. **Hybrid (recommended):** author the world and characters in Blender, export GLB for the live scene and render the hero moon dive/connectors to local WebM/MP4 for scroll scrubbing. Use GLB for the chapter pods, interactions, and animation after the hero. Keep a poster/DOM fallback for unsupported video/WebGL.

The hybrid option satisfies the request for real 3D source models while matching the reference’s continuous cinematic zoom. If the requirement is strictly realtime 3D, choose option 1 and accept the vertical-slice/performance gates before expanding the asset pack.
## Target behavior

The viewer flies through one continuous moonlit world. Every chapter is a physical pod placed on the rail. Foreground, middle, and background layers stay mounted in the scene and move at different depth rates. The camera follows a C1-continuous position and look-at curve. Scroll changes the target progress; a render loop damps toward it. A pause in scrolling leaves the camera stable while character, cloud, leaf, lantern, and water animations continue.

No chapter transition toggles a group’s `visible` property, swaps opaque layers, or reconstructs scene HTML. Distant pods disappear through world depth, fog, and set dressing. HTML remains the accessible text layer and letter dialog.

## Data flow

```text
window.scrollY
  -> main.ts normalizes document progress [0, 1]
  -> ScrollWorldRuntime.setTarget(progress)
  -> RAF damp(currentProgress, targetProgress)
  -> Timeline.evaluate(currentProgress)
      -> CameraRail (position, look target, fov, roll)
      -> SceneRegistry (pod roots and parallax layers)
      -> AnimationDirector (GLB clips and cross-fades)
      -> MotionMixer (wind, sway, twinkle, water)
  -> renderer.render(scene, camera)
```

Asset flow:

```text
art/blender/*.blend
  -> deterministic export script
  -> public/assets/models/*.glb + manifest.json
  -> AssetLoader (GLTFLoader + self-hosted decoder)
  -> SceneRegistry clones and places pod roots
```

Deployment flow:

```text
commit main -> npm ci -> asset validation -> smoke test -> typecheck -> Vite build
-> Pages artifact -> GitHub Pages
```

## File and module boundaries

- `src/scene/ScrollWorldRuntime.ts`: renderer lifecycle, RAF, resize, target/current progress, disposal.
- `src/scene/CameraRail.ts`: typed knots, Catmull-Rom/Hermite C1 interpolation, tangent look-ahead, fov and roll.
- `src/scene/Timeline.ts`: chapter markers and per-pod visibility-independent transforms.
- `src/scene/AssetLoader.ts`: manifest loading, GLTFLoader, DRACO/Meshopt decoder setup, priority queue, cache, progress and error events.
- `src/scene/SceneRegistry.ts`: pod roots, depth layers, bounding boxes, object labels, placement checks.
- `src/scene/AnimationDirector.ts`: AnimationMixer per rig, named actions (`Idle`, `Walk`, `Wave`, `HoldLantern`), cross-fades and cleanup.
- `src/scene/MotionMixer.ts`: deterministic procedural motion on immutable base transforms.
- `src/scene/lighting.ts` and `src/scene/postfx.ts`: moon key light, lantern emissive lights, fog, exposure, optional desktop bloom.
- `src/scene/manifest.ts`: typed manifest schema and preload priorities.
- `src/scene/index.ts`: keep the existing `createMoonlitWorld`, `updateMoonlitWorld`, and `disposeMoonlitWorld` facade (`src/scene/index.ts:1-7`) so DOM code does not depend on the renderer internals.
- `public/assets/models/`: exported GLB files.
- `public/assets/posters/`: chapter posters for preload and no-WebGL/error fallback.
- `public/vendor/draco/` or `public/vendor/meshopt/`: self-hosted decoders; never load a runtime decoder from a CDN.
- `art/blender/`: optional source `.blend` files; use Git LFS only if sources exceed normal Git limits.
- `scripts/validate-assets.mjs`: manifest/schema/file-size/animation-name/no-external-URL checks.
- `scripts/smoke-test.mjs`: extend current checks to assert manifest IDs, local paths, pod IDs, and stable scene facade.

## Asset plan

Create six GLB pods: `moon-garden.glb`, `gate.glb`, `cuoi.glb`, `hang.glb`, `lantern-street.glb`, `memory-letter.glb`. Keep Cuội and Hằng as rigged character GLBs so their silhouettes and animation are authored, rather than assembled from spheres, cones, and cylinders. Use Blender origins at feet, meters, +Y up, named nodes (`pod_*`, `cam_*`, `fx_*`), UVs, matte PBR materials, baked normals, and no hidden cameras/lights.

Character acceptance: 20–60k triangles each, 1–2K textures, no T-pose, and at least `Idle`, `Walk`, and one expressive gesture action per character. Scene models should include the banyan, lunar gate, lantern street, water, moon surface, clouds, and letter stage. Keep the total initial payload at or below 25 MB; each GLB should stay below 8 MB. Draco or Meshopt compression is required; WebP/KTX2 textures are preferred when they do not hurt load reliability.

## Camera and layer implementation

Use a typed camera rail with 8–12 knots. Each knot stores progress, camera position, look target, field of view, and optional roll. Evaluate with a C1-continuous curve, then use tangent look-ahead so the camera turns before each pod rather than snapping its target. Apply exponential damping to progress in the RAF. Keep a small mouse/parallax input independent from scroll and clamp it to avoid motion sickness.

Each pod declares world-space bounds and depth layers. Build the rail so adjacent pod bounds do not intersect. Animate layers with a composition of base transform + scroll offset + time motion; never mutate the base transform in more than one system. Repeat lanterns with instancing where they share geometry. Use fog and portal arches to hide distant set transitions. Do not use `visible` thresholds as a scene transition mechanism.

## Phases and gates

### Phase 0 — visual contract and vertical slice

Record the six pod positions, camera knot table, art references, color/material targets, and performance budget. Build only the moon pod plus Cuội/Hằng as an authored vertical slice. Gate: the slice loads as GLB, the camera rail is continuous, and a visual review confirms the silhouettes are worth expanding. Risk: starting all six models before proving the style. Mitigation: no full production until the slice passes.

### Phase 1 — runtime and camera rail

Create the modules listed above, retain the current scene facade, and add `VITE_SCENE_MODE=glb|procedural` for rollback. Gate: sampled progress has no position/look discontinuity, no progress-driven `visible` or opaque layer swapping exists, and an empty rail sustains the desktop frame target. Risk: a new curve can overshoot or reverse. Mitigation: clamp progress, validate knot tangents, and test monotonic distance along the rail.

### Phase 2 — Blender models and export

Model, rig, animate, and export all six GLBs; generate a typed manifest with bounds and clip names. Gate: every model opens in an isolated viewer, names and animations match the manifest, and budgets are met. Risk: asset quality remains toy-like. Mitigation: review the vertical slice first, require real facial/hair/clothing silhouettes, and reject any asset that reads as primitive geometry at the chapter camera.

### Phase 3 — loader, pods, animation, lighting

Integrate GLTFLoader with local decoders, load the first pod eagerly and later pods by priority, register mixers, and add wind/lantern/water motion. Add desktop-only bloom with a no-postfx fallback. Gate: the camera can pause while animations remain alive, clips cross-fade without a T-pose, and asset/network errors show a poster while preserving chapter text. Risk: decoder paths fail under the repository subpath. Mitigation: derive every URL from `import.meta.env.BASE_URL` and run CI against the built repository path.

### Phase 4 — content, performance, accessibility, deploy

Keep text in `src/content.ts` and the letter in `index.html`. Synchronize chapter copy to timeline markers. Extend validation and smoke checks, run desktop/reduced-motion/no-WebGL checks, and deploy only after the Pages build is green. Gate: six scenes are reachable, letter and chapter navigation work, and no console/network errors remain. Risk: art payload creates a blank first load. Mitigation: poster preload, first-pod priority, lazy later pods, and a semantic story fallback.

## Risk register

- **High — GLB quality/time:** approve one-pod vertical slice before the full pack; keep `.blend` sources and posters.
- **High — payload/bandwidth:** enforce per-file and total budgets, compress geometry/textures, and lazy-load pods.
- **High — rigid motion persists:** require C1 camera review and sample path deltas; reject any implementation that uses progress visibility switches.
- **Medium — decoder/base-path failure:** self-host decoder files, use `BASE_URL`, and validate built asset URLs in CI.
- **Medium — animation clip/retarget failure:** manifest clip names, isolated GLB checks, and procedural idle fallback.
- **Medium — GPU cost:** cap DPR, instance repeated props, disable bloom for low-end/reduced-motion.
- **Low — personal data leakage:** keep placeholders and prohibit external runtime URLs; only add personal photos intentionally (`docs/asset-guide.md:7-12`).

## Test and acceptance matrix

- Unit: rail interpolation continuity, monotonic progress, damping convergence, manifest schema, file-size budgets.
- Integration: GLB/decoder loading, named clips, pod bounds, registry cleanup, first-pod priority.
- Manual/e2e: 1440x900 and 1920x1080 desktop scroll; pause while idle animations run; chapter navigation; letter dialog; reduced motion; WebGL disabled; direct GitHub Pages path.
- Measurable release criteria: six authored GLB pods; rigged Cuội/Hằng with named idle and gesture clips; no progress-driven visibility swaps; C1 camera path; first meaningful 3D within 1.5 seconds on local production build; at least 55 FPS after warm-up on the reference desktop; each GLB under 8 MB, initial payload under 25 MB; zero console errors and zero external asset requests.

## Compatibility and rollback

Keep the current procedural runtime behind `VITE_SCENE_MODE=procedural` until GLB mode passes all gates. Preserve the DOM story, keyboard navigation, reduced-motion behavior, and no-WebGL fallback. Develop on a feature branch, deploy only after atomic commits pass CI, and roll back by reverting the feature commit; GitHub Pages continues serving the last successful artifact while the new run completes.

