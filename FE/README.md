# 🖥 Phân Hệ Frontend (FE) - Vitara Data Platform

Phân hệ Frontend được xây dựng bằng **Next.js (App Router) + React + TypeScript + Tailwind CSS** theo chuẩn kiến trúc của dự án tham chiếu DATN.

---

## 🏗 Cấu Trúc Thư Mục `FE/`

```text
FE/
├── package.json               # Cấu hình phụ thuộc (Next.js, React, Chart.js, Tailwind)
├── next.config.ts             # Proxy tự động /api/:path* sang FastAPI Backend (:8000)
├── tsconfig.json              # TypeScript strict configuration
├── postcss.config.mjs         # Tailwind CSS v4 processor
├── public/                    # Tài nguyên tĩnh
│   └── sample_data.csv        # Tệp dữ liệu mẫu 150 đơn hàng
└── src/
    ├── app/
    │   ├── layout.tsx         # Root layout, HTML metadata, FontAwesome
    │   ├── page.tsx           # Trang điều phối chính 5 bước đối soát
    │   └── globals.css        # Tailwind directives, theme palette & print CSS
    ├── components/
    │   ├── hero/
    │   │   └── HeroHeader.tsx # Giao diện Hero 3D Floating Geometric
    │   ├── workflow/
    │   │   └── WorkflowNavigation.tsx # Thanh chuyển 5 bước thông minh
    │   ├── steps/
    │   │   ├── Step1Upload.tsx        # Bước 1: Nạp file & Giới hạn <= 1.000 mẫu
    │   │   ├── Step2Cleansing.tsx     # Bước 2: Thống kê làm sạch & Khóa HITL-1
    │   │   ├── Step3Diagnosis.tsx     # Bước 3: Chẩn đoán rủi ro dòng tiền 30 ngày
    │   │   ├── Step4Simulation.tsx    # Bước 4: Rank shift & Giả lập What-If
    │   │   └── Step5PnL.tsx           # Bước 5: Bảng P&L 12 dòng & 5 Biểu đồ Chart.js
    │   ├── modals/
    │   │   ├── ExecutiveReportModal.tsx # Popup tóm tắt điều hành & In PDF trình duyệt
    │   │   └── FullDatasetModal.tsx     # Popup duyệt toàn bộ sổ cái giao dịch
    │   └── copilot/
    │       └── AgentDrawer.tsx        # Trợ lý AI Copilot giải thích dòng tiền
    ├── lib/
    │   ├── api/
    │   │   └── client.ts      # API Client kết nối FastAPI Backend
    │   ├── brand.ts           # Màu sắc thương hiệu & Metadata
    │   ├── format.ts          # Định dạng tiền tệ VND, tỷ lệ phần trăm
    │   └── engine.ts          # Thuật toán Dual-Engine tính toán động offline
    └── types/
        └── index.ts           # Hợp đồng kiểu dữ liệu TypeScript (Pydantic mirrors)
```

---

## ⚡ Hướng Dẫn Chạy Frontend

### 1. Cài đặt thư viện:
```bash
cd FE
npm install
```

### 2. Khởi động môi trường phát triển (Dev server):
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### 3. Build Production:
```bash
npm run build
npm start
```

---

## 🌐 Triển Khai Lên Vercel

Dự án Next.js tương thích 100% với nền tảng Vercel:
1. Đẩy mã nguồn lên kho Git (GitHub / GitLab).
2. Khi import vào Vercel, chọn **Root Directory** là `FE` (hoặc để mặc định nếu cấu hình monorepo).
3. Vercel sẽ tự động build và deploy toàn bộ ứng dụng Next.js.
