---
title: "Đêm trăng chỉ có hai đứa mình — true 3D rebuild"
description: "Thay prototype primitive bằng thế giới 3D GLB có camera rail liên tục, animation authored và sáu cảnh Trung Thu không snap layer."
status: in-progress
branch: rebuild/true-3d-rail
priority: P1
effort: "8-12 ngày làm việc"
tags: [threejs, blender, glb, animation, scroll-world, github-pages]
created: 2026-09-24
---

# Đêm trăng chỉ có hai đứa mình — true 3D rebuild

## Execution checkpoint — 2026-09-25

**In progress; no rebuild release or visual approval.** The source, canonical Blender export, local integration and fallback checks have advanced. Human review of the semi-realistic character target, missing storyboard actions and final target-desktop performance remain open. The incoming working tree already contained the full world before the required slice gate; that sequence is recorded as a deviation, not accepted retroactively.

[Execution report](reports/pm-260925-1440-rebuild-progress.md) separates current evidence from remaining intent. Phase checkboxes below are scoped to that evidence; local success is not remote CI or deployed-site proof.

## Overview

Bản hiện tại sẽ được coi là prototype đã thất bại về art direction: các primitive `Sphere/Cylinder/Cone` được đặt cùng mặt phẳng rồi animate theo ngưỡng chapter, nên dù thêm easing vẫn cho cảm giác layer snap, chồng hình và vật liệu nhựa. Plan này thay toàn bộ scene runtime bằng một thế giới 3D được author trong Blender, export GLB, rồi Three.js điều khiển bằng một camera rail liên tục.

Mục tiêu là trải nghiệm desktop cinematic có chiều sâu thật: người xem bay từ ngoài mặt trăng vào cung trăng, đi qua Cuội–Hằng, phố đèn, ký ức và sân thư. Tất cả pod nằm trong cùng một hệ tọa độ; không có `group.visible`, không có crossfade theo chapter, không tạo layer mới mỗi lần scroll.

## Quyết định kiến trúc

| Phương án | Độ mượt | Chất lượng hình | Tương tác thật | Quyết định |
|---|---:|---:|---:|---|
| Primitive Three.js hiện tại | 2/5 | 1/5 | 5/5 | Loại bỏ |
| Chuỗi video scrub như `scroll-world` | 5/5 | 5/5 | 1/5 | Chỉ làm fallback/póster nếu GLB lỗi |
| **Blender GLB + Three.js camera rail** | **4/5** | **4/5** | **5/5** | **Chọn** |

`scroll-world` thực tế scrub `video.currentTime` của các clip đã render; sự mượt đến từ camera flight và frame seam đã được khóa trước, không phải từ nhiều primitive realtime. Ta mượn nguyên tắc đó: camera chỉ chạy trên một đường liên tục, mỗi đoạn có điểm vào/ra và vận tốc rõ ràng, nhưng giữ thế giới 3D thật để vẫn có animation, hover và mở thư.

Nếu vertical slice GLB chưa đạt độ mượt thị giác của reference sau khi tối ưu rail, có một nhánh dự phòng cùng nguồn asset: render chính world Blender thành một chuỗi WebM/MP4 scrub theo `scroll-world`, còn GLB giữ cho các tương tác cần realtime. Đây là render từ chính mô hình 3D của dự án, không phải thay bằng ảnh/AI asset không kiểm soát; quyết định bật nhánh hybrid chỉ được đưa ra sau gate hiệu năng.

## Công nghệ và quy ước

- **Authoring:** Blender 4.x, đơn vị mét; nguồn Z-up export sang glTF Y-up. [Nguồn authoring](../../art/blender/README.md) giữ quy ước trục và export.
- **Runtime:** Vite + TypeScript + Three.js WebGL. Rail hiện tại dùng cubic Hermite trong authored story time; lý do chọn nằm ở [phase camera](phase-03-continuous-camera-rail-and-runtime-rewrite.md). Draco/Meshopt chỉ là lựa chọn có điều kiện sau đo đạc.
- **Asset format:** GLB nội bộ; texture Principled PBR, baked AO/normal/roughness; KTX2/WebP và Draco/Meshopt là bước tối ưu sau visual gate. Không runtime CDN.
- **Camera:** position rail + look-at rail + FOV/roll knots; nội suy C1, slerp quaternion, exponential damping theo delta time.
- **Timeline:** scroll chỉ tạo `targetProgress`; RAF damp đến `currentProgress`, evaluate camera/animation từ absolute progress. Không tích lũy delta và không đổi `visible` ở ranh giới chapter.
- **Content/UI:** HTML vẫn giữ copy, nav, letter và fallback để accessibility không phụ thuộc WebGL.
- **Release:** GitHub Pages static, tất cả asset URL đi qua `import.meta.env.BASE_URL`, public repo chỉ chứa asset được phép public.

## World layout và storyboard

Đây là mục tiêu storyboard, không phải danh sách animation đã hoàn tất. Bảy điểm dừng dùng sáu pod; Cuội và Hằng cùng một pod vườn. Clip thực tế nằm trong [manifest](../../public/assets/manifest.json); phần còn thiếu được ghi trong [execution report](reports/pm-260925-1440-rebuild-progress.md).

| Điểm dừng | Nội dung | Camera move | Animation chính |
|---|---|---|---|
| 0 | Trăng ngoài không gian | crane nhẹ rồi dive vào mặt trăng | mây trôi, sao twinkle, halo thở |
| 1 | Cổng cung trăng | xuyên qua cổng và đèn treo | cửa rung nhẹ, đèn sway |
| 2 | Cuội dưới cây đa | orbit nửa vòng quanh đảo | Cuội idle/look, lá và nước chuyển động |
| 3 | Hằng bên hồ | lateral glide sang phía Hằng | tay áo, tóc, đom đóm, mặt hồ |
| 4 | Phố rước đèn | forward tracking giữa foreground/mid/background | 14 đèn lệch pha, hai nhân vật bước |
| 5 | Vòng ký ức | spiral chậm quanh các frame ảnh | frame mở, ảnh/parallax, hạt sáng |
| 6 | Sân thư | dolly-in ổn định tới phong thư | giấy rung, seal glow, couple silhouette idle |

Khoảng cách pod tối thiểu 2–4m theo hướng rail; mọi pod có foreground/mid/background layer **trong không gian riêng**, không phải các mặt phẳng đặt đè nhau. Tên node bắt buộc: `pod_*`, `cam_*`, `CUOI_*`, `HANG_*`, `LANTERN_*`, `FX_*`.

## Module boundaries

[Scene facade](../../src/scene/index.ts) là điểm vào ứng dụng. [Runtime](../../src/scene/ScrollWorldRuntime.ts) giữ lifecycle; [rail](../../src/scene/CameraRail.ts) và [camera sheet](../../src/scene/camera-sheet.ts) giữ đường đi. Asset contract thuộc [manifest](../../public/assets/manifest.json), [loader](../../src/scene/AssetLoader.ts) và [registry](../../src/scene/SceneRegistry.ts). Các phase liên quan dẫn đến owner của animation, ánh sáng và UI.

[ProceduralSceneRuntime](../../src/scene/ProceduralSceneRuntime.ts) giữ nguồn rollback. [MoonlitSceneRuntime](../../src/scene/MoonlitSceneRuntime.ts) là compatibility entry point, không phải bản procedural cũ.

## Quality gates

1. **Vertical slice gate:** moon + one real Cuội/Hằng GLB pod, camera rail and one idle/gesture clip. Do not model all six scenes until this slice passes visual review and 55+ FPS on the reference desktop.
2. **Asset gate:** every GLB loads, no T-pose, no missing textures, no hidden camera/light surprises, names and animation clips match manifest.
3. **Motion gate:** progress samples at `0, .1, .2 ... 1` have finite transforms, no camera jump, no opaque layer swap; animation continues while scroll is idle.
4. **Performance gate:** first meaningful 3D under 1.5s on local production build, DPR capped at 1.5–1.75, no frame over 33ms for a 10s warm run on target desktop, initial payload <=25MB.
5. **Fallback gate:** poster + HTML story works with WebGL disabled, GLB failure, reduced motion and direct GitHub Pages refresh.

## Phases

| # | Phase | Depends on | Result | Status |
|---|---|---|---|---|
| 1 | [Scope freeze and visual contract](./phase-01-start.md) | — | camera knots, style contract, budgets, feature flag | in-progress |
| 2 | [Blender 3D asset production](./phase-02-blender-3d-asset-production.md) | 1 | authored six-pod world, rigged Cuội/Hằng, source `.blend` | in-progress |
| 3 | [Continuous camera rail and runtime rewrite](./phase-03-continuous-camera-rail-and-runtime-rewrite.md) | 1 | no-snap camera/timeline skeleton | in-progress |
| 4 | [GLB loading and scene registry](./phase-04-glb-loading-and-scene-registry.md) | 2, 3 | validated local assets, fallback loading | completed (local integration) |
| 5 | [Animation, lighting and post effects](./phase-05-animation-lighting-and-post-effects.md) | 4 | authored actions, matte PBR, restrained glow | in-progress |
| 6 | [Story UI and resilient fallback](./phase-06-story-ui-and-resilient-fallback.md) | 3 | copy, letter, accessibility, no-WebGL path | completed (local integration) |
| 7 | [Validation and Pages release](./phase-07-validation-and-pages-release.md) | 4, 5, 6 | performance evidence, public deployment | in-progress |

## Success criteria

- [x] Sáu pod là asset GLB authored, không còn scene chính bằng primitive procedural.
- [x] Cuộn xuôi/ngược 10 lần cho cùng một trạng thái; không `visible`/opacity swap theo chapter.
- [x] Camera rail có vị trí và hướng liên tục; target/look-at không nhảy tại seam.
- [ ] Cuội và Hằng có silhouette, vật liệu, rig và ít nhất `Idle` + một gesture/interaction clip; không còn nhân vật là các khối ghép đơn giản.
- [x] Có ít nhất sáu subtree animation nhìn thấy khi dừng scroll.
- [ ] `npm run typecheck`, `npm test`, `npm run build`, asset validator và manual Chromium matrix pass.
- [ ] GitHub Pages trả HTTP 200, không có external asset URL, fallback và letter vẫn dùng được.

## Rủi ro và giới hạn cần nói rõ

- “Chân thực” sẽ được chốt là **cinematic semi-realistic storybook 3D** trong bản mặc định. Photorealistic human likeness cần model/ảnh tham chiếu và quyền sử dụng; không tự bịa khuôn mặt bạn gái.
- GLB authored tốn thời gian hơn sửa TypeScript. Vì vậy vertical slice là bắt buộc trước khi mở rộng.
- Nếu tổng asset vượt ngân sách, chỉ khi đó mới bật Draco/Meshopt/KTX2 hoặc tách pod; không nén trước khi kiểm tra vật liệu.

## Tham khảo

- [scroll-world](https://github.com/oso95/scroll-world) — camera-flight/video scrub, seam handoff và seek coalescing.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)
- [Three.js animation system](https://threejs.org/manual/pages/animation-system.html)
- [Blender glTF exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
- [MDN HTMLMediaElement.currentTime](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)

<!-- slug: midautumn-3d-rebuild -->
