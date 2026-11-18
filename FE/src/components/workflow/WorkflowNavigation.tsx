"use client";

import React from "react";

interface WorkflowNavigationProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  hasData: boolean;
  hitl1Approved: boolean;
}

export function WorkflowNavigation({
  currentStep,
  onSelectStep,
  hasData,
  hitl1Approved,
}: WorkflowNavigationProps) {
  const steps = [
    { num: 1, title: "1. Nạp Dữ Liệu", desc: "Tải lên CSV / Excel (Max 1.000 dòng)", ready: true },
    { num: 2, title: "2. Làm Sạch & HITL-1", desc: "Điền khuyết, khử trùng & Phê duyệt", ready: hasData },
    { num: 3, title: "3. Chẩn Đoán Dòng Tiền", desc: "Bóc trần hoàn trễ sau 30 ngày", ready: hasData && hitl1Approved },
    { num: 4, title: "4. Giả Lập What-If", desc: "Rank Shift & Mô phỏng quyết định", ready: hasData && hitl1Approved },
    { num: 5, title: "5. Báo Cáo P&L 12 Dòng", desc: "Kiểm toán tài chính & Xuất PDF A4", ready: hasData && hitl1Approved },
  ];

  return (
    <nav className="w-full grid grid-cols-1 sm:grid-cols-5 gap-2 p-2 bg-white rounded-2xl border border-[#ECD8F2] shadow-sm">
      {steps.map((s) => {
        const isActive = currentStep === s.num;
        return (
          <button
            key={s.num}
            onClick={() => s.ready && onSelectStep(s.num)}
            disabled={!s.ready}
            className={`p-3 rounded-xl text-left transition flex flex-col justify-between ${
              isActive
                ? "bg-[#FAF6FD] border border-[#8F60BF] text-[#8F60BF] shadow-xs"
                : s.ready
                ? "hover:bg-[#FAF8FC] text-[#1E1B2E] border border-transparent"
                : "opacity-45 cursor-not-allowed border border-transparent text-[#5C5570]"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-xs font-black ${isActive ? "text-[#8F60BF]" : "text-[#1E1B2E]"}`}>
                {s.title}
              </span>
              {s.num === 1 && hasData && (
                <i className="fa-solid fa-circle-check text-emerald-500 text-xs" />
              )}
              {s.num === 2 && hitl1Approved && (
                <i className="fa-solid fa-circle-check text-emerald-500 text-xs" />
              )}
            </div>
            <span className="text-[10px] text-[#5C5570] block leading-tight">{s.desc}</span>
          </button>
        );
      })}
    </nav>
  );
}
