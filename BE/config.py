"""Cấu hình hệ thống Backend và các giới hạn vận hành."""

import os
from dataclasses import dataclass
from pathlib import Path


REPO_DIR = Path(__file__).resolve().parent.parent


@dataclass
class Settings:
    """Cấu hình hệ thống mô phỏng theo chuẩn DATN."""
    runtime_dir: Path = REPO_DIR / "BE/runtime"
    uploads_dir: Path = REPO_DIR / "BE/runtime/uploads"
    exports_dir: Path = REPO_DIR / "BE/runtime/exports"
    db_path: Path = REPO_DIR / "BE/runtime/db.sqlite3"

    host: str = "127.0.0.1"
    port: int = 8000

    # Giới hạn số mẫu xử lý nghiêm ngặt theo yêu cầu
    max_input_rows: int = 1000
    max_upload_bytes: int = 10 * 1024 * 1024  # 10 MiB

    # Font chữ Unicode tiếng Việt hỗ trợ xuất PDF
    font_regular: str = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    font_bold: str = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def load_settings() -> Settings:
    settings = Settings()
    settings.runtime_dir.mkdir(parents=True, exist_ok=True)
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    settings.exports_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = load_settings()
