---
phase: 3
title: "Cultural prop and character art"
status: in-progress
priority: P1
effort: "3-5 days"
dependencies: [1, 2]
---

# Phase 3: Cultural prop and character art

## Execution checkpoint — 2026-09-26

The original Blender slice now includes a seated Cuội, two rabbit pounding
vignettes, Hằng's dance-ready rig, lantern/fire/drum props and a compact lân/sư
hero. The dragon procession is intentionally deferred. Export and structural
asset checks pass, but wide/mid/close review of proportions, silhouette,
facial appeal and cultural tone is still a human gate.

## Overview

Improve Cuội and Hằng first, then add the small cast and props needed for the cultural beats. The art target is cute storybook 3D: clear silhouettes, appealing faces, matte materials and hand-authored details.

## Requirements

- Functional: Cuội can sit at the banyan root; Hằng has a dance-ready silhouette; rabbits, lân/sư and props have named roots and clean transforms.
- Non-functional: hero meshes stay within triangle/material budgets; all skin/rig data exports correctly and no detached hair, neck or hand intersections remain.

## Related Code Files

- Modify: art/blender/characters.py, art/blender/character-rig.py, art/blender/environment.py, art/blender/build-environment.py
- Create: focused source modules for rabbit, lion-dance and festival-props as needed; art/THIRD_PARTY_ASSETS.md
- Verify: scripts/validate-assets.mjs

## Implementation Steps

1. Refine face planes, eyes, hair attachment, sleeves, hands and clothing trim on Cuội/Hằng; make a seated Cuội variant without a floating pelvis.
2. Model two or three original childlike rabbits with shared mesh/materials and distinct scale/pose; include mortar/pestle and bánh giầy props as a playful vignette.
3. Model a compact lân/sư head, cloth body, drum and performers; reserve dragon procession as an optional second slice.
4. Add banyan root/branch staging, lantern row, fire bowl, ember source, moonlit lake and letter table details.
5. Export a vertical slice with neutral pose and inspect wide/mid/close renders before merging into the full world.

## Success Criteria

- [ ] Cuội, Hằng and new props pass wide/mid/close visual review as cute and intentional.
- [ ] All culturally distinctive assets are original or have an approved license ledger entry.
- [ ] New meshes have no T-pose, bad parenting, z-fighting or detached attachments.
- [ ] GLB size and draw-call budget remain measurable after the slice.

## Risk Assessment

Third-party character rigs often bring hidden materials, incompatible actions and redistribution restrictions. Use external files only as reference or for generic support textures after explicit license review.
