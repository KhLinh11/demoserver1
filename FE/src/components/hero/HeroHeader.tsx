"use client";

import React from "react";

interface HeroHeaderProps {
  backendOnline: boolean;
  onStartAudit: () => void;
  onOpenCopilot: () => void;
}

export function HeroHeader({ backendOnline, onStartAudit, onOpenCopilot }: HeroHeaderProps) {
  return (
    <section
      id="view-hero"
      className="relative min-h-[75vh] flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-8 border-b border-[#ECD8F2] overflow-hidden"
      style={{
        background: "radial-gradient(circle at 80% 25%, #BEB6F2 0%, #8F60BF 50%, #4D2678 100%)",
      }}
    >
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ECD8F2]/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] rounded-full bg-[#079DD9]/25 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-4 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#079DD9] text-white flex items-center justify-center font-extrabold text-lg shadow-md">
            V
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              VITARA . DATA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#BEB6F2] font-semibold block">
              B2B Data Decision System
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 border shadow-sm ${
              backendOnline
                ? "bg-white/90 text-emerald-700 border-emerald-300"
                : "bg-white/90 text-[#8F60BF] border-[#BEB6F2]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? "bg-emerald-500 animate-pulse" : "bg-[#8F60BF]"
              }`}
            />
            <span>
              {backendOnline ? "FastAPI Backend Online (:8000)" : "Chế độ Dual-Engine (Vercel)"}
            </span>
          </div>

          <button
            onClick={onOpenCopilot}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center space-x-1.5 backdrop-blur-md"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[#99D9F2]" />
            <span>AI Copilot</span>
          </button>
        </div>
      </header>

      {/* Hero Body - Side-by-side 3D Animated Visuals */}
      <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 z-20 grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 items-center">
        <div className="md:col-span-5 lg:col-span-5 space-y-5 sm:space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-[#ECD8F2]/40 text-[#ECD8F2] text-xs font-mono uppercase tracking-widest font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#99D9F2] animate-pulse" />
            <span>B2B DATA DECISION SYSTEM</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-[46px] lg:text-[54px] font-black text-white tracking-tight leading-[1.08] drop-shadow-sm">
            Chuẩn Hoá <br />
            Dữ Liệu. <br />
            <span className="text-[#99D9F2]">Tối Ưu P&amp;L.</span>
          </h1>

          {/* Paragraph */}
          <p className="text-xs sm:text-sm md:text-base text-[#ECD8F2]/90 font-normal leading-relaxed max-w-lg">
            Chấm dứt bẫy doanh thu ảo do tính trùng lặp. Bóc tách đơn hoàn trả trễ chu kỳ 30 ngày, bảo toàn biên lợi nhuận ròng và tái phân bổ ngân sách chuẩn xác.
          </p>

          {/* 2 Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              onClick={onStartAudit}
              className="px-7 py-3 rounded-full text-white font-bold text-xs sm:text-sm tracking-wide transition-all transform hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(7,157,217,0.4)] hover:shadow-[0_12px_28px_rgba(7,157,217,0.6)] flex items-center space-x-2.5 bg-gradient-to-r from-[#079DD9] via-[#068ac0] to-[#8F60BF] border border-[#99D9F2]/50 cursor-pointer"
            >
              <i className="fa-solid fa-cloud-arrow-up text-sm text-[#99D9F2]" />
              <span>Tải File Dữ Liệu</span>
              <i className="fa-solid fa-arrow-right text-xs text-[#99D9F2]" />
            </button>

            <button
              onClick={onOpenCopilot}
              className="px-6 py-3 rounded-full text-white hover:text-[#99D9F2] bg-white/15 hover:bg-white/25 border border-[#ECD8F2]/50 backdrop-blur-md font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-xs cursor-pointer hover:border-[#BEB6F2]"
            >
              <i className="fa-solid fa-robot text-sm text-[#99D9F2]" />
              <span>Trợ Lý AI</span>
            </button>
          </div>

          {/* 3 Value Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 max-w-lg">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-0.5 hover:bg-white/15 transition">
              <div className="text-[10px] font-mono text-[#99D9F2] uppercase font-bold tracking-wider">Mô Hình 3R</div>
              <div className="text-xs font-bold text-white">Khử Trùng Đơn</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-0.5 hover:bg-white/15 transition">
              <div className="text-[10px] font-mono text-[#99D9F2] uppercase font-bold tracking-wider">Cửa Sổ 30 Ngày</div>
              <div className="text-xs font-bold text-white">Chốt Hoàn Trễ</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-0.5 hover:bg-white/15 transition">
              <div className="text-[10px] font-mono text-[#99D9F2] uppercase font-bold tracking-wider">P&amp;L Quản Trị</div>
              <div className="text-xs font-bold text-white">Lãi Thật 100%</div>
            </div>
          </div>

          {/* Support Channels Row */}
          <div className="flex items-center space-x-3 pt-4 sm:pt-5 border-t border-white/15 text-[#ECD8F2]">
            <span className="text-xs font-mono uppercase text-[#ECD8F2]/80 tracking-wider">Hỗ trợ đối soát:</span>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-[#BEB6F2]/40 flex items-center justify-center text-xs hover:text-white hover:border-[#99D9F2] hover:bg-white/20 transition cursor-pointer" title="POS Bán Lẻ">
              <i className="fa-solid fa-store" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-[#BEB6F2]/40 flex items-center justify-center text-xs hover:text-white hover:border-[#99D9F2] hover:bg-white/20 transition cursor-pointer" title="Sàn TMĐT">
              <i className="fa-solid fa-bag-shopping" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-[#BEB6F2]/40 flex items-center justify-center text-xs hover:text-white hover:border-[#99D9F2] hover:bg-white/20 transition cursor-pointer" title="TikTok / Livestream">
              <i className="fa-brands fa-tiktok" />
            </div>
            <div className="w-8 h-8 rounded-full border border-[#BEB6F2]/40 flex items-center justify-center text-xs hover:text-white hover:border-[#99D9F2] hover:bg-white/20 transition cursor-pointer" title="Kế Toán P&L">
              <i className="fa-solid fa-file-invoice-dollar" />
            </div>
          </div>
        </div>

        {/* 3D Geometric Floating Spheres & Rings SVG (Original Right-side Placement) */}
        <div className="md:col-span-7 lg:col-span-7 relative flex items-center justify-center">
          <div className="w-full max-w-[540px] lg:max-w-[620px] aspect-[1.15/1] relative flex items-center justify-center select-none">
            <svg className="w-full h-auto max-h-[52vh] drop-shadow-[0_25px_50px_rgba(30,20,50,0.4)]" viewBox="0 0 620 540" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="skySphereGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="30%" stopColor="#99D9F2" />
                  <stop offset="70%" stopColor="#079DD9" />
                  <stop offset="100%" stopColor="#045678" />
                </radialGradient>
                <radialGradient id="purpleSphereGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#ECD8F2" />
                  <stop offset="70%" stopColor="#BEB6F2" />
                  <stop offset="100%" stopColor="#8F60BF" />
                </radialGradient>
                <radialGradient id="deepPurpleSphereGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ECD8F2" />
                  <stop offset="40%" stopColor="#8F60BF" />
                  <stop offset="100%" stopColor="#4A1E75" />
                </radialGradient>
                <linearGradient id="mainRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ECD8F2" />
                  <stop offset="40%" stopColor="#BEB6F2" />
                  <stop offset="100%" stopColor="#8F60BF" />
                </linearGradient>
                <linearGradient id="blueRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#99D9F2" />
                  <stop offset="60%" stopColor="#079DD9" />
                  <stop offset="100%" stopColor="#056085" />
                </linearGradient>
                <filter id="soft3DShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="8" dy="16" stdDeviation="14" floodColor="#21083B" floodOpacity="0.35" />
                </filter>
              </defs>
              <ellipse cx="500" cy="140" rx="140" ry="60" transform="rotate(-30 500 140)" fill="none" stroke="#99D9F2" strokeWidth="18" opacity="0.35" strokeDasharray="800" filter="url(#soft3DShadow)" />
              <g className="animate-bounce-gentle">
                <circle cx="540" cy="55" r="32" fill="url(#skySphereGrad)" filter="url(#soft3DShadow)" />
              </g>
              <g>
                <ellipse cx="370" cy="275" rx="185" ry="145" transform="rotate(-25 370 275)" fill="none" stroke="url(#mainRingGrad)" strokeWidth="20" strokeLinecap="round" />
              </g>
              <g>
                <ellipse cx="380" cy="265" rx="90" ry="70" transform="rotate(35 380 265)" fill="none" stroke="url(#blueRingGrad)" strokeWidth="18" strokeLinecap="round" filter="url(#soft3DShadow)" />
                <ellipse cx="385" cy="275" rx="42" ry="18" fill="none" stroke="#99D9F2" strokeWidth="8" />
                <circle cx="385" cy="265" r="16" fill="url(#deepPurpleSphereGrad)" filter="url(#soft3DShadow)" />
              </g>
              <g>
                <circle cx="395" cy="155" r="26" fill="url(#purpleSphereGrad)" filter="url(#soft3DShadow)" />
              </g>
              <g className="animate-bounce-gentle">
                <circle cx="505" cy="340" r="38" fill="url(#skySphereGrad)" filter="url(#soft3DShadow)" />
              </g>
              <g>
                <circle cx="340" cy="335" r="20" fill="url(#purpleSphereGrad)" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/60 z-20">
        <span>© 2026 Vitara AI Platform · Chuẩn kiến trúc DATN</span>
        <span>Version 2.0 · Dual-Engine Architecture</span>
      </div>
    </section>
  );
}
