"use client";

import React, { useState } from "react";
import {
  CuteOwlMascot,
  YtBotIcon,
} from "@/components/icons/YouTubeIcons";

interface FloatingMascotProps {
  onOpenCopilot: () => void;
  onGoToStep1: () => void;
}

export function FloatingMascot({
  onOpenCopilot,
  onGoToStep1,
}: FloatingMascotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2 select-none">
      {/* Speech bubble on mascot hover */}
      {showTooltip && (
        <div className="animate-fade-in p-2.5 bg-white text-[#1E2E2A] rounded-2xl border border-[#ECD8F2] shadow-xl text-xs font-bold max-w-[210px] mb-1 relative mr-2">
          <span>👋 Chào bạn! Cần giải thích rò rỉ dòng tiền hay bóc tách P&amp;L? Bấm vào tôi nhé!</span>
          <div className="w-2.5 h-2.5 bg-white border-b border-r border-[#ECD8F2] transform rotate-45 absolute -bottom-1.5 right-6" />
        </div>
      )}

      {/* Mascot Character (Interactive cute owl) */}
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onOpenCopilot}
        className="cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-200 flex flex-col items-center group relative"
      >
        {/* Glow halo in purple-cyan */}
        <div className="absolute inset-0 bg-[#8F60BF]/25 rounded-full blur-md group-hover:bg-[#079DD9]/35 transition" />

        {/* Mascot SVG */}
        <div className="relative z-10 w-16 h-16 filter drop-shadow-[0_8px_16px_rgba(143,96,191,0.45)] animate-bounce-gentle">
          <CuteOwlMascot className="w-full h-full" />
        </div>

        {/* Small badge matching hero purple/cyan palette */}
        <span className="relative z-10 -mt-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#079DD9] to-[#8F60BF] text-white text-[9px] font-black shadow-md flex items-center space-x-1 border border-white/40">
          <YtBotIcon className="w-2.5 h-2.5 text-[#99D9F2]" />
          <span>Trợ Lý AI</span>
        </span>
      </div>

      {/* Expandable "+" Button: Styled in purple-cyan gradient matching the hero */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onGoToStep1}
          title="Tải file - Bước 1: Khởi tạo bối cảnh & Tích hợp nguồn dữ liệu"
          className="group flex items-center h-11 px-3.5 rounded-full bg-gradient-to-r from-[#079DD9] via-[#068ac0] to-[#8F60BF] hover:from-[#068ac0] hover:to-[#7b4fa8] text-white shadow-[0_8px_25px_rgba(7,157,217,0.5)] hover:shadow-[0_12px_30px_rgba(143,96,191,0.65)] border border-white/30 transition-all duration-300 ease-out cursor-pointer hover:scale-105 active:scale-95"
        >
          {/* Bold Plus Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white shrink-0 group-hover:rotate-90 transition-transform duration-300"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>

          {/* Text expands smoothly on hover */}
          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-out text-xs font-bold text-white tracking-wide">
            Tải file
          </span>
        </button>
      </div>
    </div>
  );
}
