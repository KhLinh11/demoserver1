# ========================================================
# Vitara Data Platform - Multi-stage Dockerfile
# ========================================================

# --------------------------------------------------------
# Stage 1: Backend (FastAPI + DuckDB Analytics Engine)
# --------------------------------------------------------
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Cài đặt DejaVu Fonts (hỗ trợ hiển thị tiếng Việt UTF-8 chuẩn xác trong báo cáo PDF) và curl cho healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Sao chép mã nguồn Backend, tệp công khai và các kho dữ liệu CSV bán lẻ
COPY BE ./BE
COPY public ./public
COPY sales_data.csv ./sales_data.csv
COPY sample_data.csv ./sample_data.csv

# Tạo sẵn các thư mục runtime lưu trữ dữ liệu
RUN mkdir -p BE/runtime/uploads BE/runtime/exports

EXPOSE 8000

# Chạy máy chủ FastAPI bằng Uvicorn
CMD ["uvicorn", "BE.main:app", "--host", "0.0.0.0", "--port", "8000"]


# --------------------------------------------------------
# Stage 2: Frontend (Next.js Application)
# --------------------------------------------------------
FROM node:20-alpine AS frontend

WORKDIR /app

ENV PORT=3000

# Cài đặt dependencies cho Next.js
COPY FE/package*.json ./
RUN npm install

# Sao chép mã nguồn FE và thư mục public
COPY FE ./
COPY public ./public

# Xây dựng bản phân phối Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
