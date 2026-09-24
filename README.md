# Đêm trăng chỉ có hai đứa mình

Một món quà Trung Thu tiếng Việt: cuộn qua sáu chương trong một cung trăng procedural, gặp Cuội–Hằng, đi qua phố đèn lồng, mở những khung kỷ niệm placeholder và đọc lá thư cuối.

**Live:** https://salyys1.github.io/moonlit-midautumn-gift/

## Chạy local

```bash
npm install
npm run dev
```

Build kiểm tra:

```bash
npm run typecheck
npm test
npm run build
```

## Cá nhân hóa

Sửa nội dung trong `src/content.ts` và lá thư trong `index.html`. Ảnh thật có thể được thêm sau khi thay các placeholder ở cảnh kỷ niệm; không cần backend.

## Kỹ thuật

Trang dùng Vite, TypeScript và Three.js. Vị trí cuộn được chuẩn hóa thành tiến độ 0–1 rồi điều khiển camera theo sáu mốc, lấy cảm hứng từ [scroll-world](https://github.com/oso95/scroll-world). Không sao chép engine upstream và không gọi dịch vụ tạo asset có phí.

## GitHub Pages

Workflow trong `.github/workflows/deploy-pages.yml` build với `BASE_PATH=/${repo-name}/`, upload `dist/` và deploy bằng GitHub Pages Actions. Repo có thể chạy static, không có dữ liệu cá nhân, tracking hay API key.
