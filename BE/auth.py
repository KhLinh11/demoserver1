"""Module xác thực tài khoản quản trị viên (Production-Hardened Single Admin Gate).

Tính năng bảo mật nâng cao:
1. Mã hóa & kiểm tra mật khẩu bằng PBKDF2-HMAC-SHA256 (100,000 vòng) kết hợp muối ngẫu nhiên (Salt).
2. Chống tấn công Timing Attack bằng hmac.compare_digest.
3. Chống tấn công dò mật khẩu (Brute-force / Dictionary Attack) bằng Rate Limiter (tối đa 5 lần thử/10 phút, tự động khóa IP 15 phút).
4. Tạo mã phiên ngẫu nhiên chuẩn mật mã với độ dài 256-bit (secrets.token_urlsafe).
5. Ghi nhật ký kiểm toán (Audit Logging) các sự kiện xác thực.
"""

import os
import time
import secrets
import hmac
import hashlib
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timedelta

# Đọc thông tin tài khoản admin từ biến môi trường
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin").strip().lower()
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@vitara.ai").strip().lower()
# Mật khẩu cấu hình (ưu tiên đọc mật khẩu băm ADMIN_PASSWORD_HASH, hoặc mật khẩu thô ADMIN_PASSWORD)
_RAW_ENV_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123").strip()
_ENV_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "").strip()

# Cấu hình chống dò mật khẩu (Brute-force Protection)
MAX_FAILED_ATTEMPTS = 5         # Số lần thử tối đa trước khi khóa
ATTEMPT_WINDOW_SECONDS = 600    # Cửa sổ theo dõi: 10 phút
LOCKOUT_DURATION_SECONDS = 900  # Thời gian tạm khóa: 15 phút (900 giây)

# Bộ nhớ lưu vết đăng nhập và phiên làm việc
FAILED_ATTEMPTS: Dict[str, List[float]] = {}
LOCKED_UNTIL: Dict[str, float] = {}
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    """Tạo chuỗi băm PBKDF2-HMAC-SHA256 chuẩn NIST với 100,000 vòng lặp."""
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"pbkdf2:sha256:100000${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, stored_hash_or_plain: str) -> bool:
    """Xác thực mật khẩu với chuỗi băm PBKDF2 hoặc chuỗi so sánh an toàn."""
    try:
        if stored_hash_or_plain.startswith("pbkdf2:sha256:100000$"):
            parts = stored_hash_or_plain.split("$")
            if len(parts) == 3:
                salt = bytes.fromhex(parts[1])
                expected_key = bytes.fromhex(parts[2])
                actual_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
                return hmac.compare_digest(expected_key, actual_key)
        # Fallback an toàn chống timing attack nếu chuỗi cấu hình dạng text
        return hmac.compare_digest(plain_password.strip(), stored_hash_or_plain.strip())
    except Exception:
        return False


# Khởi tạo chuỗi băm cho tài khoản admin ngay khi nạp module
STORED_ADMIN_HASH = _ENV_PASSWORD_HASH if _ENV_PASSWORD_HASH else hash_password(_RAW_ENV_PASSWORD)


def check_rate_limit(client_ip: str) -> Tuple[bool, int]:
    """Kiểm tra xem địa chỉ IP có đang bị tạm khóa hay không.
    Trả về (is_allowed, remaining_lockout_seconds).
    """
    now = time.time()
    if client_ip in LOCKED_UNTIL:
        lock_end = LOCKED_UNTIL[client_ip]
        if now < lock_end:
            remaining_seconds = int(lock_end - now) + 1
            return False, remaining_seconds
        else:
            # Hết thời gian khóa, tự động gỡ
            del LOCKED_UNTIL[client_ip]
            FAILED_ATTEMPTS.pop(client_ip, None)
    return True, 0


def record_failed_attempt(client_ip: str) -> Tuple[int, bool, int]:
    """Ghi nhận 1 lần đăng nhập thất bại.
    Trả về (remaining_attempts, is_now_locked, lockout_seconds).
    """
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(client_ip, [])
    # Loại bỏ các lần thử đã quá thời gian cửa sổ
    attempts = [t for t in attempts if now - t < ATTEMPT_WINDOW_SECONDS]
    attempts.append(now)
    FAILED_ATTEMPTS[client_ip] = attempts

    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        LOCKED_UNTIL[client_ip] = now + LOCKOUT_DURATION_SECONDS
        FAILED_ATTEMPTS.pop(client_ip, None)
        print(f"[SECURITY ALERT] IP {client_ip} đã bị tạm khóa {LOCKOUT_DURATION_SECONDS // 60} phút do nhập sai mật khẩu {MAX_FAILED_ATTEMPTS} lần liên tiếp.")
        return 0, True, LOCKOUT_DURATION_SECONDS

    remaining = MAX_FAILED_ATTEMPTS - len(attempts)
    return remaining, False, 0


def record_successful_login(client_ip: str):
    """Xóa bỏ lịch sử thất bại sau khi đăng nhập thành công."""
    FAILED_ATTEMPTS.pop(client_ip, None)
    LOCKED_UNTIL.pop(client_ip, None)


def authenticate_admin(
    username: str,
    password: str,
    client_ip: str = "127.0.0.1"
) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
    """Xác thực tài khoản admin duy nhất kèm cơ chế chống dò mật khẩu.
    
    Trả về:
    (session_dict, error_message, http_status_code)
    """
    # 1. Kiểm tra khóa IP do brute-force
    is_allowed, remaining_lockout = check_rate_limit(client_ip)
    if not is_allowed:
        remaining_minutes = (remaining_lockout + 59) // 60
        return None, f"Phát hiện dấu hiệu tấn công dò mật khẩu. Địa chỉ IP của bạn tạm thời bị khóa trong {remaining_minutes} phút.", 429

    if not username or not password:
        return None, "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.", 400

    user_clean = username.strip().lower()
    pass_clean = password.strip()

    is_user_valid = (user_clean == ADMIN_USERNAME) or (user_clean == ADMIN_EMAIL)
    is_pass_valid = verify_password(pass_clean, STORED_ADMIN_HASH)

    if is_user_valid and is_pass_valid:
        # Đăng nhập thành công -> Xóa vết thất bại
        record_successful_login(client_ip)
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
        print(f"[SECURITY AUDIT] Đăng nhập quản trị thành công từ IP {client_ip} lúc {session_info['logged_in_at']}.")
        return session_info, None, 200

    # Đăng nhập thất bại -> Ghi nhận và tính số lần thử còn lại
    remaining, is_locked, lockout_secs = record_failed_attempt(client_ip)
    if is_locked:
        lockout_mins = (lockout_secs + 59) // 60
        err_msg = f"Đã nhập sai quá {MAX_FAILED_ATTEMPTS} lần liên tiếp. Tài khoản và IP của bạn bị tạm khóa trong {lockout_mins} phút."
        return None, err_msg, 429

    err_msg = f"Tên đăng nhập hoặc mật khẩu quản trị không chính xác. (Còn lại {remaining} lần thử)"
    return None, err_msg, 401


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
