"""Module xác thực tài khoản quản trị viên (Single Admin Authentication Gate)."""

import os
import secrets
import hmac
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Đọc thông tin tài khoản admin từ biến môi trường (mặc định: admin / admin123)
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin").strip().lower()
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@vitara.ai").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123").strip()

# Bộ nhớ lưu trữ session tokens đang hoạt động
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


def authenticate_admin(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Xác thực tài khoản admin duy nhất.
    Hỗ trợ đăng nhập bằng username ("admin") hoặc email ("admin@vitara.ai").
    """
    if not username or not password:
        return None

    user_clean = username.strip().lower()
    pass_clean = password.strip()

    is_user_valid = (user_clean == ADMIN_USERNAME) or (user_clean == ADMIN_EMAIL)
    # So sánh mật khẩu an toàn chống timing attack
    is_pass_valid = hmac.compare_digest(pass_clean, ADMIN_PASSWORD)

    if is_user_valid and is_pass_valid:
        token = f"vitara_admin_{secrets.token_urlsafe(32)}"
        session_info = {
            "token": token,
            "username": ADMIN_USERNAME,
            "role": "admin",
            "name": "Quản Trị Viên Hệ Thống (Lead Auditor)",
            "email": ADMIN_EMAIL,
            "logged_in_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        ACTIVE_SESSIONS[token] = session_info
        return session_info

    return None


def verify_session(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """Kiểm tra token phiên làm việc của admin."""
    if not token:
        return None
    session = ACTIVE_SESSIONS.get(token)
    if session:
        # Kiểm tra hạn dùng
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.now() < expires_at:
            return session
        else:
            ACTIVE_SESSIONS.pop(token, None)
    return None


def invalidate_session(token: Optional[str]) -> bool:
    """Đăng xuất và hủy token phiên làm việc."""
    if token and token in ACTIVE_SESSIONS:
        ACTIVE_SESSIONS.pop(token, None)
        return True
    return False
