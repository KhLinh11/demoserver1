"use client";

import React from "react";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onSelectStep: (step: number) => void;
  onOpenCopilot: () => void;
}

export function AppSidebar({
  isOpen,
  onClose,
  currentStep,
  onSelectStep,
  onOpenCopilot,
}: AppSidebarProps) {
  if (!isOpen) return null;

  const steps = [
    { num: 1, label: "1. Tích hợp nguồn" },
    { num: 2, label: "2. Chuẩn hoá dữ liệu" },
    { num: 3, label: "3. Phân tích dữ liệu" },
    { num: 4, label: "4. Nguyên nhân & Đề xuất" },
    { num: 5, label: "5. Tổng kết & Báo cáo" },
  ];

  return (
    <aside className="w-72 bg-[#FAF6FD] border-r border-[#ECD8F2] p-5 flex flex-col justify-between shrink-0 transition-all duration-300 z-20 h-full">
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECD8F2]">
          <span className="text-xs font-bold text-[#1E1B2E] uppercase tracking-wider">
            Danh mục làm việc
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white border border-[#ECD8F2] text-[#5C5570] hover:text-[#8F60BF] flex items-center justify-center text-xs transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav className="space-y-2">
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => {
                  onSelectStep(s.num);
                  // Trên mobile có thể đóng sidebar khi chọn
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`w-full text-left p-3.5 rounded-xl flex items-center justify-between border transition text-xs font-bold cursor-pointer ${
                  isActive
                    ? "bg-white border-[#8F60BF] text-[#8F60BF] shadow-xs"
                    : "bg-white/80 border-[#ECD8F2] text-[#5C5570] hover:border-[#8F60BF] hover:text-[#1E1B2E]"
                }`}
              >
                <span>{s.label}</span>
                {isActive ? (
                  <i className="fa-solid fa-chevron-right text-xs text-[#8F60BF]" />
                ) : (
                  <i className="fa-solid fa-check text-xs text-[#079DD9]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-[#ECD8F2] space-y-2">
        <button
          onClick={onOpenCopilot}
          className="w-full py-2.5 px-3 rounded-xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
        >
          <i className="fa-solid fa-robot text-[#99D9F2]" />
          <span>Trợ Lý Cố Vấn AI</span>
        </button>
      </div>
    </aside>
  );
}
