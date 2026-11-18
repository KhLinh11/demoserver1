"use client";

import React, { useState } from "react";
import { AttributionModel, ChannelMetric } from "@/types";
import { formatVND } from "@/lib/format";

interface Step4SimulationProps {
  channels: ChannelMetric[];
  attributionModel: AttributionModel;
  onModelChange: (model: AttributionModel) => void;
  returnFactor: number;
  onReturnFactorChange: (factor: number) => void;
  availableDimensions?: string[];
  activeDimension?: string;
  onDimensionChange?: (dim: string) => void;
  onProceedToStep5: () => void;
}

export function Step4Simulation({
  channels,
  attributionModel,
  onModelChange,
  returnFactor,
  onReturnFactorChange,
  availableDimensions = ["Kênh bán"],
  activeDimension = "Kênh bán",
  onDimensionChange,
  onProceedToStep5,
}: Step4SimulationProps) {
  // What-If Sliders State
  const [cutPercent, setCutPercent] = useState<number>(100);
  const [returnReduction, setReturnReduction] = useState<number>(30);
  const [reinvestPercent, setReinvestPercent] = useState<number>(80);

  const worstChannel = channels.length > 0 ? channels[channels.length - 1] : null;
  const bestChannel = channels.length > 0 ? channels[0] : null;

  // Calculate dynamic projected net profit
  const baseNet = channels.reduce((s, c) => s + c.contribution_profit, 0);
  const worstLoss = worstChannel && worstChannel.contribution_profit < 0 ? Math.abs(worstChannel.contribution_profit) : 0;
  const totalReturns = channels.reduce((s, c) => s + (c.gross_revenue * (c.return_rate / 100)), 0);
  const bestProfit = bestChannel && bestChannel.contribution_profit > 0 ? bestChannel.contribution_profit : 10000000;

  const simulatedNet =
    baseNet +
    worstLoss * (cutPercent / 100) +
    totalReturns * 0.3 * (returnReduction / 100) +
    bestProfit * (reinvestPercent / 100) * 0.35;

  const isSimulatedPositive = simulatedNet >= 0;

  return (
    <div className="space-y-6">
      {/* 5-Whys Diagnostic Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#ECD8F2]">
          <i className="fa-solid fa-brain text-[#8F60BF]" />
          <h3 className="font-extrabold text-base text-[#1E1B2E]">
            Bóc Tách Căn Nguyên (5-Whys Root Cause Analysis)
          </h3>
        </div>
        <p className="text-xs text-[#5C5570] leading-relaxed">
          <strong>Phát hiện đối soát:</strong> Nhóm đối tượng có doanh thu danh nghĩa cao nhất không đồng nghĩa với lợi nhuận cao nhất.
          Sau khi đối chiếu chi phí thực tế và tỷ lệ thu hồi hàng hoàn, cấu trúc đóng góp dòng tiền có sự phân hoá rõ rệt theo từng <strong>{activeDimension}</strong>.
        </p>
      </div>

      {/* Model & Sensitivity Controls */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-extrabold text-base text-[#1E1B2E]">
              Mô Phỏng Đảo Thứ Hạng (Rank Shift Analysis)
            </h3>
            {availableDimensions.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-[#FAF6FD] px-2.5 py-1 rounded-xl border border-[#ECD8F2]">
                <span className="text-[11px] font-bold text-[#5C5570]">Chiều:</span>
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

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#5C5570]">Mô hình Attribution:</span>
            <select
              value={attributionModel}
              onChange={(e) => onModelChange(e.target.value as AttributionModel)}
              className="px-3 py-1.5 rounded-xl border border-[#ECD8F2] text-xs font-bold text-[#8F60BF] bg-[#FAF6FD] focus:outline-none"
            >
              <option value="data_driven">Data-Driven (Khuyên Dùng)</option>
              <option value="last_touch">Last Touch</option>
              <option value="first_touch">First Touch</option>
              <option value="linear">Linear (Chia Đều)</option>
              <option value="u_shaped">U-Shaped</option>
            </select>
          </div>
        </div>

        {/* Return Window Slider */}
        <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-xs text-[#1E1B2E] block">
              Cửa Sổ Theo Dõi Hoàn Hàng &amp; Đối Soát: {Math.round(returnFactor * 30)} ngày
            </span>
            <span className="text-[11px] text-[#5C5570]">
              Điều chỉnh cửa sổ đối soát từ 7 ngày (SLA ngắn) đến 45 ngày (chu kỳ toàn phần).
            </span>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-64">
            <span className="text-[11px] text-[#5C5570]">7d</span>
            <input
              type="range"
              min="0.25"
              max="1.5"
              step="0.05"
              value={returnFactor}
              onChange={(e) => onReturnFactorChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#8F60BF]"
            />
            <span className="text-[11px] text-[#5C5570]">45d</span>
          </div>
        </div>

        {/* Rank Shift Table */}
        <div className="overflow-x-auto rounded-xl border border-[#ECD8F2]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8FC] text-[#5C5570] font-semibold border-b border-[#ECD8F2]">
              <tr>
                <th className="p-3">{activeDimension}</th>
                <th className="p-3 text-center">Hạng DT Cũ</th>
                <th className="p-3 text-center">Hạng Lãi Mới</th>
                <th className="p-3 text-center">Biến Động Hạng</th>
                <th className="p-3 text-right">Lợi Nhuận Thực Tế</th>
                <th className="p-3 text-center">Khuyến Nghị Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECD8F2]">
              {channels.map((ch) => {
                const shift = ch.rank_old - ch.rank_new;
                const isLoss = ch.contribution_profit < 0;
                let rec = "MAINTAIN (Duy trì)";
                let recClass = "bg-white border border-[#ECD8F2] text-[#5C5570]";
                if (isLoss) {
                  rec = "STOP (Cắt giảm)";
                  recClass = "bg-[#ECD8F2] text-[#8F60BF]";
                } else if (shift > 0 || ch.rank_new === 1) {
                  rec = "EXPAND (Mở rộng)";
                  recClass = "bg-[#FAF6FD] text-[#079DD9] border border-[#079DD9]/30";
                } else if (ch.return_rate > 15) {
                  rec = "ADJUST (Siết SLA)";
                  recClass = "bg-amber-100 text-amber-800";
                }

                return (
                  <tr key={ch.channel} className="hover:bg-[#FAF6FD] transition">
                    <td className="p-3 font-semibold text-[#1E1B2E]">{ch.channel}</td>
                    <td className="p-3 text-center font-mono font-medium text-[#5C5570]">
                      #{ch.rank_old}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[#8F60BF]">
                      #{ch.rank_new}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {shift > 0 ? (
                        <span className="text-[#079DD9]">&uarr; Tăng {shift} hạng</span>
                      ) : shift < 0 ? (
                        <span className="text-[#8F60BF]">&darr; Tụt {Math.abs(shift)} hạng</span>
                      ) : (
                        <span className="text-[#5C5570]">↔ Giữ nguyên</span>
                      )}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-bold ${
                        isLoss ? "text-[#8F60BF]" : "text-[#079DD9]"
                      }`}
                    >
                      {formatVND(ch.contribution_profit)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${recClass}`}>
                        {rec}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* What-If Decision Simulator */}
      <div className="p-6 rounded-2xl bg-white border border-[#ECD8F2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ECD8F2] gap-2">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-wand-magic-sparkles text-[#8F60BF]" />
            <h3 className="font-extrabold text-base text-[#1E1B2E]">
              Phòng Giả Lập Ra Quyết Định (What-If Simulator)
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#5C5570]">Lợi nhuận dự báo sau điều chuyển:</span>
            <span
              className={`font-mono font-bold px-3 py-1.5 rounded-xl border text-sm ${
                isSimulatedPositive
                  ? "bg-[#FAF6FD] text-[#079DD9] border-[#079DD9]/30"
                  : "bg-[#ECD8F2] text-[#8F60BF] border-[#8F60BF]/30"
              }`}
            >
              {isSimulatedPositive ? "+" : "-"}
              {formatVND(Math.abs(simulatedNet))} ({isSimulatedPositive ? "DƯƠNG" : "ÂM"})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#1E1B2E] truncate">
                Cắt chi phí nhóm yếu nhất ({worstChannel?.channel || "rò rỉ"}):
              </span>
              <span className="font-mono text-[#8F60BF]">-{cutPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cutPercent}
              onChange={(e) => setCutPercent(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#8F60BF]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#1E1B2E]">Mục tiêu kéo giảm hoàn hàng:</span>
              <span className="font-mono text-[#1E1B2E]">-{returnReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={returnReduction}
              onChange={(e) => setReturnReduction(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#8F60BF]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8FC] border border-[#ECD8F2] space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#1E1B2E] truncate">
                Tái cấp vốn sang nhóm sinh lời ({bestChannel?.channel || "hiệu quả"}):
              </span>
              <span className="font-mono text-[#079DD9]">+{reinvestPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={reinvestPercent}
              onChange={(e) => setReinvestPercent(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-[#ECD8F2] rounded accent-[#079DD9]"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#ECD8F2] flex justify-end">
          <button
            onClick={onProceedToStep5}
            className="px-5 py-2.5 rounded-xl bg-[#079DD9] hover:bg-[#068ac0] text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
          >
            <span>Sang Báo Cáo P&amp;L 12 Dòng (Bước 5)</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
