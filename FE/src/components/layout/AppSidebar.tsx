"use client";

import React from "react";
import {
  YtAnalyticsIcon,
  YtBellIcon,
  YtBotIcon,
  YtHomeIcon,
  YtReportIcon,
  YtSlidersIcon,
  YtTodoListIcon,
  YtUploadIcon,
} from "@/components/icons/YouTubeIcons";

interface AppSidebarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  onOpenCopilot: () => void;
  companyName: string;
  userName?: string;
  isBackendOnline?: boolean;
}

export function AppSidebar({
  currentStep,
  onSelectStep,
  onOpenCopilot,
  companyName,
  userName = "Nguyễn Hữu Xuân",
  isBackendOnline = true,
}: AppSidebarProps) {
  const menuItems = [
    {
      id: "home",
      label: "Trang chủ",
      icon: YtHomeIcon,
      onClick: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      isActive: false,
    },
    {
      id: "step1",
      label: "Tải dữ liệu & Cấu hình",
      icon: YtUploadIcon,
      onClick: () => onSelectStep(1),
      isActive: currentStep === 1,
    },
    {
      id: "step2",
      label: "Chuẩn hoá & HITL-1",
      icon: YtTodoListIcon,
      onClick: () => onSelectStep(2),
      isActive: currentStep === 2,
    },
    {
      id: "step3",
      label: "Chẩn đoán rủi ro",
      icon: YtAnalyticsIcon,
      onClick: () => onSelectStep(3),
      isActive: currentStep === 3,
    },
    {
      id: "step4",
      label: "Mô phỏng What-If",
      icon: YtSlidersIcon,
      onClick: () => onSelectStep(4),
      isActive: currentStep === 4,
    },
    {
      id: "step5",
      label: "Báo cáo P&L 12 dòng",
      icon: YtReportIcon,
      onClick: () => onSelectStep(5),
      isActive: currentStep === 5,
    },
    {
      id: "copilot",
      label: "Trợ Lý Cố Vấn AI",
      icon: YtBotIcon,
      onClick: onOpenCopilot,
      isActive: false,
      isSpecial: true,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between p-4 bg-[#F2F5F3]/95 backdrop-blur-md rounded-3xl border border-[#D5DFD9] shadow-sm select-none sticky top-6 h-[calc(100vh-3rem)]">
      {/* Top Header / Brand */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-2 pt-1">
          {/* Brand Icon (Playful YouTube / Analytics motif) */}
          <div className="w-10 h-10 rounded-2xl bg-[#34655F] text-white flex items-center justify-center shadow-xs">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-lg font-black tracking-tight text-[#1E2E2A]">Vitara</h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#34655F]/15 text-[#34655F]">
                BI 2.0
              </span>
            </div>
            <p className="text-[11px] text-[#5C6E68] font-medium leading-tight">Decision Intelligence</p>
          </div>
        </div>

        {/* Navigation Button List */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                  item.isActive
                    ? "bg-[#34655F] text-white shadow-xs"
                    : item.isSpecial
                    ? "text-[#34655F] hover:bg-white/80 hover:shadow-2xs font-extrabold"
                    : "text-[#4A5D57] hover:bg-white/80 hover:text-[#1E2E2A] hover:shadow-2xs"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.isActive ? "text-white" : item.isSpecial ? "text-[#34655F]" : "text-[#627770]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Card */}
      <div className="space-y-2 pt-4 border-t border-[#D5DFD9]">
        <div className="p-3 rounded-2xl bg-white border border-[#D5DFD9] shadow-2xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5 shadow-2xs shrink-0 flex items-center justify-center text-white font-bold text-xs">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  // Fallback
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] text-[#738881] block leading-none">Xin chào,</span>
              <span className="text-xs font-black text-[#1E2E2A] truncate block mt-0.5" title={userName}>
                {userName}
              </span>
            </div>
          </div>

          {/* Bell Notification */}
          <button
            type="button"
            title="Thông báo hệ thống"
            className="w-7 h-7 rounded-xl hover:bg-[#F2F5F3] text-[#5C6E68] flex items-center justify-center relative cursor-pointer"
          >
            <YtBellIcon className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444]" />
          </button>
        </div>

        {/* Online Status Badge */}
        <div className="flex items-center justify-between px-3 py-1 rounded-xl bg-white/60 text-[11px] text-[#5C6E68] font-semibold">
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>{isBackendOnline ? "Online (Server Sẵn Sàng)" : "Client Hybrid Mode"}</span>
          </span>
          <span className="text-[10px] font-mono text-[#738881] truncate max-w-[80px]" title={companyName}>
            {companyName.split(" ")[0]}
          </span>
        </div>
      </div>
    </aside>
  );
}
