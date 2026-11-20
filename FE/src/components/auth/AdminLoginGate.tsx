"use client";

import React, { useState } from "react";

interface AdminLoginGateProps {
  onLoginSuccess: (user: any) => void;
  onBackToHero?: () => void;
}

export function AdminLoginGate({ onLoginSuccess, onBackToHero }: AdminLoginGateProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        if (res.status === 429) {
          setIsLocked(true);
        }
        setErrorMsg(data.detail || "Tên đăng nhập hoặc mật khẩu quản trị không chính xác.");
        return;
      }

      setIsLocked(false);
      // Lưu token vào localStorage
      localStorage.setItem("vitara_admin_auth", JSON.stringify(data));
      onLoginSuccess(data);
    } catch {
      setErrorMsg("Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#ECD8F2] shadow-xl shadow-purple-100/50 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Background Decorative Gradient Blobs */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#ECD8F2]/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#99D9F2]/30 rounded-full blur-2xl pointer-events-none" />

        {/* Security Shield Header */}
        <div className="text-center space-y-2 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FAF6FD] to-[#ECD8F2] border border-[#BEB6F2] mx-auto flex items-center justify-center shadow-sm">
            <i className={`fa-solid ${isLocked ? "fa-lock text-rose-500" : "fa-shield-halved text-[#8F60BF]"} text-2xl transition-colors`} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#FAF6FD] text-[#8F60BF] border border-[#ECD8F2]">
            Cổng Bảo Mật Quản Trị (Admin Gate)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E1B2E] tracking-tight">
            Xác Thực Quản Trị Viên
          </h2>
          <p className="text-xs text-[#5C5570] leading-relaxed">
            Hệ thống yêu cầu xác thực tài khoản Quản trị viên để truy cập luồng kiểm toán và ký duyệt P&amp;L.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center space-x-2.5 animate-shake ${
            isLocked
              ? "bg-rose-100 border-rose-300 text-rose-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}>
            <i className={`fa-solid ${isLocked ? "fa-triangle-exclamation text-rose-600" : "fa-circle-exclamation text-rose-500"} shrink-0 text-sm`} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-bold text-[#1E1B2E] mb-1.5">
              Tên đăng nhập hoặc Email Quản trị
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs text-[#5C5570]">
                <i className="fa-solid fa-user-shield" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#ECD8F2] bg-[#FAF8FC] text-xs font-medium text-[#1E1B2E] focus:outline-none focus:border-[#8F60BF] transition"
                autoComplete="username"
                disabled={isLocked}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E1B2E] mb-1.5">
              Mật khẩu Quản trị
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs text-[#5C5570]">
                <i className="fa-solid fa-lock" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#ECD8F2] bg-[#FAF8FC] text-xs font-mono text-[#1E1B2E] focus:outline-none focus:border-[#8F60BF] transition"
                autoComplete="current-password"
                disabled={isLocked}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-xs text-[#5C5570] hover:text-[#8F60BF] transition cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] flex items-start space-x-2.5 text-xs text-[#5C5570]">
            <i className="fa-solid fa-shield-halved text-[#8F60BF] mt-0.5 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Cổng kiểm toán được bảo vệ bởi cơ chế chống dò mật khẩu (Brute-force Protection). Thông tin đăng nhập được quản lý bảo mật qua biến môi trường máy chủ.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8F60BF] to-[#7b4fa8] hover:from-[#7b4fa8] hover:to-[#6a3f96] text-white text-xs sm:text-sm font-bold transition shadow-md shadow-purple-200/50 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                <span>Đang Xác Thực...</span>
              </>
            ) : isLocked ? (
              <>
                <i className="fa-solid fa-lock text-sm" />
                <span>Tài Khoản Đang Bị Tạm Khóa</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket text-sm" />
                <span>Đăng Nhập Quản Trị Hệ Thống</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Hero Button */}
        {onBackToHero && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToHero}
              className="text-xs font-semibold text-[#5C5570] hover:text-[#8F60BF] transition flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-[11px]" />
              <span>Về Trang Bìa Giới Thiệu</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
