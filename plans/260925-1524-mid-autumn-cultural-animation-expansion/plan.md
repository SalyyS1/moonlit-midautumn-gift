---
title: "Mid-Autumn cultural animation expansion"
description: "Mở rộng chuyến bay 3D thành nhiều điểm dừng văn hoá Trung Thu Việt Nam, nâng chất lượng nhân vật và tự động mở lá thư."
status: in-progress
priority: P1
effort: "10-15 ngày làm việc"
tags: [threejs, blender, animation, vietnamese-culture, mid-autumn]
created: 2026-09-25
relatedPlan: 260924-1441-midautumn-3d-rebuild
---

# Mid-Autumn cultural animation expansion

## Execution checkpoint — 2026-09-26

The first cultural implementation slice is in the working tree. The manifest
now carries fourteen named beats across the six stable chapter IDs; the
Blender export contains Cuội/Hằng, a seated Cuội, two rabbit pounding vignettes,
lantern sway/flicker, fire/embers, a compact lân/sư dance and automatic
`LetterRise`/`LetterOpen` actions. Expansion QA reports `npm test` 20/20,
`npm run typecheck`, `npm run validate:assets` and production build passing;
the latest full diagnostic browser matrix is 24/24 with no page exceptions.
See the [QA report](reports/qa-260925-expansion-validation.md).

This remains an implementation checkpoint, not release approval. First
meaningful 3D is 2,169.8 ms on the current Intel Iris Xe run, above the
1,500 ms target; lower first-load work and rerun the release capture. The
new character and cultural prop slice still needs human wide/mid/close visual
approval, and the optional dragon procession is deferred until the lân slice
clears those gates. No Pages deploy is authorized from this diagnostic build.

## Overview

Đây là kế hoạch nối tiếp bản true 3D hiện tại. Mục tiêu là biến sáu pod và bảy mốc hiện có thành một hành trình có khoảng 14–16 beat camera: Cuội ngồi dưới gốc đa, các bé thỏ giã bánh giầy theo hướng vui chơi lễ hội, Chị Hằng múa, lửa và đèn lồng có nhịp sống, rồi lân/sư/rồng xuất hiện trước khi phong thư tự bước ra và mở theo tiến độ cuộn.

Chuyến bay vẫn là một rail liên tục. “Nhiều frame” ở đây nghĩa là nhiều điểm dừng có chủ đích và các đoạn hold/entrance/exit, không phải cắt ảnh hoặc đổi visible giữa các scene. Mỗi animation quan trọng phải là clip authored hoặc motion deterministic có trạng thái tuyệt đối theo progress để cuộn xuôi/ngược không lệch.

Kế hoạch ưu tiên dựng từng vertical slice và xin visual review trước khi mở rộng tiếp. Không tải model ngẫu nhiên rồi đưa thẳng vào GLB: nhân vật và đạo cụ văn hoá sẽ được dựng original trong Blender; asset ngoài chỉ dùng khi license cho phép redistrib static và có ledger/hash rõ ràng.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | 14–16 beat camera/timeline có entrance, hold, exit và khoảng dừng nhìn rõ | P1 |
| 2 | Cuội, Hằng, thỏ, lân/sư/rồng có silhouette cuti, biểu cảm và hành động thật | P1 |
| 3 | Lửa, đèn lồng, trống/lân, bánh giầy và cây đa mang nét Trung Thu Việt Nam mà không biến thành overlay giả | P1 |
| 4 | Phong thư tự đi lên, flap mở, giấy ổn định và nội dung hiện ra ở cuối rail | P1 |
| 5 | Giữ GLB ≤8MB, initial payload ≤25MB, 55+ FPS warm, không frame >33ms trong 10s | P1 |

## Phases

| # | Phase | Depends on | Status |
|---|-------|------------|--------|
| 1 | [Scope, cultural references and acceptance](./phase-01-start.md) | current local 3D baseline | In progress — scope/ledger captured; style review open |
| 2 | [World storyboard and camera beats](./phase-02-world-storyboard-and-camera-beats.md) | 1 | In progress — 14 beats landed; full visual capture open |
| 3 | [Cultural prop and character art](./phase-03-cultural-prop-and-character-art.md) | 1, 2 | In progress — authored slice landed; visual approval open |
| 4 | [Authored animation and interaction clips](./phase-04-authored-animation-and-interaction-clips.md) | 2, 3 | Completed technically — 67 clips/absolute tests pass |
| 5 | [Automatic letter reveal and story UI](./phase-05-automatic-letter-reveal-and-story-ui.md) | 2, 4 | Completed technically — auto reveal/reverse/fallback pass |
| 6 | [Performance and asset licensing](./phase-06-performance-and-asset-licensing.md) | 3, 4, 5 | In progress — ledger/validator pass; first-load target open |
| 7 | [Visual review and rollout](./phase-07-visual-review-and-rollout.md) | 5, 6 | In progress — human visual gate and release capture open |

## Cross-cutting architecture

- public/assets/manifest.json remains the sole asset/timeline contract consumed by loader, UI and tests.
- Keep the six existing semantic chapter IDs and deep links; add world.beats with 12–14 cinematic beat IDs, chapterId, pod, caption and clip. src/scene/camera-sheet.ts grows from seven marker regions to authored beat knots; Timeline maps chapter IDs to beat ranges rather than toggling scene visibility.
- art/blender/build-environment.py and focused source modules own geometry, rigs and clips. Runtime MotionMixer handles bounded fire/ember/flicker only when authored clips would multiply draw calls.
- AnimationDirector receives absolute beat progress and applies CUOI_SeatIdle, CUOI_Gesture, HANG_Dance, rabbit pound loops, lân/dragon loops and LetterOpen deterministically.
- src/ui/story-overlay.ts exposes beat copy and cultural captions without covering hero characters; main.ts keeps readable/no-WebGL paths complete.
- A new art/THIRD_PARTY_ASSETS.md records source URL, author, license, retrieval date, SHA-256 and modifications for every non-original file. No external URL or hotlink ships at runtime.

## Success Criteria

- [ ] Camera has 14–16 named beats with visible entrance/hold/exit timing; real wheel capture demonstrates at least moon → Cuội → rabbits → Hằng → lantern/fire → lân/sư/rồng → letter.
- [ ] Cuội is seated at the banyan root; Hằng performs a readable loop; rabbits perform a readable pounding loop; lân/sư/rồng has a readable dance beat.
- [ ] Fire emits capped embers, lanterns flicker/sway with phase offsets, and cultural props are authored or license-cleared.
- [ ] Letter rises and opens automatically from progress .84–.96; no “Mở lá thư” click is required for the cinematic path, while the accessible reading path still exposes the text.
- [ ] Character proportions, facial planes, clothing trim, hands and hair pass a wide/mid/close visual review as cute storybook figures.
- [ ] Runtime tests cover forward/reverse absolute animation, interruption at every beat, hidden-tab pause, cleanup, and no duplicate RAF.
- [ ] Asset validator proves embedded/local assets, clip inventory, bounds, no external URLs, GLB/payload budgets and license ledger.
- [ ] Human visual approval is recorded before the next cultural slice; no Pages deployment happens from a diagnostic build.

## Asset sourcing policy

Original Blender work is the default for Cuội, Hằng, rabbits, lân/sư/rồng, bánh giầy tools, drums, envelope and culturally distinctive lanterns. Poly Haven states that its assets are CC0 (license: https://polyhaven.com/license; FAQ: https://docs.polyhaven.com/en/faq); use it only for generic bark/ground/rock/material support. Quaternius advertises CC0/QAL terms (https://quaternius.com/license.html) but its redistribution constraints require legal review before embedding public GLB files. Sketchfab licenses are per-model and may require attribution (https://sketchfab.com/licenses); do not ship a model unless its exact page, creator and license are captured. Never use ripped game/anime models or AI assets with unclear provenance.

## Open decisions

1. Use lân/sư first as the readable hero dance; add a dragon procession only if the lân vertical slice holds the performance budget.
2. Keep the rabbit pounding scene playful and clearly fictionalized as a festive vignette; do not present it as a claim about a universal Vietnamese Mid-Autumn ritual.
3. Retain the modal letter as a keyboard/readable affordance, but cinematic users see the physical envelope reveal automatically.

<!-- slug: mid-autumn-cultural-animation-expansion -->
