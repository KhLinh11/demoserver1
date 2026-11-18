"""Khởi động máy chủ Backend Vitara Platform: python -m BE."""

import argparse
import uvicorn
from BE.config import load_settings


def main():
    parser = argparse.ArgumentParser(description="Khởi động Backend Vitara Data Platform.")
    parser.add_argument("--host", default=None, help="Mặc định 127.0.0.1")
    parser.add_argument("--port", type=int, default=None, help="Mặc định 8000")
    parser.add_argument("--reload", action="store_true", help="Bật auto-reload khi phát triển")
    args = parser.parse_args()

    settings = load_settings()
    host = args.host or settings.host
    port = args.port or settings.port

    print(f"🚀 Vitara Data Platform Backend đang khởi động tại http://{host}:{port}")
    print(f"📖 Swagger API Docs: http://{host}:{port}/docs")
    print(f"⚙️ Giới hạn dữ liệu tối đa: {settings.max_input_rows:,} mẫu")

    uvicorn.run(
        "BE.main:app",
        host=host,
        port=port,
        reload=args.reload,
        workers=1,
    )


if __name__ == "__main__":
    main()
