---
title: "Đêm trăng chỉ có hai đứa mình"
description: "Web quà Trung Thu lãng mạn gồm sáu cảnh scroll cinematic, đăng public trên GitHub Pages."
status: pending
priority: P1
effort: 2d
branch: ""
tags: [frontend, threejs, animation, github-pages, gift-site]
created: 2026-09-23
---

# Đêm trăng chỉ có hai đứa mình

## Overview

Làm website quà Trung Thu tiếng Việt, ưu tiên desktop cinematic: cuộn từ mặt trăng qua Cuội–Hằng, phố đèn lồng, kỷ niệm placeholder, rồi mở thư tình. Dùng Vite + TypeScript + Three.js với timeline điều khiển theo scroll lấy cảm hứng từ scroll-world; deploy static site lên GitHub Pages và đẩy source vào repo public.

## Phạm vi và quyết định

- Giữ concept sáu cảnh đã duyệt, tông dịu dàng, lãng mạn, cổ tích; tên/ảnh/ngày là placeholder chỉnh sửa được.
- Chọn Vite + TypeScript + Three.js. Không backend, database, tài khoản, analytics hay dịch vụ tạo asset có phí.
- Ưu tiên diorama Three.js nhẹ, tạo tại chỗ cho từng cảnh thay vì chuỗi video render sẵn: giảm dung lượng repo, tương tác theo scroll; timeline riêng lấy cảm hứng từ scroll-world. Chỉ dùng mã upstream sau khi kiểm tra tương thích và giấy phép.
- Repo và GitHub Pages public theo yêu cầu. Chỉ đưa placeholder lên public trước khi có ảnh cá nhân được chủ động cung cấp.
- Desktop là trải nghiệm chính; màn nhỏ vẫn đọc được từng cảnh qua lối tĩnh/reduced-motion, không tràn ngang.
- Âm thanh chỉ phát sau thao tác chủ động; cốt truyện không phụ thuộc âm thanh.

## Hành trình và luồng dữ liệu

1. Trình duyệt tải Vite build và assets nội bộ từ GitHub Pages; không có dữ liệu cá nhân rời trình duyệt.
2. Vị trí scroll được chuẩn hóa thành tiến độ timeline. Bộ điều khiển cảnh ánh xạ tiến độ sang camera/vật thể và trạng thái chương.
3. Moon, cổng cung trăng, Cuội/Hằng, đèn lồng, khung ảnh, thư là object/texture Three.js nội bộ. Chữ và nội dung cá nhân là HTML để dễ đọc/chỉnh sửa.
4. Cảnh cuối mở overlay thư; âm thanh tùy chọn, tải nội bộ và chỉ phát khi bấm.
5. GitHub Actions cài dependency từ lockfile, build với base path theo tên repo, deploy `dist/` lên Pages. Build lỗi thì không deploy; revert commit sẽ khôi phục bản tốt trước.

## Kiến trúc và phụ thuộc

```text
Phase 1: nền tảng + quyết định scroll engine
   └─> Phase 2: art direction + asset diorama
         └─> Phase 3: timeline scroll + sáu cảnh
               └─> Phase 4: nội dung, UI thư, accessibility
                     └─> Phase 5: kiểm tra, repo public, GitHub Pages
```

Luồng runtime: scroll -> progress hữu hạn [0,1] -> timeline cảnh -> transform Three.js + trạng thái HTML -> frame. Luồng deploy: source/assets -> Vite build có base path -> `dist/` -> Actions artifact -> GitHub Pages.

## Các phase

| Phase | Kết quả | Chặn bởi | Rủi ro |
|---|---|---|---|
| [1. Nền tảng và chọn engine](./phase-01-start.md) | Vite app, đường dẫn Pages, quyết định license/dependency | Không | Vừa |
| [2. Art direction và diorama](./phase-02-art-direction-and-3d-diorama-source.md) | Bộ asset cung trăng tối ưu, dùng lại được | 1 | Cao |
| [3. Timeline scroll và sáu cảnh](./phase-03-render-clips-and-integrate-scroll-world.md) | Truyện scroll có fallback khi render lỗi | 1, 2 | Cao |
| [4. UI, nội dung và accessibility](./phase-04-gift-ui-content-and-accessibility.md) | Copy tiếng Việt, thư, placeholder và fallback | 3 | Vừa |
| [5. Kiểm tra và phát hành public](./phase-05-validation-and-public-github-pages-release.md) | Repo public, Pages URL hoạt động | 4 | Cao |

## Tương thích, phát hành, khôi phục

- URL GitHub Pages dạng `/<repo-name>/` cần khớp với Vite `base`; kiểm tra mở trực tiếp và refresh. Không dùng route phía server.
- Khóa dependency và Node major trong CI. Assets nội bộ, đường dẫn đúng hoa thường trên Linux.
- Không có dữ liệu/người dùng hiện hữu cần migration. `main` là source chuẩn; chỉ deploy build thành công.
- Rollback bằng revert commit rồi để Actions deploy lại. Nếu workflow hỏng, khôi phục workflow tốt trước từ Git history.
- Tối ưu asset và giới hạn tổng dung lượng repo/build trước khi commit; không đưa binary lớn lên repo tùy tiện.

## Ma trận kiểm thử và xác nhận

| Mức | Nội dung | Điều kiện đạt |
|---|---|---|
| Unit | Clamp/map progress, chọn scene tại ranh giới, reduced-motion, helper URL | kiểm tra 0, ranh giới, 1 và input lỗi |
| Integration | Scroll → transform/chương; lỗi tải asset; resize; tab ẩn/hiện | browser test xác nhận chương đầu/giữa/cuối và khả năng hồi phục |
| End-to-end | Pages URL, tải đầu tiên, scroll đủ sáu cảnh, mở thư, audio gesture, refresh base path | Chromium desktop; kiểm tra nhanh fallback viewport nhỏ |
| Performance/accessibility | dung lượng build, frame, bàn phím, contrast, reduced motion, trạng thái loading/error | cảnh đầu có ý nghĩa trong 3 giây trên mạng phổ thông; không lỗi console nghiêm trọng; bàn phím tới được thư |

## Quyền sở hữu file theo phase

Các phase làm tuần tự, mỗi phase sở hữu một vùng file: Phase 1 sở hữu project root/CI nền; Phase 2 sở hữu nguồn cảnh/assets; Phase 3 sở hữu timeline/controller; Phase 4 sở hữu content/UI/accessibility; Phase 5 sở hữu release workflow/config và tài liệu phát hành. Nếu workflow được tạo ở Phase 1, Phase 5 chỉ sửa file đó sau khi bàn giao rõ ràng; không chạy song song nên không có ghi đè đồng thời.

## Tiêu chí hoàn thành đo được

- Cả sáu chương xuất hiện đúng thứ tự; không màn trống, transform NaN hay chuyển cảnh kẹt.
- `npm run build` tạo `dist/` dùng được cho repo base path.
- Unit/integration/e2e pass; ghi nhận kiểm tra accessibility/performance thủ công.
- Repo GitHub public; Actions deploy thành công và Pages URL tải đúng assets, refresh được.
- Placeholder được đánh dấu rõ và sửa được từ một nguồn content có tài liệu.

## Câu hỏi còn mở

- Tên/ảnh/ngày cá nhân vẫn là placeholder cho tới khi được cung cấp; không chặn bản đầu.
- Chưa rõ GitHub account đích/tên repo. Có thể làm và kiểm tra local trước; để push public và bật Pages cần danh tính GitHub đã xác thực cùng tên repo khả dụng. Dùng remote có sẵn nếu phù hợp; nếu chưa có thì xác định account/tên trước khi tạo repo public.

## Tham khảo

- [scroll-world repository](https://github.com/oso95/scroll-world/tree/main) — nguồn cảm hứng và đầu vào để kiểm tra license/tương thích.
- [GitHub Pages với Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — tham khảo workflow static deploy.

<!-- slug: moonlit-midautumn-scroll-gift -->
