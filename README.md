# 🚀 Vitara Data Platform - Enterprise Data Decision System & AI Copilot

Hệ thống đối soát dữ liệu bán lẻ đa kênh, khử trùng lặp gán công tiếp thị (Multi-touch Attribution), chẩn đoán rò rỉ dòng tiền chu kỳ 30 ngày, xuất bản báo cáo P&L 12 dòng chuẩn kế toán quản trị và tích hợp **Trợ lý AI Copilot (Text-to-SQL trên DuckDB)**.

---

## 🏗 Cấu Trúc Dự Án

```text
demoserver1/
├── BE/                         # Phân hệ Backend FastAPI & DuckDB Analytics Engine
│   ├── __main__.py             # Điểm khởi chạy module: python -m BE
│   ├── main.py                 # FastAPI REST API, CORS & Endpoints (/api/runs, /api/copilot/chat)
│   ├── copilot.py              # AI Copilot Engine (Router + Text-to-SQL + DuckDB Store + Validator)
│   ├── engine.py               # Thuật toán đối soát, khử trùng đa chạm, tính P&L 12 dòng
│   ├── reporting.py            # Engine xuất báo cáo PDF chuẩn A4 Unicode tiếng Việt (ReportLab)
│   ├── schemas.py              # Khai báo schema dữ liệu Pydantic (Request / Response)
│   ├── storage.py              # SQLite WAL Store lưu trữ phiên đối soát và dữ liệu sạch
│   ├── config.py               # Cấu hình ngưỡng giới hạn hệ thống
│   └── runtime/                # Thư mục lưu dữ liệu cục bộ (db.sqlite3, uploads, exports)
├── FE/                         # Phân hệ Frontend Next.js + React + TypeScript
│   ├── package.json            # Cấu hình thư viện Next.js, Chart.js, Tailwind CSS
│   ├── next.config.ts          # Cấu hình proxy tự động /api/:path* sang Backend (:8000)
│   ├── public/                 # Tài nguyên tĩnh đồng bộ
│   └── src/                    # Mã nguồn giao diện Next.js App Router
├── public/                     # Thư mục tài nguyên tĩnh phục vụ FastAPI & Next.js
├── Dockerfile                  # Multi-stage Dockerfile tại thư mục gốc (backend + frontend)
├── docker-compose.yml          # Điều phối chạy toàn bộ hệ thống bằng 1 lệnh duy nhất
├── .dockerignore               # Tối ưu hóa dung lượng build Docker
├── requirements.txt            # Danh sách thư viện Python phụ thuộc của Backend
├── package.json                # Quản trị script khởi chạy nhanh FE & BE
├── sales_data.csv              # Bộ dữ liệu bán hàng thực tế 15.000 dòng giao dịch
├── sample_data.csv             # Dữ liệu đối soát mẫu chuẩn (150 dòng)
├── .env                        # Khai báo cấu hình môi trường & GEMINI_API_KEY
└── README.md                   # Tài liệu hướng dẫn sử dụng và triển khai
```

---

## ⚡ Hướng Dẫn Khởi Chạy Dự Án

Bạn có thể lựa chọn 1 trong 2 trường hợp sau để khởi chạy hệ thống:

---

### TRƯỜNG HỢP 1: Chạy trực tiếp trên máy (Chạy BE ➔ FE)

Phù hợp khi bạn cần lập trình, debug hoặc chỉnh sửa trực tiếp mã nguồn.

#### Yêu cầu môi trường:

- **Python**: Phiên bản 3.11 trở lên.
- **Node.js**: Phiên bản 18 trở lên (kèm `npm`).

#### Bước 1: Khởi động Backend (FastAPI + DuckDB)

Mở một cửa sổ Terminal tại thư mục gốc của dự án:

```bash
# 1. Khởi tạo môi trường ảo Python (chỉ cần làm lần đầu tiên)
python3 -m venv .venv

# 2. Cài đặt các thư viện phụ thuộc
.venv/bin/pip install -r requirements.txt

# 3. Khởi chạy máy chủ Backend (hỗ trợ hot-reload khi sửa code)
.venv/bin/python -m BE --reload
```

- **Cổng dịch vụ Backend:** `http://127.0.0.1:8000`
- **Giao diện Web SPA gốc:** Truy cập trực tiếp tại `http://127.0.0.1:8000`
- **Tài liệu API Swagger:** `http://127.0.0.1:8000/docs`

#### Bước 2: Khởi động Frontend (Next.js)

Mở một cửa sổ Terminal thứ hai tại thư mục gốc của dự án:

```bash
# 1. Cài đặt các gói phụ thuộc Frontend (chỉ làm lần đầu)
npm --prefix FE install

# 2. Khởi chạy máy chủ Next.js phát triển
npm run dev
# hoặc: npm run dev:fe
```

- **Cổng giao diện Frontend Next.js:** `http://localhost:3000`
- **Cơ chế đồng bộ:** Next.js được cấu hình tự động proxy toàn bộ các yêu cầu `/api/*` về máy chủ Backend tại cổng `8000`.

---

### TRƯỜNG HỢP 2: Chạy tự động qua Docker 

Phù hợp nhất để đồng đội tải repo về và chạy ngay trên máy cá nhân mà không cần cài đặt Python, Node.js hay bất kỳ môi trường phụ thuộc nào.

#### Yêu cầu môi trường:

- Máy tính đã cài đặt **Docker** và **Docker Compose** (hoặc **Docker Desktop**).

#### Cách khởi chạy (Chỉ với 1 câu lệnh duy nhất):

Mở Terminal tại thư mục gốc của dự án và chạy:

```bash
# Tự động build hình ảnh và khởi chạy cả Backend và Frontend
docker compose up --build
```

*(Nếu muốn chạy ngầm trong nền, thêm cờ `-d`: `docker compose up -d --build`)*

#### Địa chỉ truy cập:

- **Cổng 8000 (Khuyên dùng):** `http://localhost:8000` — Máy chủ FastAPI tích hợp giao diện SPA đầy đủ.
- **Cổng 3000:** `http://localhost:3000` — Máy chủ Next.js đồng bộ.
- **Tài liệu API:** `http://localhost:8000/docs`.

#### Các container được Docker Compose tự động quản lý:

1. `vitara-backend`:
   - Chạy nền tảng `python:3.11-slim`.
   - Cài đặt sẵn font chữ Unicode DejaVu (bảo đảm xuất báo cáo PDF chuẩn A4 tiếng Việt không bao giờ lỗi font).
   - Nạp sẵn DuckDB Analytics Engine xử lý 15.000 dòng dữ liệu trong bộ nhớ RAM.
   - Tự động kiểm tra sức khỏe hệ thống qua endpoint `/api/health`.
2. `vitara-frontend`:
   - Chạy `node:20-alpine`.
   - Tự động kết nối proxy sang `vitara-backend:8000`.
3. `vitara-data` (Volume):
   - Tự động lưu trữ và bảo toàn cơ sở dữ liệu SQLite và các tệp báo cáo PDF/CSV qua các lần khởi động lại.

#### Dừng hệ thống:

Bấm tổ hợp phím `Ctrl + C` trên terminal, hoặc mở terminal mới và chạy:

```bash
docker compose down
```

---

## 🤖 Cấu Hình Trợ Lý AI Copilot (Text-to-SQL trên DuckDB)

Hệ thống tích hợp sẵn kiến trúc AI Copilot 2 tầng:

1. **Khi có mạng & cấu hình Gemini API Key:**
   - Khai báo API Key trong tệp `.env` tại thư mục gốc:
   - Copilot sẽ nhận câu hỏi tự nhiên ➔ Sinh câu truy vấn DuckDB SQL ➔ Kiểm duyệt an toàn (chỉ đọc) ➔ Chạy trên kho dữ liệu 15.000 dòng ➔ Diễn giải số liệu tài chính chuyên nghiệp.
2. **Khi offline hoặc không có API Key:**
   - Hệ thống tự động chuyển sang **DuckDB Heuristic Engine**.
   - Trả lời tức thì trong vòng 5 mili-giây cho tất cả các câu hỏi quan trọng (Doanh thu theo kênh, Tỷ lệ hoàn hàng, Top showroom lãi cao, 5-Whys Flash Sale...) kèm trích xuất trực tiếp câu lệnh DuckDB SQL để người dùng kiểm chứng.

---

## 📊 Quy Trình Vận Hành 5 Bước Trên Giao Diện

1. **Trang Bìa (Hero):**
   - Nút **"Tải File Dữ Liệu"**: Chuyển thẳng tới Bước 1 và mở cửa sổ chọn tệp từ máy.
   - Nút **"Trợ Lý AI"**: Bật ngăn kéo trò chuyện và phân tích dữ liệu tự động.
2. **Bước 1 - Tích hợp nguồn:** Đào sâu bối cảnh doanh nghiệp và nạp tệp giao dịch (`.csv`, `.xlsx`, `.xls` hoặc dữ liệu mẫu).
3. **Bước 2 - Chuẩn hoá dữ liệu (AI Cleansing):** Áp dụng 4 quy tắc kiểm toán khách quan (khử trùng lặp đa chạm, bóc tách doanh thu ảo, gắn cờ đơn hoàn) và phê duyệt dữ liệu sạch.
4. **Bước 3 - Phân tích dữ liệu & Đối soát 30 ngày:** Bóc trần hiện tượng hoàn hàng trễ và xói mòn lợi nhuận do voucher đa tầng.
5. **Bước 4 - Nguyên nhân & Đề xuất (5-Whys):** Mô phỏng kịch bản What-If và tái phân bổ ngân sách.
6. **Bước 5 - Tổng kết & Báo cáo P&L 12 dòng:** Xuất báo cáo kiểm toán tài chính chuẩn A4 dạng PDF tiếng Việt hoặc bản tóm lược điều hành C-Level.

---

## 🛡️ Cam Kết An Toàn & Chuẩn Mực Dự Án

- Tất cả các tệp cấu hình Docker (`Dockerfile`, `docker-compose.yml`, `.dockerignore`) được đặt nghiêm ngặt tại **thư mục gốc**.
- Thư mục đồ án tham chiếu `DATN` được giữ nguyên vẹn ở chế độ **chỉ đọc (Read-Only) 100%**.
- Cơ chế lưu trạng thái (`localStorage`) giúp phiên làm việc của người dùng không bị mất khi tải lại trang (`F5`).