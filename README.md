# 🚀 Vitara Data Platform - Thư Mục Triển Khai Vercel (demovercel)

Thư mục này được cấu trúc độc lập và tối giản, **chỉ gồm các tệp cần thiết nhất** để đưa lên **Vercel** hoạt động ngay mà không gặp bất kỳ lỗi nào.

---

## 📂 Danh Sách Các Tệp Trong `demovercel/`

| Tệp tin / Thư mục | Vai trò trên Vercel |
| :--- | :--- |
| **`public/`** | **Thư mục đầu ra chuẩn của Vercel (Output Directory):** Chứa `index.html` và `sample_data.csv` để khắc phục triệt để lỗi `[STATIC_BUILD_NO_OUT_DIR]`. |
| **`index.html`** | Ứng dụng web hoàn chỉnh: Màn hình Hero 3D, Quy trình 5 Bước, Chốt chặn phê duyệt Bước 2 (HITL Gate), Chẩn đoán SLA Bước 3, Mô phỏng Bước 4, Báo cáo P&L 12 dòng cân bằng & 6 biểu đồ (Waterfall, Line/Area, Donut, Stacked, Horizontal, Bubble), Trợ lý AI Copilot. |
| **`sample_data.csv`** | Tệp dữ liệu mẫu doanh nghiệp chuỗi bán lẻ (15.000 dòng đối soát đa kênh) phục vụ người dùng tải về dùng thử trực tiếp trên Vercel. |
| **`vercel.json`** | Tệp cấu hình chỉ định rõ ràng `"outputDirectory": "public"` và chuẩn hóa URL sạch cho Vercel. |
| **`package.json`** | Khai báo metadata và script tự động đồng bộ tệp sang `public/` khi Vercel thực hiện lệnh build. |
| **`.gitignore`** | Loại bỏ các tệp rác hệ thống phát sinh ngoài ý muốn. |

---

## ⚡ Hướng Dẫn Đẩy Lên Vercel (Không Lỗi 100%)

### Cách 1: Đẩy thư mục này lên GitHub rồi Import vào Vercel (Khuyên dùng)
1. Mở terminal tại thư mục này:
   ```bash
   cd demovercel
   git init
   git branch -M main
   git add .
   git commit -m "fix: resolve STATIC_BUILD_NO_OUT_DIR by adding public output directory"
   git remote add origin https://github.com/<tai-khoan-github-cua-ban>/<ten-repo>.git
   git push -u origin main
   ```
2. Truy cập **[vercel.com/new](https://vercel.com/new)**:
   * Chọn repository vừa đẩy.
   * Để nguyên toàn bộ cấu hình mặc định (Vercel sẽ tự động phát hiện `outputDirectory: public`).
   * Bấm **Deploy** -> Triển khai thành công 100% trong vòng 10 giây!

---

### Cách 2: Triển khai bằng Vercel CLI
```bash
cd demovercel
npx vercel --prod
```
Làm theo hướng dẫn trên màn hình, hệ thống sẽ tải lên và cung cấp link `https://...vercel.app` ngay lập tức!
