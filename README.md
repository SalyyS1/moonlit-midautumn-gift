# Đêm trăng chỉ có hai đứa mình

Món quà Trung Thu tiếng Việt: một chuyến đi dưới trăng, những kỷ niệm của hai người và lá thư cuối. [Design brief](docs/approved-design-brief.md) giữ mục tiêu trải nghiệm; [art contract](docs/true-3d-art-contract.md) giữ yêu cầu hình ảnh.

## Chạy local

Cài dependency bằng `npm ci`, rồi chạy `npm run dev`. Các lệnh kiểm tra và build nằm trong [package.json](package.json); điều kiện phát hành nằm trong [release guide](docs/release-and-rollback.md).

Nếu thiết bị bật giảm chuyển động, trang mở ở chế độ đọc và giải thích lý do. Chọn **Bật trải nghiệm 3D** để cuộn qua thế giới 3D; chọn **Chế độ đọc** để quay lại. Lựa chọn 3D được giữ trong URL `?view=3d`, nên tải lại trang vẫn giữ chế độ đã chọn mà không thay đổi cài đặt thiết bị.

`npm run build:world` **tái tạo nguồn Blender, GLB và manifest**, cần Blender cục bộ. Đọc [hướng dẫn authoring](art/blender/README.md) trước khi chạy; đây không phải lệnh chỉ kiểm tra asset. Lệnh kiểm tra asset là `npm run validate:assets`.

## Cá nhân hóa

Sửa chương truyện, tên, lá thư và chú thích kỷ niệm trong [src/content.ts](src/content.ts). Đồng bộ bản văn bản dự phòng trong [index.html](index.html) để người tắt JavaScript vẫn đọc được nội dung đã cá nhân hóa. [Asset guide](docs/asset-guide.md) chỉ đến nguồn mô hình và giới hạn nội dung public.

## Điểm bắt đầu cho người bảo trì

- [Scene facade](src/scene/index.ts): điểm vào runtime và lựa chọn rollback `VITE_SCENE_MODE`.
- [Asset manifest](public/assets/manifest.json): metadata export; [trình tạo manifest](scripts/write-world-manifest.mjs) là nơi cập nhật.
- [Browser checks](scripts/capture-progress.mjs): bằng chứng tương tác và hiệu năng.
- [Pages workflow](.github/workflows/deploy-pages.yml): nguồn cấu hình build và phát hành.
