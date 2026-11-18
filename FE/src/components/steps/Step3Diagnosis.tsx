"use client";

import React, { useState } from "react";
import { ChannelMetric } from "@/types";
import { formatVND } from "@/lib/format";

interface Step3DiagnosisProps {
  channels: ChannelMetric[];
  availableDimensions?: string[];
  activeDimension?: string;
  onDimensionChange?: (dim: string) => void;
  onProceedToStep4: () => void;
}

export function Step3Diagnosis({
  channels,
  availableDimensions = ["Kênh bán"],
  activeDimension = "Kênh bán",
  onDimensionChange,
  onProceedToStep4,
}: Step3DiagnosisProps) {
  const [focusTopic, setFocusTopic] = useState<"all" | "leakage" | "voucher" | "ops">("all");

  const topics = [
    { key: "all", label: "Tất Cả Rủi Ro" },
    { key: "leakage", label: "Đổi Trả Trễ 30 Ngày" },
    { key: "voucher", label: "Bào Mòn Chi Phí / Voucher" },
    { key: "ops", label: "Chi Phí Vận Hành Ẩn" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Risk Alert Banner */}
      <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#ECD8F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#8F60BF] text-white flex items-center justify-center text-lg shadow-xs">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1E1B2E]">
              Chẩn Đoán Rủi Ro Thâm Hụt Dòng Tiền &amp; Chi Phí Ngầm
            </h4>
            <p className="text-[11px] text-[#5C5570]">
              Bóc tách các khoản chi phí biến phí, hoàn hàng trễ sau 12 ngày và bào mòn biên lợi nhuận thực tế theo từng phân đoạn.
            </p>
          </div>
        </div>

        {/* Dynamic Dimension Selector Bar */}
        {availableDimensions.length > 1 && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-[#ECD8F2] shadow-xs">
            <span className="text-[11px] font-bold text-[#5C5570] flex items-center space-x-1">
              <i className="fa-solid fa-layer-group text-[#8F60BF]" />
              <span>Góc nhìn:</span>
            </span>
            <select
              value={activeDimension}
              onChange={(e) => onDimensionChange?.(e.target.value)}
              className="text-xs font-black text-[#8F60BF] bg-transparent focus:outline-none cursor-pointer"
            >
              {availableDimensions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {topics.map((t) => (
              <button
                key={t.key}
                onClick={() => setFocusTopic(t.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  focusTopic === t.key
                    ? "bg-[#8F60BF] text-white shadow-xs"
                    : "bg-[#FAF8FC] text-[#5C5570] hover:text-[#1E1B2E] border border-[#ECD8F2]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#5C5570]">
            Phân tích theo <strong>{activeDimension}</strong> ({channels.length} đối tượng)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
              <tr>
                <th className="p-3">{activeDimension}</th>
                <th className="p-3 text-right">Doanh Thu Thô</th>
                <th className="p-3 text-right">Thực Thu Sau Đối Soát</th>
                <th className="p-3 text-center">Tỷ Lệ Hoàn (%)</th>
                <th className="p-3 text-right">Chi Phí Tiếp Thị / Vận Hành</th>
                <th className="p-3 text-right">Lợi Nhuận Đóng Góp</th>
                <th className="p-3 text-center">Đánh Giá Rủi Ro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {channels.map((ch) => {
                const isLoss = ch.contribution_profit < 0;
                return (
                  <tr key={ch.channel} className="hover:bg-[#FAF6FD] transition">
                    <td className="p-3 font-semibold text-[#1E1B2E]">{ch.channel}</td>
                    <td className="p-3 text-right font-mono font-medium text-[#1E1B2E]">
                      {formatVND(ch.gross_revenue)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#8F60BF]">
                      {formatVND(ch.audited_net)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[#5C5570]">
                      {ch.return_rate.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono text-[#5C5570]">
                      {formatVND(ch.ads_spend)}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-bold ${
                        isLoss ? "text-[#8F60BF]" : "text-[#079DD9]"
                      }`}
                    >
                      {formatVND(ch.contribution_profit)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isLoss
                            ? "bg-[#ECD8F2] text-[#8F60BF]"
                            : ch.return_rate > 15
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isLoss ? "THÂM HỤT NẶNG" : ch.return_rate > 15 ? "RỦI RO HOÀN CAO" : "AN TOÀN / HIỆU QUẢ"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-[#ECD8F2] flex justify-end">
          <button
            onClick={onProceedToStep4}
            className="px-5 py-2.5 rounded-xl bg-[#079DD9] hover:bg-[#068ac0] text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <span>Xem Giả Lập Quyết Định (Bước 4)</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
