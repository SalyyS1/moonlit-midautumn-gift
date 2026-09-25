---
title: "Phát hành Đêm trăng chỉ có hai đứa mình"
date: 2026-09-24
status: complete
---

# Phát hành Đêm trăng chỉ có hai đứa mình

Historical scope: the procedural release described below. This record does not establish the deployment or visual acceptance of the GLB rebuild; its past live checks were not rerun during the rebuild.

## Context

Workspace greenfield, concept đã được duyệt: web quà Trung Thu desktop-first, sáu cảnh, placeholder cho dữ liệu cá nhân, repo public và GitHub Pages.

## What happened

- Dựng Vite + TypeScript + Three.js procedural diorama, không dùng dịch vụ tạo asset trả phí.
- Thêm timeline scroll qua sáu mốc, Cuội–Hằng, cây đa, mặt trăng, đèn lồng, thẻ kỷ niệm placeholder và overlay lá thư.
- Thêm reduced-motion, semantic no-JS copy, fallback WebGL, focus trap cho modal, âm thanh chỉ bật sau thao tác.
- Pass `npm run typecheck`, `npm test`, `npm run build`; kiểm tra HTML và asset path live trả HTTP 200.
- Push commit `274a0a0` lên repo public; GitHub Actions run `35939466363` deploy thành công.

## Decisions

- Dùng camera realtime procedural lấy cảm hứng từ scroll-world thay vì video chain trả phí; repo nhẹ hơn và không có seam cần encode.
- Giữ dữ liệu cá nhân trong source local để người dùng tự thay sau; chưa commit ảnh thật.

## Next

Thay placeholder trong `src/content.ts` và nội dung thư trong `index.html` khi có tên, ngày và ảnh riêng. Chạy lại ba lệnh kiểm tra trước khi push.
