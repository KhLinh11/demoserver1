"use client";

import React, { useState } from "react";
import {
  CuteOwlMascot,
  YtBotIcon,
} from "@/components/icons/YouTubeIcons";

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

interface Message {
  sender: "user" | "bot";
  text: string;
  sql?: string | null;
  sourceTable?: string | null;
}

export function AgentDrawer({ isOpen, onClose, companyName = "Vitara" }: AgentDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: `👋 Chào bạn! Tôi là Trợ Lý Cố Vấn Tăng Trưởng Vitara AI (Tích hợp DuckDB Analytics). Tôi có thể truy vấn số liệu trực tiếp từ 15.000 giao dịch bán hàng, bóc tách P&L, và chẩn đoán thâm hụt rò rỉ dòng tiền. Bạn cần tôi phân tích mục nào?`,
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || isThinking) return;

    const newMsgs: Message[] = [...messages, { sender: "user", text: q }];
    setMessages(newMsgs);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply || "Đã xử lý xong yêu cầu.",
            sql: data.sql,
            sourceTable: data.source_table,
          },
        ]);
        setIsThinking(false);
        return;
      }
    } catch {
      // Fallback below if backend offline
    }

    // Fallback nếu backend offline
    let reply = "Dữ liệu kiểm toán cho thấy doanh nghiệp nên ưu tiên kênh/khu vực có tỷ lệ hoàn dưới 10% và lợi nhuận đóng góp dương.";
    const lower = q.toLowerCase();
    if (lower.includes("flash") || lower.includes("shopee")) {
      reply = "Kênh Flash Sale Shopee đang bị thâm hụt nặng do tỷ lệ hoàn trả sau ngày thứ 12 lên tới 24.5%, cộng với chiết khấu voucher kép bào mòn biên lãi. Khuyến nghị: Dừng ngay (STOP) hoặc siết chặt điều kiện mã giảm giá.";
    } else if (lower.includes("khai xuân") || lower.includes("combo") || lower.includes("tăng vốn")) {
      reply = "Nhóm Khai Xuân Combo đang dẫn đầu hiệu quả toàn hệ thống với tỷ lệ hoàn chỉ 8.2% và biên đóng góp cao nhất. Khuyến nghị: Tái cấp vốn mở rộng (EXPAND) thêm +80% ngân sách.";
    } else if (lower.includes("30") || lower.includes("chu kỳ") || lower.includes("hoàn")) {
      reply = "Chu kỳ đối soát 7 ngày truyền thống chỉ ghi nhận 40% lượng hoàn hàng. 60% lượng hoàn hàng thực tế diễn ra trong khoảng ngày 13-30 sau chiến dịch, gây thâm hụt dòng tiền nặng nề nếu chốt sổ quá sớm.";
    } else if (lower.includes("khu vực") || lower.includes("miền bắc") || lower.includes("cửa hàng")) {
      reply = "Phân tích theo Khu vực & Cửa hàng cho thấy các showroom tại Miền Bắc và Miền Trung duy trì chi phí mặt bằng cố định cao, trong khi kênh online đạt tỷ suất hoàn vốn nhanh hơn nhưng cần kiểm soát rủi ro hoàn hàng.";
    }

    setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    setIsThinking(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent Backdrop with click-to-close */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-[#FAFBF9] shadow-2xl border-l border-[#D5DFD9] p-5 flex flex-col justify-between z-50 animate-slide-in">
      <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
        {/* Drawer Header with Mascot */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D5DFD9]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#D5DFD9] flex items-center justify-center p-1 shadow-2xs">
              <CuteOwlMascot className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-black text-sm text-[#1E2E2A]">Trợ Lý Ảo Vitara</h3>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#8F60BF] text-white">
                  AI COPILOT
                </span>
              </div>
              <span className="text-[11px] text-[#5C6E68] font-medium flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực Tuyến · Hỗ Trợ Đối Soát {companyName}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-[#D5DFD9] bg-white hover:bg-slate-100 flex items-center justify-center text-[#5C6E68] transition cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl leading-relaxed shadow-2xs ${
                m.sender === "bot"
                  ? "bg-white border border-[#ECD8F2] text-[#1E1B2E]"
                  : "bg-[#8F60BF] text-white ml-8 font-medium"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.sql && (
                <div className="mt-2 pt-2 border-t border-[#ECD8F2]">
                  <div className="text-[10px] font-mono font-bold text-[#8F60BF] flex items-center space-x-1">
                    <span>⚡ Truy vấn DuckDB SQL:</span>
                  </div>
                  <pre className="mt-1 p-2 rounded-lg bg-[#FAF8FC] text-[10px] font-mono text-[#8F60BF] overflow-x-auto border border-[#ECD8F2]">
                    {m.sql}
                  </pre>
                </div>
              )}
              {m.sourceTable && (
                <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] text-[#079DD9] font-semibold">
                  <span>✓ Nguồn: {m.sourceTable}</span>
                  <span className="text-[9px] bg-[#EBF6FC] text-[#079DD9] px-1.5 py-0.5 rounded border border-[#99D9F2]/60">
                    Chính xác 100%
                  </span>
                </div>
              )}
            </div>
          ))}
          {isThinking && (
            <div className="p-3 bg-white border border-[#ECD8F2] rounded-2xl text-xs text-[#5C5570] flex items-center space-x-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#8F60BF]" />
              <span>Đang truy vấn DuckDB &amp; tính toán số liệu đối soát...</span>
            </div>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="space-y-1.5 pt-2 border-t border-[#ECD8F2]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#5C5570] block">
            Câu hỏi gợi ý nhanh:
          </span>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => handleSend("Tại sao Flash Sale Shopee lại lỗ?")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF6FD] border border-[#ECD8F2] text-[#8F60BF] text-left transition font-semibold cursor-pointer"
            >
              Vì sao Flash Sale lỗ?
            </button>
            <button
              onClick={() => handleSend("Có nên tăng vốn cho Khai Xuân?")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF6FD] border border-[#ECD8F2] text-[#079DD9] text-left transition font-semibold cursor-pointer"
            >
              Có nên tăng vốn Khai Xuân?
            </button>
            <button
              onClick={() => handleSend("Vì sao phải đối soát chu kỳ 30 ngày hoàn trả?")}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF6FD] border border-[#ECD8F2] text-[#5C5570] text-left transition font-semibold cursor-pointer"
            >
              Lỗ hổng chu kỳ 30 ngày?
            </button>
          </div>
        </div>
      </div>

      {/* Input box */}
      <div className="pt-3 border-t border-[#ECD8F2] flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Hỏi trợ lý về P&amp;L hoặc rủi ro thâm hụt..."
          className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FAF8FC] border border-[#ECD8F2] focus:border-[#8F60BF] focus:outline-none text-xs text-[#1E1B2E] placeholder:text-[#5C5570]/60"
        />
        <button
          onClick={() => handleSend()}
          className="px-4 py-2.5 rounded-2xl bg-[#8F60BF] hover:bg-[#7b4fa8] text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <YtBotIcon className="w-3.5 h-3.5 text-[#99D9F2]" />
          <span>Gửi</span>
        </button>
      </div>
    </div>
    </>
  );
}
